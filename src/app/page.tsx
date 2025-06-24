import { Button } from "@/components/ui/button";
import { Sparkles, Gamepad2, ArrowRight, Bot } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
            <Bot className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block font-headline text-foreground">QuizAI</span>
        </Link>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] opacity-10"></div>
        
        <div className="bg-accent/50 text-accent-foreground/80 font-semibold text-sm rounded-full px-4 py-1 mb-4 inline-flex items-center shadow-sm">
          <Sparkles className="w-4 h-4 mr-2 text-primary" />
          Powered by Generative AI
        </div>

        <h2 className="text-5xl md:text-7xl font-bold mb-4 font-headline bg-clip-text text-transparent bg-gradient-to-r from-primary via-pink-400 to-accent">
          The Future of Quizzing is Here
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Create engaging quizzes in seconds with our AI-powered generator, or join exciting real-time quiz battles.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" asChild className="font-bold text-lg shadow-lg">
            <Link href="/create">
              Create a Quiz <ArrowRight className="ml-2" />
            </Link>
          </Button>
          <Button size="lg" variant="secondary" asChild className="font-bold text-lg shadow-lg">
            <Link href="/join">
              Join a Game <Gamepad2 className="ml-2" />
            </Link>
          </Button>
        </div>
      </main>
      <footer className="container mx-auto px-4 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} QuizAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
