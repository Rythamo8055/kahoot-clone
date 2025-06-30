
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Separator } from "@/components/ui/separator";
import type { ConfirmationResult } from "firebase/auth";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const phoneSchema = z.object({
    phone: z.string().min(10, "Please enter a valid phone number with country code."),
});

const otpSchema = z.object({
    otp: z.string().length(6, "Verification code must be 6 digits."),
});

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        <path fill="none" d="M1 1h22v22H1z"/>
    </svg>
);

export default function LoginPage() {
  const { signInWithGoogle, emailSignIn, emailSignUp, signInWithPhone, verifyOtp } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const handleSignIn = async (values: z.infer<typeof signInSchema>) => {
    setIsSigningIn(true);
    await emailSignIn(values.email, values.password);
    setIsSigningIn(false);
  };
  
  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    setIsSigningUp(true);
    await emailSignUp(values.name, values.email, values.password);
    setIsSigningUp(false);
  };
  
  const handleGoogleSignIn = async () => {
    setIsGoogleSigningIn(true);
    await signInWithGoogle();
    setIsGoogleSigningIn(false);
  };

  const handlePhoneSignIn = async (values: z.infer<typeof phoneSchema>) => {
    setIsSendingOtp(true);
    const result = await signInWithPhone(values.phone);
    if (result) {
        setConfirmationResult(result);
    }
    setIsSendingOtp(false);
  };

  const handleOtpVerify = async (values: z.infer<typeof otpSchema>) => {
    if (!confirmationResult) return;
    setIsVerifyingOtp(true);
    await verifyOtp(confirmationResult, values.otp);
    setIsVerifyingOtp(false);
  }

  const isLoading = isSigningIn || isSigningUp || isGoogleSigningIn || isSendingOtp || isVerifyingOtp;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div id="recaptcha-container" className="fixed bottom-0 right-0"></div>
      <Link href="/" className="absolute top-6 left-6 flex items-center space-x-2">
        <Bot className="h-6 w-6 text-primary" />
        <span className="font-bold sm:inline-block font-headline text-foreground">QuizAI</span>
      </Link>
      <Tabs defaultValue="signin" className="w-full max-w-sm">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="signin">Email</TabsTrigger>
          <TabsTrigger value="phone">Phone</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <Card className="bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>Sign in to continue to your dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                    {isGoogleSigningIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                    Sign in with Google
                </Button>
                <div className="flex items-center space-x-2">
                    <Separator className="flex-1"/>
                    <span className="text-xs text-muted-foreground">OR CONTINUE WITH</span>
                    <Separator className="flex-1"/>
                </div>
              <Form {...signInForm}>
                <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                  <FormField control={signInForm.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="m@example.com" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={signInForm.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isSigningIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="phone">
          <Card className="bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Sign In with Phone</CardTitle>
              <CardDescription>
                {confirmationResult ? "Enter the code we sent you." : "We'll send you a verification code."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!confirmationResult ? (
                    <Form {...phoneForm}>
                        <form onSubmit={phoneForm.handleSubmit(handlePhoneSignIn)} className="space-y-4">
                            <FormField control={phoneForm.control} name="phone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl><Input placeholder="+1 555-555-5555" {...field} disabled={isLoading} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isSendingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Code
                            </Button>
                        </form>
                    </Form>
                ) : (
                    <Form {...otpForm}>
                        <form onSubmit={otpForm.handleSubmit(handleOtpVerify)} className="space-y-4">
                            <FormField control={otpForm.control} name="otp" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Verification Code</FormLabel>
                                    <FormControl><Input placeholder="123456" {...field} disabled={isLoading} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <Button type="submit" className="w-full" disabled={isLoading}>
                                {isVerifyingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verify & Sign In
                            </Button>
                             <Button variant="link" size="sm" onClick={() => setConfirmationResult(null)} disabled={isLoading}>
                                Back to phone number entry
                            </Button>
                        </form>
                    </Form>
                )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card className="bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Create an Account</CardTitle>
              <CardDescription>Enter your details below to create your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                    {isGoogleSigningIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                    Sign up with Google
                </Button>
                <div className="flex items-center space-x-2">
                    <Separator className="flex-1"/>
                    <span className="text-xs text-muted-foreground">OR CONTINUE WITH</span>
                    <Separator className="flex-1"/>
                </div>
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                  <FormField control={signUpForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} disabled={isLoading}/></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={signUpForm.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="m@example.com" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={signUpForm.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isSigningUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
