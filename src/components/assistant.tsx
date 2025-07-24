"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";

export const Assistant = () => {
  const runtime = useChatRuntime({
    api: "/api/chat",
    onError: (error) => {
      console.error("Chat runtime error:", error);
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="h-full w-full">
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  );
};