"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckIcon, XIcon, RotateCcwIcon, CreditCardIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon, EyeOffIcon } from "lucide-react";

// Types for flash cards
type FlashCard = {
  id: string;
  front: string;
  back: string;
  difficulty: "easy" | "medium" | "hard";
};

type FlashCardsData = {
  topic: string;
  cards: FlashCard[];
  currentCardIndex: number;
  totalCards: number;
};

type CardResult = {
  cardId: string;
  difficulty: "easy" | "medium" | "hard";
  wasCorrect: boolean;
  needsReview: boolean;
};

// Individual Flash Card Component
const FlashCardComponent = ({
  card,
  onMarkCorrect,
  onMarkIncorrect,
  onMarkReview,
  showResult,
  result,
}: {
  card: FlashCard;
  onMarkCorrect: () => void;
  onMarkIncorrect: () => void;
  onMarkReview: () => void;
  showResult: boolean;
  result?: CardResult;
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-600 bg-green-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "hard":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getResultColor = (result?: CardResult) => {
    if (!result) return "";
    if (result.wasCorrect) return "border-green-500 bg-green-50";
    if (result.needsReview) return "border-yellow-500 bg-yellow-50";
    return "border-red-500 bg-red-50";
  };

  return (
    <div className="space-y-4">
      {/* Flash Card */}
      <div
        className={cn(
          "relative w-full h-64 cursor-pointer transition-all duration-300 transform-gpu",
          "perspective-1000",
          showResult && getResultColor(result)
        )}
        onClick={() => !showResult && setIsFlipped(!isFlipped)}
      >
        <div
          className={cn(
            "w-full h-full relative transition-transform duration-500 transform-style-preserve-3d",
            isFlipped && "rotate-y-180"
          )}
        >
          {/* Front of card */}
          <div className="absolute inset-0 w-full h-full backface-hidden">
            <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-white shadow-sm">
              <div className="flex items-center justify-between w-full mb-4">
                <span
                  className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    getDifficultyColor(card.difficulty)
                  )}
                >
                  {card.difficulty}
                </span>
                <div className="flex items-center gap-1 text-gray-400">
                  <EyeOffIcon className="h-4 w-4" />
                  <span className="text-xs">Click to reveal</span>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center text-center">
                <p className="text-lg font-medium text-gray-900">{card.front}</p>
              </div>
              <div className="text-center mt-4">
                <p className="text-sm text-gray-500">
                  {showResult ? "Card completed" : "Tap to reveal answer"}
                </p>
              </div>
            </div>
          </div>

          {/* Back of card */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
            <div className="w-full h-full border-2 border-solid border-blue-300 rounded-lg p-6 flex flex-col items-center justify-center bg-blue-50 shadow-sm">
              <div className="flex items-center justify-between w-full mb-4">
                <span
                  className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    getDifficultyColor(card.difficulty)
                  )}
                >
                  {card.difficulty}
                </span>
                <div className="flex items-center gap-1 text-blue-600">
                  <EyeIcon className="h-4 w-4" />
                  <span className="text-xs">Answer revealed</span>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center text-center">
                <p className="text-base text-gray-800 leading-relaxed">{card.back}</p>
              </div>
              <div className="text-center mt-4">
                <p className="text-sm text-blue-600">
                  {showResult ? "Card completed" : "How did you do?"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isFlipped && !showResult && (
        <div className="flex justify-center gap-3">
          <Button
            onClick={onMarkIncorrect}
            variant="outline"
            className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-50"
          >
            <XIcon className="h-4 w-4" />
            Incorrect
          </Button>
          <Button
            onClick={onMarkReview}
            variant="outline"
            className="flex items-center gap-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          >
            <RotateCcwIcon className="h-4 w-4" />
            Review
          </Button>
          <Button
            onClick={onMarkCorrect}
            variant="outline"
            className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
          >
            <CheckIcon className="h-4 w-4" />
            Correct
          </Button>
        </div>
      )}

      {/* Result Display */}
      {showResult && result && (
        <div
          className={cn(
            "p-3 rounded-lg border text-center",
            result.wasCorrect && "bg-green-50 border-green-200",
            result.needsReview && "bg-yellow-50 border-yellow-200",
            !result.wasCorrect && !result.needsReview && "bg-red-50 border-red-200"
          )}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            {result.wasCorrect ? (
              <CheckIcon className="h-4 w-4 text-green-600" />
            ) : result.needsReview ? (
              <RotateCcwIcon className="h-4 w-4 text-yellow-600" />
            ) : (
              <XIcon className="h-4 w-4 text-red-600" />
            )}
            <span
              className={cn(
                "font-medium text-sm",
                result.wasCorrect && "text-green-800",
                result.needsReview && "text-yellow-800",
                !result.wasCorrect && !result.needsReview && "text-red-800"
              )}
            >
              {result.wasCorrect
                ? "Well done!"
                : result.needsReview
                ? "For review"
                : "Keep studying"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Flash Cards Tool UI
export const FlashCardsToolUI = makeAssistantToolUI<
  { topic: string; cardCount?: number },
  {
    flashCardsData: FlashCardsData;
    results: CardResult[];
    completed: boolean;
  }
>({
  toolName: "generateFlashCards",
  render: ({ args, result, status, addResult }) => {
    const [currentResults, setCurrentResults] = useState<CardResult[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);

    if (status.type === "running") {
      return (
        <div className="flex items-center gap-3 p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <div>
            <h3 className="font-medium">Generating flash cards...</h3>
            <p className="text-sm text-muted-foreground">
              Creating cards about {args.topic}
            </p>
          </div>
        </div>
      );
    }

    if (!result?.flashCardsData) {
      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <p className="text-red-800">
            Failed to generate flash cards. Please try again.
          </p>
        </div>
      );
    }

    const { flashCardsData } = result;
    const currentCard = flashCardsData.cards[currentCardIndex];
    const currentResult = currentResults.find(
      (r) => r.cardId === currentCard.id
    );
    const showResult = !!currentResult;
    const isCompleted = currentResults.length === flashCardsData.cards.length;

    const handleMarkCard = (wasCorrect: boolean, needsReview: boolean = false) => {
      if (showResult) return;

      const newResult: CardResult = {
        cardId: currentCard.id,
        difficulty: currentCard.difficulty,
        wasCorrect,
        needsReview,
      };
      setCurrentResults((prev) => [...prev, newResult]);
    };

    const nextCard = () => {
      if (currentCardIndex < flashCardsData.cards.length - 1) {
        setCurrentCardIndex((prev) => prev + 1);
      }
    };

    const previousCard = () => {
      if (currentCardIndex > 0) {
        setCurrentCardIndex((prev) => prev - 1);
      }
    };

    const completeFlashCards = () => {
      addResult({
        flashCardsData,
        results: currentResults,
        completed: true,
      });
    };

    const correctCount = currentResults.filter((r) => r.wasCorrect).length;
    const reviewCount = currentResults.filter((r) => r.needsReview).length;
    const incorrectCount = currentResults.length - correctCount - reviewCount;

    return (
      <div className="max-w-2xl p-6 bg-white border rounded-lg shadow-sm ml-0">
        {/* Flash Cards Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCardIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Flash Cards: {flashCardsData.topic}</h2>
              <p className="text-sm text-muted-foreground">
                Card {currentCardIndex + 1} of {flashCardsData.cards.length}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  ((currentCardIndex + 1) / flashCardsData.cards.length) * 100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Flash Card Content */}
        <div className="mb-6">
          <FlashCardComponent
            card={currentCard}
            onMarkCorrect={() => handleMarkCard(true)}
            onMarkIncorrect={() => handleMarkCard(false)}
            onMarkReview={() => handleMarkCard(false, true)}
            showResult={showResult}
            result={currentResult}
          />
        </div>

        {/* Navigation and Stats */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={previousCard}
            disabled={currentCardIndex === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Previous
          </Button>

          <div className="text-center">
            {currentResults.length > 0 && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckIcon className="h-3 w-3 text-green-600" />
                  <span>{correctCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <RotateCcwIcon className="h-3 w-3 text-yellow-600" />
                  <span>{reviewCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <XIcon className="h-3 w-3 text-red-600" />
                  <span>{incorrectCount}</span>
                </div>
              </div>
            )}
          </div>

          {currentCardIndex < flashCardsData.cards.length - 1 ? (
            <Button 
              onClick={nextCard} 
              disabled={!showResult}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={completeFlashCards}
              disabled={!isCompleted}
              className="bg-green-600 hover:bg-green-700"
            >
              Complete Study Session
            </Button>
          )}
        </div>

        {/* Final Results */}
        {isCompleted && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Study Session Complete!</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <CheckIcon className="h-4 w-4 text-green-600" />
                <span>Correct: {correctCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <RotateCcwIcon className="h-4 w-4 text-yellow-600" />
                <span>Review: {reviewCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <XIcon className="h-4 w-4 text-red-600" />
                <span>Incorrect: {incorrectCount}</span>
              </div>
            </div>
            {reviewCount > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Consider reviewing the {reviewCount} cards marked for review.
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
});