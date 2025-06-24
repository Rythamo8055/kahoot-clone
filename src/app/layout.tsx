import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import BackgroundProvider from "@/components/background-provider";
import AuthProvider from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "QuizAI",
  description: "Create and play quizzes with the power of AI",
  manifest: "/manifest.json",
  icons: {
    icon: "https://raw.githubusercontent.com/linuxdotexe/nordic-wallpapers/master/wallpapers/Minimal-Nord.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#23272f" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <BackgroundProvider>
              {children}
              <Toaster />
            </BackgroundProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
