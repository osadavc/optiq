"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { useSearchParams } from "next/navigation";
import { createContext, useContext, useState, ReactNode } from "react";
import { Citation } from "@/components/assistant-ui/citations";
import {
  QuizToolUI,
  VerifyAnswerToolUI,
} from "@/components/assistant-ui/quiz-ui";
import { FlashCardsToolUI } from "@/components/assistant-ui/flashcard-ui";
import { MindMapToolUI } from "@/components/assistant-ui/mindmap-ui-improved";
import { SearchMaterialsToolUI } from "@/components/assistant-ui/search-ui";

interface CitationsContextType {
  citations: Citation[];
  setCitations: (citations: Citation[]) => void;
}

const CitationsContext = createContext<CitationsContextType | undefined>(
  undefined
);

export const useCitations = () => {
  const context = useContext(CitationsContext);
  if (!context) {
    throw new Error("useCitations must be used within a CitationsProvider");
  }
  return context;
};

interface CitationsProviderProps {
  children: ReactNode;
}

const CitationsProvider = ({ children }: CitationsProviderProps) => {
  const [citations, setCitations] = useState<Citation[]>([]);

  return (
    <CitationsContext.Provider value={{ citations, setCitations }}>
      {children}
    </CitationsContext.Provider>
  );
};

export const Assistant = () => {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lesson");

  const runtime = useChatRuntime({
    api: "/api/chat",
    onError: (error) => {
      console.error("Chat runtime error:", error);
    },
    // Pass lessonId as additional body data
    body: lessonId ? { lessonId: parseInt(lessonId) } : {},
  });

  return (
    <CitationsProvider>
      <AssistantRuntimeProvider runtime={runtime}>
        <QuizToolUI />
        <VerifyAnswerToolUI />
        <FlashCardsToolUI />
        <MindMapToolUI />
        <SearchMaterialsToolUI />
        <div className="h-full w-full">
          <Thread />
        </div>
      </AssistantRuntimeProvider>
    </CitationsProvider>
  );
};
