
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Gamepad2, Loader2, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";

export default function JoinPage() {
    const [code, setCode] = useState("");
    const [nickname, setNickname] = useState("");
    const [step, setStep] = useState<"code" | "nickname">("code");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleCodeSubmit = async () => {
        if (!code) {
            toast({ title: "Please enter a game code.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        
        try {
            const gameRef = doc(db, "games", code);
            const gameSnap = await getDoc(gameRef);

            if (gameSnap.exists() && gameSnap.data().status === 'waiting') {
                setStep("nickname");
            } else {
                toast({ title: "Game not found", description: "The code is invalid or the game has already started.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Could not verify game code. Please try again.", variant: "destructive" });
            console.error(error);
        }
        setIsLoading(false);
    };

    const handleNicknameSubmit = async () => {
        if (!nickname) {
            toast({ title: "Please enter a nickname.", variant: "destructive" });
            return;
        }
        setIsLoading(true);

        try {
            const playersCollectionRef = collection(db, "games", code, "players");
            const playerDocRef = await addDoc(playersCollectionRef, {
                name: nickname,
                score: 0
            });
            localStorage.setItem(`player-${code}`, JSON.stringify({ id: playerDocRef.id, name: nickname }));
            router.push(`/play/${code}`);
        } catch (error) {
            toast({ title: "Error", description: "Could not join the game. Please try again.", variant: "destructive" });
            console.error(error);
        }
        setIsLoading(false);
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
             <Link href="/" className="absolute top-6 left-6 flex items-center space-x-2">
                <Bot className="h-6 w-6 text-primary" />
                <span className="font-bold sm:inline-block font-headline text-foreground">QuizAI</span>
            </Link>
            <Card className="w-full max-w-sm shadow-2xl bg-card/60 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-headline">
                        {step === 'code' ? "Join a Game" : "Enter Your Nickname"}
                    </CardTitle>
                    <CardDescription>
                        {step === 'code' ? "Enter the code provided by the host." : "This name will be shown on the leaderboard."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === 'code' ? (
                        <>
                            <Input 
                                placeholder="Enter Game Code" 
                                className="text-center text-lg h-12 tracking-widest font-bold"
                                value={code}
                                onChange={(e) => setCode(e.target.value.trim())}
                                onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
                            />
                            <Button className="w-full" size="lg" onClick={handleCodeSubmit} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gamepad2 className="mr-2 h-4 w-4" />}
                                Join
                            </Button>
                        </>
                    ) : (
                         <>
                            <Input 
                                placeholder="e.g. QuizMaster" 
                                className="text-center text-lg h-12 font-bold"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleNicknameSubmit()}
                            />
                            <Button className="w-full" size="lg" onClick={handleNicknameSubmit} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Let's Go!"}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
