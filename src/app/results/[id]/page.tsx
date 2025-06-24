"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Repeat, Home } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import type { QuizResult } from "@/lib/types";

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  
  const score = searchParams.get("score");
  const quizTitle = searchParams.get("title");
  const quizId = params.id as string;

  useEffect(() => {
    if(score && quizId) {
       const finalResult: QuizResult = {
        quizId,
        quizTitle: quizTitle || 'Untitled Quiz',
        score: parseInt(score),
        totalQuestions: 0, // This could be improved by passing total questions
        date: new Date().toISOString()
      };
      
      const results: QuizResult[] = JSON.parse(localStorage.getItem('quizResults') || '[]');
      results.push(finalResult);
      localStorage.setItem('quizResults', JSON.stringify(results));
    }
  }, [quizId, score, quizTitle])


  if (!score) {
    useEffect(() => {
        router.push('/dashboard');
    }, [router]);
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md text-center shadow-2xl">
        <CardHeader>
          <div className="mx-auto bg-accent rounded-full p-4 w-fit mb-4">
            <Award className="h-12 w-12 text-accent-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline">Quiz Complete!</CardTitle>
          <CardDescription>You finished the "{quizTitle || 'quiz'}"!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">Your Score</p>
            <p className="text-5xl font-bold text-primary">{score}</p>
          </div>
          
          <div className="flex w-full gap-4 pt-4">
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/play/${quizId}`}>
                <Repeat className="mr-2 h-4 w-4" />
                Play Again
              </Link>
            </Button>
            <Button className="w-full" asChild>
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
