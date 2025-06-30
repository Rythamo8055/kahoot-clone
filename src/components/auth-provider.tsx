
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, type User, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  emailSignUp: (name: string, email: string, pass: string) => Promise<void>;
  emailSignIn: (email: string, pass: string) => Promise<void>;
  signInWithPhone: (phoneNumber: string) => Promise<ConfirmationResult | null>;
  verifyOtp: (confirmationResult: ConfirmationResult, otp: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (message: string) => {
    router.push('/dashboard');
    toast({ title: message });
  }

  const handleAuthError = (error: any) => {
    console.error("Firebase Auth Error:", error);
    let description = "An unexpected error occurred.";
    if (error.code) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                description = 'This email is already registered.';
                break;
            case 'auth/wrong-password':
                description = 'Incorrect password. Please try again.';
                break;
            case 'auth/user-not-found':
                description = 'No account found with this email.';
                break;
            case 'auth/invalid-credential':
                 description = 'The email or password you entered is incorrect.';
                 break;
            case 'auth/invalid-phone-number':
                 description = 'The phone number is not valid.';
                 break;
            case 'auth/too-many-requests':
                 description = 'Too many requests. Please try again later.';
                 break;
            case 'auth/invalid-verification-code':
                 description = 'The verification code is incorrect.';
                 break;
            default:
                description = error.message;
        }
    }
    toast({ title: 'Authentication Failed', description, variant: 'destructive' });
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      handleAuthSuccess('Signed in successfully!');
    } catch (error) {
      handleAuthError(error);
    }
  };
  
  const emailSignUp = async (name: string, email: string, pass: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCredential.user, { displayName: name });
      setUser(userCredential.user); // Manually update state
      handleAuthSuccess('Account created successfully!');
    } catch (error) {
      handleAuthError(error);
    }
  };
  
  const emailSignIn = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      handleAuthSuccess('Signed in successfully!');
    } catch (error) {
      handleAuthError(error);
    }
  };

  const signInWithPhone = async (phoneNumber: string): Promise<ConfirmationResult | null> => {
    try {
      // It's important that the reCAPTCHA is invisible and rendered.
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      toast({ title: 'Verification code sent!' });
      return confirmationResult;
    } catch (error) {
      handleAuthError(error);
      return null;
    }
  };

  const verifyOtp = async (confirmationResult: ConfirmationResult, otp: string) => {
    try {
      await confirmationResult.confirm(otp);
      handleAuthSuccess('Signed in successfully!');
    } catch (error) {
      handleAuthError(error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
      toast({ title: 'Signed out.' });
    } catch (error) {
      handleAuthError(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Authenticating...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, emailSignUp, emailSignIn, signInWithPhone, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
