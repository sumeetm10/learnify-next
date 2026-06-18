"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { QuizQuestion } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  chapterId: string;
  chapterTitle: string;
}

export function QuizModal({ open, onClose, chapterId, chapterTitle }: Props) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && chapterId) {
      // Resetting quiz state when the modal (re)opens is intentional here —
      // it syncs local state with the externally-controlled `open` prop.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      setCurrentIndex(0);
      setCorrectCount(0);
      setSelectedOption(null);
      setAnswered(false);
      setQuizFinished(false);

      fetch(`/api/quiz?chapterId=${chapterId}`)
        .then((r) => r.json())
        .then((data) => {
          setQuestions(data.questions || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [open, chapterId]);

  const handleSelect = useCallback(
    (option: string) => {
      if (answered) return;
      setSelectedOption(option);
      setAnswered(true);

      const isCorrect = option === questions[currentIndex]?.answer;
      if (isCorrect) setCorrectCount((prev) => prev + 1);

      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setSelectedOption(null);
          setAnswered(false);
        } else {
          const finalScore = isCorrect ? correctCount + 1 : correctCount;
          setQuizFinished(true);
          // Save to progress
          fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chapterId,
              action: "quiz",
              score: finalScore,
              totalQuestions: questions.length,
            }),
          });
        }
      }, 1500);
    },
    [answered, currentIndex, questions, correctCount, chapterId]
  );

  const handleClose = () => {
    onClose();
    setQuizFinished(false);
    setCurrentIndex(0);
    setCorrectCount(0);
    setSelectedOption(null);
    setAnswered(false);
  };

  const currentQuestion = questions[currentIndex];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Quiz: {chapterTitle}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No quiz questions available for this chapter yet.
            <Button onClick={handleClose} className="mt-4 block mx-auto">Close</Button>
          </div>
        ) : quizFinished ? (
          <div className="py-8 text-center space-y-4">
            <div className="text-5xl mb-2">🎉</div>
            <h3 className="text-xl font-bold">Quiz Completed!</h3>
            <p className="text-lg">
              You scored{" "}
              <span className="font-bold text-[#427da6]">
                {correctCount}/{questions.length}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              {correctCount === questions.length
                ? "Perfect score! Amazing work!"
                : correctCount >= questions.length / 2
                ? "Good job! Keep learning!"
                : "Keep practicing, you'll get better!"}
            </p>
            <Button onClick={handleClose} className="bg-[#427da6] hover:bg-[#356a8a]">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>Score: {correctCount}/{questions.length}</span>
            </div>

            <h3 className="text-lg font-medium">{currentQuestion?.text}</h3>

            <div className="space-y-3">
              {currentQuestion?.options.map((option) => {
                let className =
                  "w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium text-sm ";

                if (answered) {
                  if (option === currentQuestion.answer) {
                    className += "border-green-500 bg-green-50 text-green-700";
                  } else if (option === selectedOption) {
                    className += "border-red-500 bg-red-50 text-red-700";
                  } else {
                    className += "border-gray-200 text-gray-400";
                  }
                } else {
                  className +=
                    "border-gray-200 hover:border-[#427da6] hover:bg-[#427da6]/5 cursor-pointer";
                }

                return (
                  <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    disabled={answered}
                    className={className}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
