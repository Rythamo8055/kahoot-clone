
"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Quiz } from "@/lib/types";
import { FilePlus, Play, BarChart2, Loader2, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { doc, writeBatch, serverTimestamp, collection, query, where, onSnapshot, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


export default function DashboardPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState<string | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
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
    const q = query(quizzesRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
            const userQuizzes = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Quiz));
            
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
    if (isCreatingSession || !user) return;
    setIsCreatingSession(quiz.id);

    const gamePin = Math.floor(100000 + Math.random() * 900000).toString();
    const hostPlayerName = user.displayName || 'Host';
    const playerDocRef = doc(collection(db, "games", gamePin, "players"));
    const hostPlayerId = playerDocRef.id;

    localStorage.setItem(`player-${gamePin}`, JSON.stringify({ id: hostPlayerId, name: hostPlayerName }));
    
    router.push(`/play/${gamePin}?host=true`);

    const batch = writeBatch(db);
    const gameRef = doc(db, "games", gamePin);
    batch.set(gameRef, {
        quizId: quiz.id,
        quizTitle: quiz.title,
        gameState: "waiting",
        currentQuestionIndex: -1,
        questionStartTime: null,
        createdAt: serverTimestamp(),
    });
    
    const hostAsPlayer = { name: hostPlayerName, score: 0, userId: user.uid };
    batch.set(playerDocRef, hostAsPlayer);
    
    batch.commit().catch((error) => {
        console.error("Error creating game session in background: ", error);
    });
  }

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;

    try {
      await deleteDoc(doc(db, "quizzes", quizToDelete.id));
      toast({
        title: "Quiz Deleted",
        description: `"${quizToDelete.title}" has been permanently deleted.`,
      });
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast({
        title: "Deletion Failed",
        description: "Could not delete the quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setQuizToDelete(null);
    }
  };


  const QuizSkeleton = () => (
    <Card className="bg-card/60 backdrop-blur-sm">
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-1/4" />
      </CardContent>
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
      <TooltipProvider>
        <AlertDialog open={!!quizToDelete} onOpenChange={(open) => !open && setQuizToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the quiz
                "{quizToDelete?.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteQuiz}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
                    <CardDescription className="h-10 text-ellipsis overflow-hidden pt-1">
                      {quiz.description || "No description."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">{quiz.questions.length} Questions</p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-1 pt-4">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleHostQuiz(quiz)} disabled={isCreatingSession === quiz.id}>
                                {isCreatingSession === quiz.id ? ( <Loader2 className="h-4 w-4 animate-spin" />) : ( <Play className="h-4 w-4" /> )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Host</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" asChild>
                            <Link href={`/results/${quiz.id}?title=${encodeURIComponent(quiz.title)}`}>
                                <BarChart2 className="h-4 w-4" />
                            </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Results</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" asChild>
                            <Link href={`/edit/${quiz.id}`}>
                                <Edit className="h-4 w-4" />
                            </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Edit</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setQuizToDelete(quiz)} className="text-destructive hover:text-destructive hover:bg-destructive/10 focus-visible:ring-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Delete</p></TooltipContent>
                    </Tooltip>
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
      </TooltipProvider>
    </AppShell>
  );
}
