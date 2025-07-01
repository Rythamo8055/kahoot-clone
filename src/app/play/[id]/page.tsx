
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import type { Quiz, Player, GameState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Users, Crown, Home, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, collection, onSnapshot, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { Progress } from "@/components/ui/progress";

const sortedPlayers = (players: Player[]) => [...players].sort((a, b) => b.score - a.score);
const QUESTION_DURATION = 20; // in seconds
const REVEAL_DURATION = 5; // in seconds

export default function PlayQuizPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const gamePin = params.id as string;
  const isHost = searchParams.get("host") === "true";
  const { toast } = useToast();

  const [game, setGame] = useState<GameState | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [localPlayer, setLocalPlayer] = useState<{ id: string; name: string } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timer, setTimer] = useState(QUESTION_DURATION);
  
  const gameRef = useMemo(() => doc(db, "games", gamePin), [gamePin]);
  const playersRef = useMemo(() => collection(db, "games", gamePin, "players"), [gamePin]);

  // Player and Game state subscriptions
  useEffect(() => {
    const storedPlayer = localStorage.getItem(`player-${gamePin}`);
    if (storedPlayer) {
      setLocalPlayer(JSON.parse(storedPlayer));
    } else {
      toast({ title: "Error", description: "Could not identify player. Please rejoin.", variant: "destructive" });
      router.push('/join');
      return;
    }

    const unsubGame = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        setGame({ id: doc.id, ...doc.data() } as GameState);
      } else {
        toast({ title: "Game not found", description: "This game session does not exist.", variant: "destructive" });
        router.push("/dashboard");
      }
    });

    const unsubPlayers = onSnapshot(playersRef, (snapshot) => {
      const playersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
      setPlayers(playersList);
    });

    return () => {
      unsubGame();
      unsubPlayers();
    };
  }, [gamePin, router, toast, gameRef, playersRef]);

  // Fetch quiz data when game starts
  useEffect(() => {
    if (!game?.quizId || quiz) return;

    const fetchQuiz = async () => {
        const quizRef = doc(db, "quizzes", game.quizId);
        const quizSnap = await getDoc(quizRef);
        if (quizSnap.exists()) {
            setQuiz({ id: quizSnap.id, ...quizSnap.data() } as Quiz);
        } else {
            toast({ title: "Quiz not found", description: "The associated quiz could not be found.", variant: "destructive" });
            router.push("/dashboard");
        }
    };
    
    fetchQuiz();
  }, [game, quiz, router, toast]);

  // Reset state for new question
  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimer(QUESTION_DURATION);
  }, [game?.currentQuestionIndex]);
  
  // Question timer countdown effect (host-driven)
  useEffect(() => {
    if (game?.gameState !== 'question' || !game.questionStartTime) {
        setTimer(QUESTION_DURATION);
        return;
    }

    const interval = setInterval(() => {
        const startTime = (game.questionStartTime as any).toMillis();
        const elapsed = (Date.now() - startTime) / 1000;
        const timeLeft = Math.max(0, QUESTION_DURATION - elapsed);
        setTimer(timeLeft);

        if (timeLeft === 0 && isHost && game.gameState === 'question') {
            updateDoc(gameRef, { gameState: 'reveal' });
        }
    }, 250);

    return () => clearInterval(interval);
  }, [game?.gameState, game?.questionStartTime, isHost, gameRef]);
  
  // Auto-transition from Reveal to Leaderboard (host-driven)
  useEffect(() => {
    if (isHost && game?.gameState === 'reveal') {
      const timeoutId = setTimeout(() => {
        updateDoc(gameRef, { gameState: 'leaderboard' });
      }, REVEAL_DURATION * 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [game?.gameState, isHost, gameRef]);

  const handleHostAction = async () => {
    if (!isHost || !game || isProcessing) return;
    setIsProcessing(true);

    try {
        switch (game.gameState) {
            case 'waiting':
              await updateDoc(gameRef, { gameState: 'question', currentQuestionIndex: 0, questionStartTime: serverTimestamp() });
              break;
            case 'leaderboard':
              if (!quiz) return;
              const nextIndex = game.currentQuestionIndex + 1;
              if (nextIndex < quiz.questions.length) {
                await updateDoc(gameRef, { gameState: 'question', currentQuestionIndex: nextIndex, questionStartTime: serverTimestamp() });
              } else {
                await updateDoc(gameRef, { gameState: 'finished' });
              }
              break;
            case 'finished':
                router.push('/dashboard');
                break;
        }
    } catch(error) {
        console.error("Error updating game state:", error);
        toast({ title: "Error", description: "Could not update the game state.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };


  const handleAnswerSelect = async (answerIndex: number) => {
    if (!game || !localPlayer || isAnswered || !quiz || game.gameState !== 'question' || !game.questionStartTime) return;
    
    setIsAnswered(true);
    setSelectedAnswer(answerIndex);

    const currentQuestion = quiz.questions[game.currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.answer;
    
    const startTime = (game.questionStartTime as any).toMillis();
    const timeTaken = (Date.now() - startTime) / 1000;

    const points = isCorrect ? Math.round(Math.max(0, 1000 * (1 - (timeTaken / (QUESTION_DURATION * 2))))) : 0;
    
    const playerRef = doc(db, "games", gamePin, "players", localPlayer.id);
    const currentPlayer = players.find(p => p.id === localPlayer.id);
    if(currentPlayer) {
        await updateDoc(playerRef, {
            score: currentPlayer.score + points,
            lastAnswer: answerIndex,
        });
    }
  }

  const sortedPlayerList = useMemo(() => sortedPlayers(players), [players]);
  
  const hostButtonText = useMemo(() => {
    if (!game) return "";
    switch (game.gameState) {
      case "waiting":
        return `Start Quiz (${players.length} ${players.length === 1 ? 'player' : 'players'})`;
      case "leaderboard":
        if (quiz && game.currentQuestionIndex >= quiz.questions.length - 1) {
          return "Finish Quiz";
        }
        return "Next Question";
      case "finished":
        return "Back to Dashboard";
      default:
        return "Next";
    }
  }, [game, quiz, players.length]);

  if (!game) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Loading Game...</p>
      </div>
    );
  }
  
  if (game.gameState === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8">
        <Card className="w-full max-w-2xl text-center bg-card/60 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-3xl font-headline bg-clip-text text-transparent bg-gradient-to-r from-primary via-pink-400 to-accent">
                    {isHost ? `Ready to Host: ${game.quizTitle}` : "You're In!"}
                </CardTitle>
                <CardDescription>{isHost ? "Share the PIN so others can join." : `Get ready for "${game.quizTitle}"! The quiz will start soon.`}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground">Game PIN</p>
                <p className="text-6xl font-bold tracking-widest text-primary">{gamePin}</p>
                 {isHost && (
                    <Button size="lg" onClick={handleHostAction} disabled={players.length === 0 || isProcessing}>
                       {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : hostButtonText}
                    </Button>
                )}
            </CardContent>
        </Card>
        <Card className="w-full max-w-2xl bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-headline flex items-center"><Users className="mr-2"/> Players</CardTitle>
                <span className="text-2xl font-bold">{players.length}</span>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {players.map(p => (
                        <div key={p.id} className="p-2 bg-background/50 rounded-lg text-center font-semibold truncate">
                           {p.name}
                        </div>
                    ))}
                    {players.length === 0 && <p className="col-span-full text-center text-muted-foreground">Waiting for players to join...</p>}
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!quiz) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Loading Quiz...</p>
      </div>
    );
  }

  const currentQuestion = quiz.questions[game.currentQuestionIndex];
  const isRevealPhase = game.gameState === 'reveal';

  if ((game.gameState === 'question' || game.gameState === 'reveal') && currentQuestion) {
    const localPlayerScore = players.find(p => p.id === localPlayer?.id)?.score ?? 0;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-3xl shadow-2xl bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-medium text-muted-foreground">Question {game.currentQuestionIndex + 1} of {quiz.questions.length}</p>
                <p className="text-lg font-bold text-primary">{localPlayerScore} points</p>
              </div>
              <div className="space-y-4">
                <Progress value={(timer / QUESTION_DURATION) * 100} className="w-full" />
                <CardTitle className="text-2xl md:text-3xl text-center pt-6 font-headline">{currentQuestion.question}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {currentQuestion.options.map((option, index) => {
                  const isCorrect = index === currentQuestion.answer;
                  const isMySelection = index === selectedAnswer;

                  return (
                    <Button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={isAnswered || timer <= 0 || game.gameState !== 'question'}
                      className={cn(
                        "h-auto py-4 text-lg whitespace-normal justify-start transition-all duration-300 transform",
                        // Player has selected an answer, but it's not reveal phase yet
                        isMySelection && !isRevealPhase && "ring-4 ring-offset-2 ring-primary",
                        // Reveal phase styling
                        isRevealPhase && (isCorrect ? "bg-green-500 hover:bg-green-600 text-white animate-pulse" : isMySelection ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : "bg-muted hover:bg-muted opacity-50"),
                        !isRevealPhase && !isAnswered && "hover:scale-105 hover:bg-accent/50"
                      )}
                      variant="outline"
                    >
                      <div className="flex items-center w-full">
                        <span className="mr-4 text-lg font-bold">{String.fromCharCode(65 + index)}</span>
                        <span className="flex-1 text-left">{option}</span>
                         {isMySelection && !isRevealPhase && <ShieldCheck className="ml-4" />}
                        {isRevealPhase && isCorrect && <CheckCircle2 className="ml-4" />}
                        {isRevealPhase && isMySelection && !isCorrect && <XCircle className="ml-4" />}
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
           {isAnswered && !isRevealPhase && (
             <div className="mt-6 text-center text-muted-foreground animate-pulse">
                Waiting for others...
             </div>
           )}
        </div>
      );
  }

  if (game.gameState === 'leaderboard' || game.gameState === 'finished') {
    const isFinished = game.gameState === 'finished';
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8">
            <Card className="w-full max-w-2xl text-center bg-card/60 backdrop-blur-sm">
                 <CardHeader>
                    <CardTitle className="text-3xl font-headline bg-clip-text text-transparent bg-gradient-to-r from-primary via-pink-400 to-accent">
                        {isFinished ? `Final Results: ${game.quizTitle}` : "Leaderboard"}
                    </CardTitle>
                    {isFinished && <CardDescription>Congratulations to the winner!</CardDescription>}
                 </CardHeader>
                 <CardContent>
                    <div className="space-y-4">
                        {sortedPlayerList.map((p, index) => (
                           <div key={p.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                                <div className="flex items-center gap-4">
                                   <span className="text-2xl font-bold w-8">{index + 1}</span>
                                   <span className="text-lg font-semibold">{p.name}</span>
                                   {index === 0 && <Crown className="text-yellow-400" />}
                                </div>
                                <span className="text-xl font-bold text-primary">{p.score}</span>
                           </div>
                        ))}
                    </div>
                 </CardContent>
            </Card>

            {isHost && (
                <Button size="lg" onClick={handleHostAction} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : hostButtonText}
                </Button>
            )}

            {isFinished && !isHost && (
                 <div className="flex gap-4">
                    <Button asChild>
                        <Link href="/dashboard">
                           <Home className="mr-2"/> Go to Dashboard
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4">Waiting for game state...</p>
    </div>
  );
}
