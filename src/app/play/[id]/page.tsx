
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import type { Quiz, Question, Player } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2, Users, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, collection, onSnapshot, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const TIMER_DURATION = 20;

type GameState = {
  id: string;
  quizData: Quiz;
  status: 'waiting' | 'in-progress' | 'finished';
  currentQuestionIndex: number;
} | null;

export default function PlayQuizPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const gamePin = params.id as string;
  const isHost = searchParams.get("host") === "true";
  const { toast } = useToast();

  const [game, setGame] = useState<GameState>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [localPlayer, setLocalPlayer] = useState<{ id: string; name: string } | null>(null);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timer, setTimer] = useState(TIMER_DURATION);

  useEffect(() => {
    const storedPlayer = localStorage.getItem(`player-${gamePin}`);
    if (storedPlayer) {
      setLocalPlayer(JSON.parse(storedPlayer));
    } else if (!isHost) {
      toast({ title: "Error", description: "Could not identify player. Please rejoin.", variant: "destructive" });
      router.push('/join');
      return;
    }

    const gameRef = doc(db, "games", gamePin);
    const unsubGame = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        const gameData = doc.data() as Omit<GameState, 'id'>;
        setGame({ id: doc.id, ...gameData! });
      } else {
        toast({ title: "Game not found", description: "This game session does not exist.", variant: "destructive" });
        router.push("/dashboard");
      }
    });

    const playersRef = collection(db, "games", gamePin, "players");
    const unsubPlayers = onSnapshot(playersRef, (snapshot) => {
      const playersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
      setPlayers(playersList);
    });

    return () => {
      unsubGame();
      unsubPlayers();
    };
  }, [gamePin, router, toast, isHost]);

  const startGame = async () => {
    if (!isHost) return;
    const gameRef = doc(db, "games", gamePin);
    await updateDoc(gameRef, { status: "in-progress", currentQuestionIndex: 0 });
  };

  if (!game) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Loading Game...</p>
      </div>
    );
  }

  if (game.status === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8">
        <Card className="w-full max-w-2xl text-center bg-card/60 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-3xl font-headline bg-clip-text text-transparent bg-gradient-to-r from-primary via-pink-400 to-accent">
                    {isHost ? "Ready to Host?" : "You're In!"}
                </CardTitle>
                <CardDescription>{isHost ? "Share the PIN so others can join." : "Get ready! The quiz will start soon."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground">Game PIN</p>
                <p className="text-6xl font-bold tracking-widest text-primary">{gamePin}</p>
                 {isHost && (
                    <Button size="lg" onClick={startGame} disabled={players.length === 0}>
                       Start Quiz ({players.length} {players.length === 1 ? 'player' : 'players'})
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

  if (game.status === 'in-progress') {
    const currentQuestion = game.quizData.questions[game.currentQuestionIndex];
    
    // Most of the play logic is client-side for now to keep it simple
    // A full-fledged version would handle timers and scoring via Firestore
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-3xl shadow-2xl bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-medium text-muted-foreground">Question {game.currentQuestionIndex + 1} of {game.quizData.questions.length}</p>
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
                      // onClick={() => handleAnswerSelect(index)} // This needs full implementation with Firestore
                      disabled={isAnswered || isHost}
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
            <div className="mt-8 text-center">
                <Button onClick={() => {
                    const nextIndex = game.currentQuestionIndex + 1;
                    const gameRef = doc(db, "games", gamePin);
                    if (nextIndex < game.quizData.questions.length) {
                        updateDoc(gameRef, { currentQuestionIndex: nextIndex });
                    } else {
                        updateDoc(gameRef, { status: 'finished' });
                    }
                }}>Next Question</Button>
            </div>
          )}
        </div>
      );
  }

  if (game.status === 'finished') {
    // This redirect should be handled more gracefully, ideally showing a final leaderboard
    // For now, redirecting to a simple results page
    router.push(`/results/${gamePin}?score=${score}&title=${encodeURIComponent(game.quizData.title || '')}`);
    return null;
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4">Something went wrong.</p>
    </div>
  );
}
