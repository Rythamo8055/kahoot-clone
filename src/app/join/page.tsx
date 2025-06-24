"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Gamepad2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Quiz } from "@/lib/types";
import Link from "next/link";
import { Bot } from "lucide-react";

export default function JoinPage() {
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleJoin = () => {
        if (!code) {
            toast({ title: "Please enter a game code.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        
        setTimeout(() => {
            const storedQuizzes = localStorage.getItem("quizzes");
            const quizzes: Quiz[] = storedQuizzes ? JSON.parse(storedQuizzes) : [];
            const quizExists = quizzes.some(q => q.id === code);

            if (quizExists) {
                router.push(`/play/${code}`);
            } else {
                toast({ title: "Game not found", description: "The code you entered is invalid.", variant: "destructive" });
            }
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
             <Link href="/" className="absolute top-6 left-6 flex items-center space-x-2">
                <Bot className="h-6 w-6 text-primary" />
                <span className="font-bold sm:inline-block font-headline text-foreground">QuizAI</span>
            </Link>
            <Card className="w-full max-w-sm shadow-2xl bg-card/60 backdrop-blur-sm md:bg-card">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-headline">Join a Game</CardTitle>
                    <CardDescription>Enter the code provided by the host.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input 
                        placeholder="Enter Game Code" 
                        className="text-center text-lg h-12 tracking-widest font-bold"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                    />
                    <Button className="w-full" size="lg" onClick={handleJoin} disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Gamepad2 className="mr-2 h-4 w-4" />
                        )}
                        Join Game
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
