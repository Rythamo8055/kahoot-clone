
"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, CheckSquare, LogIn, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProfilePage() {
    const { user, loading, logout } = useAuth();
    
    // Note: Quiz history is no longer stored in localStorage.
    // This would need to be fetched from Firestore based on the user's ID.
    const totalQuizzes = 0;
    const totalScore = 0;

    const ProfileSkeleton = () => (
      <AppShell>
        <div className="space-y-8">
            <div className="flex items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-5 w-48" />
            </div>
            </div>
            <Card className="bg-card/60 backdrop-blur-sm">
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
      </AppShell>
    );

    if (loading) {
        return <ProfileSkeleton />;
    }

    if (!user) {
        return (
            <AppShell>
                <div className="text-center py-20 border-2 border-dashed rounded-lg bg-card/60 backdrop-blur-sm">
                    <h3 className="text-xl font-semibold">You are not logged in.</h3>
                    <p className="text-muted-foreground my-2">Please log in to view your profile and stats.</p>
                    <Button asChild className="mt-4">
                        <Link href="/login">
                            <LogIn className="mr-2 h-4 w-4" />
                            Go to Login
                        </Link>
                    </Button>
                </div>
            </AppShell>
        )
    }

    return (
      <AppShell>
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Avatar className="h-24 w-24 border-4 border-accent">
                    <AvatarImage src={user.photoURL ?? ''} data-ai-hint="profile avatar" alt={user.displayName ?? 'User'} />
                    <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                    <h1 className="text-3xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-r from-primary via-pink-400 to-accent">{user.displayName ?? 'Quiz Master'}</h1>
                    <p className="text-muted-foreground">{user.email}</p>
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
                 <Button variant="outline" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4"/>
                    Sign Out
                 </Button>
            </div>

            <Card className="bg-card/60 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-pink-400 to-accent">Quiz History</CardTitle>
                    <CardDescription>Your past quiz performances.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-10">Quiz history coming soon!</p>
                </CardContent>
            </Card>
        </div>
      </AppShell>
    );
}
