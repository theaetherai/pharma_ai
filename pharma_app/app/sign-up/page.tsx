"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useSignUp, useClerk, useUser } from "@clerk/nextjs";
import { SignUp } from "@clerk/nextjs";
import { Stethoscope } from "lucide-react";
import { motion } from "framer-motion";

// Form schema
const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded: isClerkLoaded, signUp } = useSignUp();
  const { signOut } = useClerk();
  const { isSignedIn } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Function to handle Google OAuth sign-up
  const handleGoogleSignUp = async () => {
    if (!isClerkLoaded || !signUp) return;
    
    setIsLoading(true);
    try {
      // First sign out the current user if there is an active session
      // This prevents the "single session mode" error
      if (isSignedIn) {
        await signOut();
        console.log("Successfully signed out current user");
      }

      // Redirect to Google OAuth with the correct callback URLs
      signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sign-up/sso-callback",
        redirectUrlComplete: "/dashboard"
      });
    } catch (err) {
      console.error("Google sign up error:", err);
      setError(err instanceof Error ? err.message : "An error occurred signing up with Google");
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to sign up");
      }

      // Navigate to dashboard on success
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : "An error occurred during sign up");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-4 left-4 flex items-center gap-2 text-primary">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Stethoscope className="h-4 w-4 text-primary" />
        </div>
        <span className="font-bold">PharmaAI</span>
      </Link>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join PharmaAI and get access to your personal health assistant</p>
        </div>
        
        <div className="bg-card rounded-xl border shadow-md p-1">
          <SignUp 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0",
                header: "pb-0 text-center",
                headerTitle: "text-xl font-semibold",
                headerSubtitle: "text-muted-foreground text-sm",
                socialButtons: "gap-2",
                socialButtonsBlockButton: "border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors",
                socialButtonsBlockButtonText: "font-medium",
                dividerContainer: "my-4",
                dividerLine: "bg-border",
                dividerText: "text-xs text-muted-foreground px-2",
                formFieldLabel: "text-foreground font-medium text-sm",
                formFieldInput: "rounded-lg border border-input bg-background px-3 py-2 text-sm ring-primary outline-none transition",
                footer: "text-xs text-center text-muted-foreground",
                footerAction: "text-primary hover:text-primary/80",
              }
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            redirectUrl="/dashboard"
          />
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 text-center text-sm text-muted-foreground"
      >
        <p>Already have an account? <Link href="/sign-in" className="text-primary hover:underline">Sign in</Link></p>
      </motion.div>
      
      {/* Visual elements */}
      <div className="fixed top-1/4 -right-64 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 -left-64 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
    </div>
  );
} 