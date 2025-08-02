# 🎓 Optiq - AI-Powered Study Platform

Optiq is an AI-powered study platform that helps students centralize all their study resources in one place. Upload documents, generate interactive quizzes, flashcards, mind maps, and get personalized help through RAG-powered chat and voice interaction.

## ✨ Features

- **📚 Document Upload & Processing**: Upload PDFs, DOCX, and PPTX files with automatic text extraction and chunking
- **🤖 AI-Powered Chat**: Get personalized answers from your study materials using RAG (Retrieval-Augmented Generation)
- **🎯 Interactive Quizzes**: Generate custom quizzes with multiple choice and short answer questions
- **📝 Smart Flashcards**: Create adaptive flashcards for effective memorization
- **🧠 Mind Maps**: Visualize concepts with interactive mind maps
- **📖 Automatic Note Taking**: Generate structured study notes from your materials
- **🎙️ Voice Assistant**: Real-time voice interaction powered by Pipecat AI and WebRTC
- **🔍 Semantic Search**: Find relevant content across all your documents
- **📊 Progress Tracking**: Monitor your learning progress and quiz results

## 🚀 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Assistant UI** - AI chat interface components
- **Shadcn** - Accessible UI components

### Backend & AI
- **OpenAI GPT-4o-mini** - Language model for chat and content generation
- **Pinecone** - Vector database for document embeddings and search
- **FastAPI** - Python backend for voice assistant
- **Pipecat AI** - Real-time voice conversation pipeline
- **Deepgram** - Speech-to-text and text-to-speech services

### Database & Storage
- **Neon PostgreSQL** - Serverless PostgreSQL database
- **Drizzle ORM** - Type-safe database toolkit

## 🛠️ Prerequisites

Before running the application, make sure you have:

- **Node.js** (v18 or later)
- **Python** (v3.10 or later)
- **Yarn** or **npm**
- **uv** (for Python dependency management)

## 📋 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
DATABASE_URL=your_neon_postgresql_database_url_here

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=optiq-documents
PINECONE_INDEX_HOST=your_pinecone_index_host_here

# Deepgram Configuration (for voice features)
DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

## 🚀 Quick Start

```bash
# Clone and install dependencies
git clone https://github.com/yourusername/optiq.git
cd optiq
bun install

# Setup backend
cd backend && uv sync && cd ..

# Setup database
bun db:generate && bun db:migrate

# Start frontend (http://localhost:3000)
bun dev

# Start voice assistant backend (optional - http://localhost:7860)
cd backend && python main.py
```

## 📖 Usage

1. **Upload Documents**: Click the upload button to add PDF, DOCX, or PPTX files
2. **Chat with AI**: Ask questions about your documents in the chat interface
3. **Generate Study Materials**: 
   - Say "quiz me on [topic]" to generate interactive quizzes
   - Say "create flashcards about [topic]" for study flashcards
   - Say "make a mind map of [topic]" for visual concept maps
   - Say "take notes on [topic]" for structured study notes
4. **Voice Assistant** (WIP): Click the voice button to have real-time conversations about your materials
5. **Search & Explore**: Use the search functionality to find specific content across all documents

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Issues & Support

If you encounter any issues or have questions, please open an issue in the GitHub repository.