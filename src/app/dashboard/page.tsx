
"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Quiz } from "@/lib/types";
import { FilePlus, Play, BarChart2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";

export default function DashboardPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!user) {
        setLoadingQuizzes(false);
        return;
    };

    setLoadingQuizzes(true);
    const quizzesRef = collection(db, "quizzes");
    // Removed orderBy to avoid needing a composite index, sorting will be done on the client.
    const q = query(quizzesRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
            const userQuizzes = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Quiz));
            
            // Sort quizzes by creation date on the client
            userQuizzes.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

            setQuizzes(userQuizzes);
            setLoadingQuizzes(false);
        }, 
        (error) => {
            console.error("Error fetching quizzes:", error);
            toast({
                title: "Failed to load quizzes",
                description: "Could not fetch your quizzes. Please try again.",
                variant: "destructive"
            });
            setLoadingQuizzes(false);
        }
    );

    return () => unsubscribe();
  }, [user, authLoading, toast, router]);
  
  const handleHostQuiz = (quiz: Quiz) => {
    if (isCreatingSession) return;
    setIsCreatingSession(quiz.id);

    const gamePin = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Navigate immediately for an "instant" feel
    router.push(`/play/${gamePin}?host=true`);

    // Create the game session in the background. The play page will show a loading
    // state until this is complete, and handles its own errors if this fails.
    setDoc(doc(db, "games", gamePin), {
        quizId: quiz.id,
        quizTitle: quiz.title,
        gameState: "waiting",
        currentQuestionIndex: -1,
        questionStartTime: null,
        createdAt: serverTimestamp(),
    }).catch((error) => {
        console.error("Error creating game session in background: ", error);
        // The play page will show an error if it can't find the game doc,
        // so we just log it here.
    });
  }

  const QuizSkeleton = () => (
    <Card className="bg-card/60 backdrop-blur-sm">
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-1/4" />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-20" />
      </CardFooter>
    </Card>
  )

  if (authLoading || !user) {
    return (
      <AppShell>
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <QuizSkeleton />
            <QuizSkeleton />
            <QuizSkeleton />
         </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-r from-primary via-pink-400 to-accent">My Quizzes</h1>
            <p className="text-muted-foreground">Create, manage, and host your quizzes here.</p>
          </div>
          <Button asChild>
            <Link href="/create">
              <FilePlus className="mr-2 h-4 w-4" />
              Create Quiz
            </Link>
          </Button>
        </div>

        {loadingQuizzes ? (
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <QuizSkeleton />
             <QuizSkeleton />
             <QuizSkeleton />
           </div>
        ) : quizzes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300 bg-card/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="truncate">{quiz.title}</CardTitle>
                  <CardDescription className="h-10 text-ellipsis overflow-hidden">
                    {quiz.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">{quiz.questions.length} Questions</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/results/${quiz.id}?title=${encodeURIComponent(quiz.title)}`}>
                      <BarChart2 className="mr-2 h-4 w-4" />
                      Results
                    </Link>
                  </Button>
                  <Button size="sm" onClick={() => handleHostQuiz(quiz)} disabled={isCreatingSession === quiz.id}>
                    {isCreatingSession === quiz.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Play className="mr-2 h-4 w-4" />
                    )}
                    Host
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed rounded-lg bg-card/60 backdrop-blur-sm">
            <h3 className="text-xl font-semibold">No Quizzes Yet!</h3>
            <p className="text-muted-foreground my-2">Click the button below to create your first quiz.</p>
            <Button asChild className="mt-4">
              <Link href="/create">
                <FilePlus className="mr-2 h-4 w-4" />
                Create Your First Quiz
              </Link>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
