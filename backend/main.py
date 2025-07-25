import argparse
import asyncio
import os
import sys
from contextlib import asynccontextmanager
from typing import Dict

import uvicorn
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI
from fastapi.responses import FileResponse
from loguru import logger

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.deepgram.tts import DeepgramTTSService
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.transports.base_transport import TransportParams
from pipecat.transports.network.small_webrtc import SmallWebRTCTransport
from pipecat.transports.network.webrtc_connection import (
    IceServer,
    SmallWebRTCConnection,
)

# Load environment variables
load_dotenv("../.env.local", override=True)

app = FastAPI()

# Store connections by pc_id
pcs_map: Dict[str, SmallWebRTCConnection] = {}

ice_servers = [
    IceServer(
        urls="stun:stun.l.google.com:19302",
    )
]


# Tool function for searching materials (empty implementation for now)
async def search_materials(query: str) -> str:
    """Search through user's uploaded study materials.

    Args:
        query: The search query to find relevant content

    Returns:
        Empty string for now - to be implemented later
    """
    # TODO: Implement material search functionality
    return "Search functionality will be implemented soon."


async def run_bot(webrtc_connection):
    pipecat_transport = SmallWebRTCTransport(
        webrtc_connection=webrtc_connection,
        params=TransportParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
            audio_out_10ms_chunks=2,
        ),
    )

    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))
    logger.info(f"STT service initialized: {bool(os.getenv('DEEPGRAM_API_KEY'))}")
    
    tts = DeepgramTTSService(
        api_key=os.getenv("DEEPGRAM_API_KEY"),
        voice="aura-luna-en",
    )
    logger.info(f"TTS service initialized: {bool(os.getenv('DEEPGRAM_API_KEY'))}")

    logger.info(f"OpenAI API key available: {bool(os.getenv('OPENAI_API_KEY'))}")

    # Define tools for the LLM
    tools = [
        {
            "type": "function",
            "function": {
                "name": "search_materials",
                "description": "Search through the user's uploaded study materials to find relevant content",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The search query to find relevant content",
                        }
                    },
                    "required": ["query"],
                },
            },
        }
    ]

    llm = OpenAILLMService(
        api_key=os.getenv("OPENAI_API_KEY"), model="gpt-4o-mini", tools=tools
    )

    messages = [
        {
            "role": "system",
            "content": """You are Optiq Agent, an AI study partner helping students learn from their uploaded materials.

Your task is to help users understand and learn from their study materials. Keep your responses concise and helpful - aim for 1-2 sentences unless more detail is needed.

When users ask questions about their materials, use the search_materials tool to find relevant content first, then provide helpful explanations based on what you find.

You should be encouraging, educational, and adaptive to the user's learning style.""",
        },
    ]

    context = OpenAILLMContext(messages)
    context_aggregator = llm.create_context_aggregator(context)

    # Register the tool function
    llm.register_function("search_materials", search_materials)

    pipeline = Pipeline(
        [
            pipecat_transport.input(),
            stt,
            context_aggregator.user(),
            llm,
            tts,
            pipecat_transport.output(),
            context_aggregator.assistant(),
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
    )

    @pipecat_transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.info("Pipecat Client connected")
        # Kick off the conversation with an initial greeting
        await task.queue_frames([context_aggregator.user().get_context_frame()])

    @pipecat_transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info("Pipecat Client disconnected")
        await task.cancel()

    runner = PipelineRunner(handle_sigint=False)

    await runner.run(task)


@app.post("/api/offer")
async def offer(request: dict, background_tasks: BackgroundTasks):
    pc_id = request.get("pc_id")

    if pc_id and pc_id in pcs_map:
        pipecat_connection = pcs_map[pc_id]
        logger.info(f"Reusing existing connection for pc_id: {pc_id}")
        await pipecat_connection.renegotiate(sdp=request["sdp"], type=request["type"])
    else:
        pipecat_connection = SmallWebRTCConnection(ice_servers)
        await pipecat_connection.initialize(sdp=request["sdp"], type=request["type"])

        @pipecat_connection.event_handler("closed")
        async def handle_disconnected(webrtc_connection: SmallWebRTCConnection):
            logger.info(
                f"Discarding peer connection for pc_id: {webrtc_connection.pc_id}"
            )
            pcs_map.pop(webrtc_connection.pc_id, None)

        background_tasks.add_task(run_bot, pipecat_connection)

    answer = pipecat_connection.get_answer()
    # Updating the peer connection inside the map
    pcs_map[answer["pc_id"]] = pipecat_connection

    return answer


@app.get("/")
async def serve_index():
    return FileResponse("index.html")


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield  # Run app
    coros = [pc.disconnect() for pc in pcs_map.values()]
    await asyncio.gather(*coros)
    pcs_map.clear()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="WebRTC demo")
    parser.add_argument(
        "--host", default="localhost", help="Host for HTTP server (default: localhost)"
    )
    parser.add_argument(
        "--port", type=int, default=7860, help="Port for HTTP server (default: 7860)"
    )
    parser.add_argument("--verbose", "-v", action="count")
    args = parser.parse_args()

    logger.remove(0)
    if args.verbose:
        logger.add(sys.stderr, level="TRACE")
    else:
        logger.add(sys.stderr, level="DEBUG")

    uvicorn.run(app, host=args.host, port=args.port)
