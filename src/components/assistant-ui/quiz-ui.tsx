"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckIcon, XIcon, BookOpenIcon, BrainIcon } from "lucide-react";

// Types for quiz questions
type MCQQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
};

type ShortAnswerQuestion = {
  id: string;
  question: string;
  correctAnswer: string;
  explanation?: string;
};

type QuizQuestion = MCQQuestion | ShortAnswerQuestion;

type QuizData = {
  topic: string;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  totalQuestions: number;
};

type QuizResult = {
  questionId: string;
  userAnswer: string | number;
  isCorrect: boolean;
  explanation?: string;
  needsVerification?: boolean;
};

// MCQ Component
const MCQQuestionComponent = ({
  question,
  onAnswer,
  userAnswer,
  showResult,
  isCorrect,
}: {
  question: MCQQuestion;
  onAnswer: (answer: number) => void;
  userAnswer?: number;
  showResult: boolean;
  isCorrect?: boolean;
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{question.question}</h3>
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = userAnswer === index;
          const isCorrectOption = index === question.correctAnswer;

          let buttonStyle =
            "justify-start text-left h-auto p-3 whitespace-normal";

          if (showResult) {
            if (isCorrectOption) {
              buttonStyle += " bg-green-100 border-green-500 text-green-800";
            } else if (isSelected && !isCorrect) {
              buttonStyle += " bg-red-100 border-red-500 text-red-800";
            } else {
              buttonStyle += " bg-gray-50 border-gray-200";
            }
          } else if (isSelected) {
            buttonStyle += " bg-blue-100 border-blue-500";
          }

          return (
            <div key={index} className="w-full">
              <Button
                variant="outline"
                className={cn(buttonStyle, "w-full")}
                onClick={() => !showResult && onAnswer(index)}
                disabled={showResult}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-left">{option}</span>
                  {showResult && isCorrectOption && (
                    <CheckIcon className="h-4 w-4 text-green-600" />
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <XIcon className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </Button>
            </div>
          );
        })}
      </div>
      {showResult && question.explanation && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Explanation:</strong> {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
};

// Short Answer Component
const ShortAnswerComponent = ({
  question,
  onAnswer,
  userAnswer,
  showResult,
  isCorrect,
  isVerifying = false,
}: {
  question: ShortAnswerQuestion;
  onAnswer: (answer: string) => void;
  userAnswer?: string;
  showResult: boolean;
  isCorrect?: boolean;
  isVerifying?: boolean;
}) => {
  const [inputValue, setInputValue] = useState(userAnswer || "");

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onAnswer(inputValue.trim());
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{question.question}</h3>
      <div className="space-y-3">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your answer here..."
          className={cn(
            "w-full p-3 border rounded-lg resize-none h-24",
            showResult && isCorrect && "border-green-500 bg-green-50",
            showResult && !isCorrect && "border-red-500 bg-red-50"
          )}
          disabled={showResult}
        />
        {!showResult && (
          <Button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isVerifying}
            className="w-full"
          >
            {isVerifying ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Verifying...
              </div>
            ) : (
              "Submit Answer"
            )}
          </Button>
        )}
      </div>
      {showResult && (
        <div
          className={cn(
            "p-3 rounded-lg border",
            isCorrect
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? (
              <CheckIcon className="h-4 w-4 text-green-600" />
            ) : (
              <XIcon className="h-4 w-4 text-red-600" />
            )}
            <span
              className={cn(
                "font-medium",
                isCorrect ? "text-green-800" : "text-red-800"
              )}
            >
              {isCorrect ? "Correct!" : "Needs Improvement"}
            </span>
          </div>
          {question.explanation && (
            <p className="text-sm">
              <strong>Model Answer:</strong> {question.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Main Quiz Tool UI
export const QuizToolUI = makeAssistantToolUI<
  { topic: string },
  {
    quizData: QuizData;
    results: QuizResult[];
    completed: boolean;
  }
>({
  toolName: "generateQuiz",
  render: ({ args, result, status, addResult }) => {
    const [currentResults, setCurrentResults] = useState<QuizResult[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isVerifying, setIsVerifying] = useState(false);

    if (status.type === "running") {
      return (
        <div className="flex items-center gap-3 p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <div>
            <h3 className="font-medium">Generating quiz questions...</h3>
            <p className="text-sm text-muted-foreground">
              Creating questions about {args.topic}
            </p>
          </div>
        </div>
      );
    }

    if (!result?.quizData) {
      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <p className="text-red-800">
            Failed to generate quiz. Please try again.
          </p>
        </div>
      );
    }

    const { quizData } = result;
    const currentQuestion = quizData.questions[currentQuestionIndex];
    const currentResult = currentResults.find(
      (r) => r.questionId === currentQuestion.id
    );
    const showResult = !!currentResult;
    const isCompleted = currentResults.length === quizData.questions.length;

    const handleAnswer = async (answer: string | number) => {
      if (showResult) return;

      // For MCQ, check immediately
      if ("options" in currentQuestion) {
        const isCorrect = answer === currentQuestion.correctAnswer;
        const newResult: QuizResult = {
          questionId: currentQuestion.id,
          userAnswer: answer,
          isCorrect,
          explanation: currentQuestion.explanation,
        };
        setCurrentResults((prev) => [...prev, newResult]);
      } else {
        // For short answer, we need to verify with LLM
        setIsVerifying(true);

        // Call the verification API
        fetch("/api/verify-answer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: currentQuestion.question,
            userAnswer: answer,
            correctAnswer: currentQuestion.correctAnswer,
          }),
        })
          .then((response) => response.json())
          .then((verificationResult) => {
            const newResult: QuizResult = {
              questionId: currentQuestion.id,
              userAnswer: answer,
              isCorrect: verificationResult.isCorrect,
              explanation: verificationResult.feedback,
            };
            setCurrentResults((prev) => [...prev, newResult]);
            setIsVerifying(false);
          })
          .catch((error) => {
            console.error("Verification failed:", error);
            // Add a fallback result
            const fallbackResult: QuizResult = {
              questionId: currentQuestion.id,
              userAnswer: answer,
              isCorrect: false,
              explanation: "Unable to verify answer at this time.",
            };
            setCurrentResults((prev) => [...prev, fallbackResult]);
            setIsVerifying(false);
          });
      }
    };

    const nextQuestion = () => {
      if (currentQuestionIndex < quizData.questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    };

    const previousQuestion = () => {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex((prev) => prev - 1);
      }
    };

    const completeQuiz = () => {
      addResult({
        quizData,
        results: currentResults,
        completed: true,
      });
    };

    const correctCount = currentResults.filter((r) => r.isCorrect).length;
    const scorePercentage =
      currentResults.length > 0
        ? Math.round((correctCount / currentResults.length) * 100)
        : 0;

    return (
      <div className="max-w-2xl p-6 bg-white border rounded-lg shadow-sm ml-0">
        {/* Quiz Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BrainIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Quiz: {quizData.topic}</h2>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of{" "}
                {quizData.questions.length}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  ((currentQuestionIndex + 1) / quizData.questions.length) * 100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Question Content */}
        <div className="mb-6">
          {"options" in currentQuestion ? (
            <MCQQuestionComponent
              question={currentQuestion as MCQQuestion}
              onAnswer={handleAnswer}
              userAnswer={currentResult?.userAnswer as number}
              showResult={showResult}
              isCorrect={currentResult?.isCorrect}
            />
          ) : (
            <ShortAnswerComponent
              question={currentQuestion as ShortAnswerQuestion}
              onAnswer={handleAnswer}
              userAnswer={currentResult?.userAnswer as string}
              showResult={showResult}
              isCorrect={currentResult?.isCorrect}
              isVerifying={isVerifying}
            />
          )}
        </div>

        {/* Navigation and Results */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <div className="text-center">
            {currentResults.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Score: {correctCount}/{currentResults.length} ({scorePercentage}
                %)
              </p>
            )}
          </div>

          {currentQuestionIndex < quizData.questions.length - 1 ? (
            <Button onClick={nextQuestion} disabled={!showResult}>
              Next
            </Button>
          ) : (
            <Button
              onClick={completeQuiz}
              disabled={!isCompleted}
              className="bg-green-600 hover:bg-green-700"
            >
              Complete Quiz
            </Button>
          )}
        </div>

        {/* Final Results */}
        {isCompleted && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Quiz Complete!</h3>
            <p className="text-sm">
              Final Score: {correctCount}/{quizData.questions.length} (
              {scorePercentage}%)
            </p>
          </div>
        )}
      </div>
    );
  },
});

// Short Answer Verification Tool UI
export const VerifyAnswerToolUI = makeAssistantToolUI<
  {
    question: string;
    userAnswer: string;
    correctAnswer: string;
  },
  {
    isCorrect: boolean;
    feedback: string;
    score: number;
  }
>({
  toolName: "verifyAnswer",
  render: ({ args, result, status }) => {
    if (status.type === "running") {
      return (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">Verifying your answer...</span>
        </div>
      );
    }

    if (!result) return null;

    return (
      <div
        className={cn(
          "p-3 rounded-lg border",
          result.isCorrect
            ? "bg-green-50 border-green-200"
            : "bg-yellow-50 border-yellow-200"
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          {result.isCorrect ? (
            <CheckIcon className="h-4 w-4 text-green-600" />
          ) : (
            <BookOpenIcon className="h-4 w-4 text-yellow-600" />
          )}
          <span
            className={cn(
              "font-medium text-sm",
              result.isCorrect ? "text-green-800" : "text-yellow-800"
            )}
          >
            Score: {result.score}/100
          </span>
        </div>
        <p className="text-sm">{result.feedback}</p>
      </div>
    );
  },
});
