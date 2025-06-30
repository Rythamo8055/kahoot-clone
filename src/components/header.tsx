
"use client";

import Link from "next/link";
import { Home, PlusSquare, User, Bot, LogIn } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "./auth-provider";

export default function Header() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/create", label: "Create Quiz", icon: PlusSquare },
    { 
      href: user ? "/profile" : "/login", 
      label: user ? "Profile" : "Login", 
      icon: user ? User : LogIn 
    },
  ];

  return (
    <header className="hidden md:flex sticky top-0 z-50 w-full border-b bg-card">
      <div className="container flex h-14 items-center">
        <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
          <Bot className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block font-headline">QuizAI</span>
        </Link>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === link.href ? "text-foreground" : "text-foreground/60"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
