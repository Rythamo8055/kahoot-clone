
"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Repeat, Home } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { collectionGroup, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


export default function ResultsPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const quizTitle = searchParams.get("title");
  const quizId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [resultsData, setResultsData] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !quizId) return;

    const fetchResults = async () => {
      setLoading(true);
      try {
        const gamesQuery = query(
          collection(db, "games"),
          where("quizId", "==", quizId),
          where("gameState", "==", "finished")
        );
        
        const gamesSnapshot = await getDocs(gamesQuery);
        const allPlayers: any[] = [];

        for (const gameDoc of gamesSnapshot.docs) {
          const playersQuery = collection(db, "games", gameDoc.id, "players");
          const playersSnapshot = await getDocs(playersQuery);
          playersSnapshot.docs.forEach(playerDoc => {
            allPlayers.push({
              gameId: gameDoc.id,
              ...playerDoc.data()
            });
          });
        }
        
        const aggregatedData = allPlayers.reduce((acc, player) => {
            const existingPlayer = acc.find((p: any) => p.name === player.name);
            if (existingPlayer) {
                existingPlayer.score = Math.max(existingPlayer.score, player.score);
                existingPlayer.gamesPlayed += 1;
            } else {
                acc.push({ name: player.name, score: player.score, gamesPlayed: 1 });
            }
            return acc;
        }, []);
        
        setResultsData(aggregatedData.sort((a,b) => b.score - a.score));

      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [quizId, user]);


  if (loading) {
    return (
       <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Loading Results...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-4xl text-center shadow-2xl bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <div className="mx-auto bg-accent rounded-full p-4 w-fit mb-4">
            <Award className="h-12 w-12 text-accent-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline">Results for "{quizTitle || 'Quiz'}"</CardTitle>
          <CardDescription>See how players performed in this quiz.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {resultsData.length > 0 ? (
            <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={resultsData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5, }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
                        <Legend />
                        <Bar dataKey="score" fill="hsl(var(--primary))" name="Highest Score" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          ) : (
             <p className="text-muted-foreground py-10">No results found for this quiz yet.</p>
          )}
          
          <div className="flex w-full gap-4 pt-4 justify-center">
            <Button className="w-full max-w-xs" asChild>
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
