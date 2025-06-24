"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/create", icon: PlusSquare, label: "Create" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border shadow-[0_-1px_4px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex h-full max-w-md items-center justify-around px-4">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 transition-colors w-16",
              pathname === link.href
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            <link.icon className="h-6 w-6" />
            <span className="text-xs font-medium">{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
