
"use client";

import { useEffect, useState, useRef } from "react";
import AppShell from "@/components/app-shell";
import type { QuizResult } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Calendar, CheckSquare, Edit2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
    const [results, setResults] = useState<QuizResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [avatarSrc, setAvatarSrc] = useState("https://placehold.co/100x100.png");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const storedResults = localStorage.getItem("quizResults");
        if (storedResults) {
            setResults(JSON.parse(storedResults).reverse());
        }
        
        const storedAvatar = localStorage.getItem("userAvatar");
        if (storedAvatar) {
            setAvatarSrc(storedAvatar);
        }

        setLoading(false);
    }, []);

    const totalQuizzes = results.length;
    const totalScore = results.reduce((acc, r) => acc + r.score, 0);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                if(dataUrl) {
                    setAvatarSrc(dataUrl);
                    localStorage.setItem("userAvatar", dataUrl);
                }
            };
            reader.readAsDataURL(file);
        }
    };


    const ProfileSkeleton = () => (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-5 w-48" />
          </div>
        </div>
        <Card className="bg-card/60 backdrop-blur-sm md:bg-card">
          <CardHeader>
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );

    if (loading) return <AppShell><ProfileSkeleton /></AppShell>;

    return (
      <AppShell>
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                    <Avatar className="h-24 w-24 border-4 border-accent">
                        <AvatarImage data-ai-hint="profile avatar" src={avatarSrc} alt="User Avatar" />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="h-8 w-8 text-white" />
                    </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*" 
                />
                <div className="flex-1">
                    <h1 className="text-3xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-r from-primary via-pink-400 to-accent">Quiz Master</h1>
                    <p className="text-muted-foreground">Your quizzing journey and achievements.</p>
                     <div className="flex items-center gap-6 mt-2 text-sm text-foreground">
                        <div className="flex items-center gap-2">
                            <CheckSquare className="h-5 w-5 text-primary" />
                            <span><span className="font-bold">{totalQuizzes}</span> Quizzes Taken</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-primary" />
                            <span><span className="font-bold">{totalScore}</span> Total Points</span>
                        </div>
                    </div>
                </div>
            </div>

            <Card className="bg-card/60 backdrop-blur-sm md:bg-card">
                <CardHeader>
                    <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-pink-400 to-accent">Quiz History</CardTitle>
                    <CardDescription>Your past quiz performances.</CardDescription>
                </CardHeader>
                <CardContent>
                    {results.length > 0 ? (
                        <ul className="space-y-4">
                            {results.map((result, index) => (
                                <li key={index} className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent/20 transition-colors">
                                    <div>
                                        <p className="font-semibold">{result.quizTitle || `Quiz ID: ${result.quizId}`}</p>
                                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            <span>{new Date(result.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center font-bold text-primary text-lg">
                                        <Trophy className="h-5 w-5 mr-2" />
                                        <span>{result.score} pts</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-muted-foreground py-10">No quizzes played yet. Go play one!</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </AppShell>
    );
}
