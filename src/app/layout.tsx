import type { Metadata } from "next";
import { Poppins } from 'next/font/google';
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import BackgroundProvider from "@/components/background-provider";
import AuthProvider from "@/components/auth-provider";

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: "QuizAI",
  description: "Create and play quizzes with the power of AI",
  manifest: "/manifest.json",
  icons: {
    icon: "https://raw.githubusercontent.com/linuxdotexe/nordic-wallpapers/master/wallpapers/Minimal-Nord.png",
    apple: "https://raw.githubusercontent.com/linuxdotexe/nordic-wallpapers/master/wallpapers/Minimal-Nord.png",
  },
  themeColor: "#23272f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
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
