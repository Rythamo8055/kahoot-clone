
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusSquare, User, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SettingsMenu from "./settings-menu";
import { useAuth } from "./auth-provider";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navLinks = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/create", icon: PlusSquare, label: "Create" },
    { 
      href: user ? "/profile" : "/login", 
      icon: user ? User : LogIn, 
      label: user ? "Profile" : "Login" 
    },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <TooltipProvider delayDuration={0}>
        <div className="flex h-16 items-center justify-center gap-1 rounded-full border bg-card/60 p-2 shadow-lg backdrop-blur-sm md:h-20 md:gap-4 md:px-8">
          {navLinks.map((link) => (
            <Tooltip key={link.href}>
              <TooltipTrigger asChild>
                <Link
                  href={link.href}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:h-14 md:w-14",
                    (pathname === link.href || (pathname === '/login' && link.href === (user ? '/profile' : '/login'))) && "bg-accent text-accent-foreground"
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  <span className="sr-only">{link.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{link.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          
          <div className="mx-1 h-8 w-px bg-border" />

          <SettingsMenu />

        </div>
      </TooltipProvider>
    </nav>
  );
}
