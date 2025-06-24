"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import type { Quiz, Question } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TIMER_DURATION = 20;

export default function PlayQuizPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const quizId = params.id as string;
  const isHost = searchParams.get("host") === "true";

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timer, setTimer] = useState(TIMER_DURATION);
  
  useEffect(() => {
    const storedQuizzes = localStorage.getItem("quizzes");
    if (storedQuizzes) {
      const quizzes: Quiz[] = JSON.parse(storedQuizzes);
      const currentQuiz = quizzes.find((q) => q.id === quizId);
      if (currentQuiz) {
        setQuiz(currentQuiz);
      } else {
        router.push("/dashboard");
      }
    }
  }, [quizId, router]);

  useEffect(() => {
    if (isAnswered || !quiz) return;
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsAnswered(true);
      setTimeout(nextQuestion, 2000);
    }
  }, [timer, isAnswered, quiz]);

  const nextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimer(TIMER_DURATION);
    } else {
      router.push(`/results/${quizId}?score=${score}&title=${encodeURIComponent(quiz?.title || '')}`);
    }
  };
  
  const handleAnswerSelect = (optionIndex: number) => {
    if (isAnswered) return;
    
    setIsAnswered(true);
    setSelectedAnswer(optionIndex);
    
    const isCorrect = optionIndex === quiz?.questions[currentQuestionIndex].answer;
    if (isCorrect) {
      setScore(prev => prev + 500 + (timer * 10));
    }
    
    setTimeout(nextQuestion, 2000);
  };

  if (!quiz) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/50 p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-3xl shadow-2xl">
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-medium text-muted-foreground">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
            <p className="text-lg font-bold text-primary">{score} points</p>
          </div>
          <Progress value={(timer / TIMER_DURATION) * 100} className="w-full h-2 transition-all duration-1000 linear" />
          <CardTitle className="text-2xl md:text-3xl text-center pt-6 font-headline">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {currentQuestion.options.map((option, index) => {
              const isCorrect = index === currentQuestion.answer;
              const isSelected = index === selectedAnswer;

              return (
                <Button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isAnswered}
                  className={cn(
                    "h-auto py-4 text-lg whitespace-normal justify-start transition-all duration-300 transform",
                    isAnswered && (isCorrect ? "bg-green-500 hover:bg-green-600 text-white animate-pulse" : isSelected ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : "bg-muted hover:bg-muted opacity-50"),
                    !isAnswered && "hover:scale-105 hover:bg-accent/50"
                  )}
                  variant="outline"
                >
                  <div className="flex items-center w-full">
                    <span className="mr-4 text-lg font-bold">{String.fromCharCode(65 + index)}</span>
                    <span className="flex-1 text-left">{option}</span>
                    {isAnswered && isCorrect && <CheckCircle2 className="ml-4" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="ml-4" />}
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {isHost && (
        <div className="mt-8 text-center text-foreground/70">
          Hosting as a presenter.
        </div>
      )}
    </div>
  );
}
