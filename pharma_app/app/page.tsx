"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Activity, Pill, CreditCard, ShieldCheck, BarChart3, Package, Bot, Stethoscope, Users, Heart, Sparkles, Shield } from "lucide-react"
import { SignUpButton, SignInButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ChatInterface } from "@/components/chat-interface";

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [mockDiagnosis, setMockDiagnosis] = useState(null);

  // Redirect to dashboard if user is already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  // Test function to simulate diagnosis for debugging
  const generateMockDiagnosis = () => {
    console.log("Generating mock diagnosis for testing...");
    const testDiagnosis = {
      diagnosis: "Test Migraine Diagnosis",
      prescriptions: [
        {
          drug_name: "Test Sumatriptan",
          dosage: "50mg",
          form: "tablet",
          duration: "7 days",
          instructions: "Take 1 tablet when needed for migraine attacks"
        }
      ],
      follow_up_recommendations: "Test follow-up in 2 weeks"
    };
    
    console.log("Mock diagnosis generated:", testDiagnosis);
    setMockDiagnosis(testDiagnosis);
    
    // Pass to the chat interface somehow
    // This is just for debugging - in a real app, you'd use proper state management
    window.mockDiagnosisForTesting = testDiagnosis;
    
    // Try to call the global diagnosis handler if it exists
    if (window.setDiagnosisForTesting) {
      window.setDiagnosisForTesting(testDiagnosis);
    } else {
      console.error("setDiagnosisForTesting function not found in window");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-card/90 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold">PharmaAI</h1>
          </div>
          <div className="flex items-center gap-3">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">
                Sign Up
              </Button>
            </SignUpButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 md:py-32 mt-16 bg-gradient-to-b from-background to-primary/5">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="text-primary">AI-Powered</span> Healthcare Assistant
                </h1>
                <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                  Get instant diagnoses, medication recommendations, and expert healthcare guidance powered by advanced AI.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <SignUpButton mode="modal">
                    <Button size="lg" className="gap-2 group">
                      Get Started
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </SignUpButton>
                  <Link href="/about">
                    <Button variant="outline" size="lg">
                      Learn More
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-6 mt-8">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-r from-primary/10 to-primary/30 flex items-center justify-center border-2 border-background"
                      >
                        <span className="text-xs font-medium text-primary">
                          {String.fromCharCode(64 + i)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">1,000+</span> users trust PharmaAI
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                <div className="relative z-10 bg-card border rounded-xl shadow-xl p-6 md:ml-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Dr. PharmaAI</h3>
                      <p className="text-xs text-muted-foreground">Virtual Medical Assistant</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-3 mb-3">
                    <p className="text-sm">
                      I've analyzed your symptoms. Based on the persistent headache and fever for 2 days, you may have a viral infection. Let me recommend some options to help manage your symptoms.
                    </p>
                  </div>
                  
                  <div className="bg-primary/10 rounded-lg p-3 text-sm font-medium text-primary mb-4">
                    <div className="flex items-start gap-2">
                      <Pill className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        Recommended: Acetaminophen (500mg) for pain and fever relief, plenty of fluids, and rest.
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-3">Would you like to see the full diagnosis?</div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" className="w-full">View Diagnosis</Button>
                  </div>
                </div>
                
                <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-gradient-to-br from-primary/20 to-accent/10 rounded-full blur-3xl -z-10" />
                <div className="absolute -top-8 -left-8 w-64 h-64 bg-gradient-to-tr from-accent/10 to-primary/20 rounded-full blur-3xl -z-10" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How PharmaAI Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our AI-powered system provides accurate health assessments and medication recommendations through a simple conversation.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Bot className="h-8 w-8 text-primary" />,
                  title: "AI Consultation",
                  description: "Chat with our AI to describe your symptoms and receive instant preliminary assessments."
                },
                {
                  icon: <Stethoscope className="h-8 w-8 text-accent" />,
                  title: "Smart Diagnosis",
                  description: "Get detailed health evaluations based on your symptoms using advanced medical algorithms."
                },
                {
                  icon: <Pill className="h-8 w-8 text-blue-500" />,
                  title: "Medication Guidance",
                  description: "Receive personalized medication recommendations with dosage information and precautions."
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-card border rounded-xl p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-gradient-to-b from-background to-secondary/20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose PharmaAI</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We combine advanced artificial intelligence with medical expertise to provide reliable healthcare guidance.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {
                  icon: <Sparkles className="h-6 w-6 text-primary" />,
                  title: "AI-Powered Precision",
                  description: "Advanced algorithms trained on medical data for accurate assessments"
                },
                {
                  icon: <Shield className="h-6 w-6 text-green-500" />,
                  title: "Safe & Private",
                  description: "Your health data is encrypted and never shared with third parties"
                },
                {
                  icon: <Bot className="h-6 w-6 text-blue-500" />,
                  title: "24/7 Availability",
                  description: "Get healthcare guidance any time of day or night"
                },
                {
                  icon: <Heart className="h-6 w-6 text-red-500" />,
                  title: "Holistic Approach",
                  description: "Comprehensive health assessments considering multiple factors"
                }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-card border rounded-xl p-6 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg font-medium mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-card">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to experience the future of healthcare?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of users who trust PharmaAI for their health needs.
              </p>
              <SignUpButton mode="modal">
                <Button size="lg" className="gap-2 px-8 group">
                  Get Started Now
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </SignUpButton>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Stethoscope className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-bold">PharmaAI</h2>
            </div>
            <div className="flex gap-8">
              <Link href="/about" className="text-sm hover:text-primary transition-colors">About</Link>
              <Link href="/privacy" className="text-sm hover:text-primary transition-colors">Privacy</Link>
              <Link href="/terms" className="text-sm hover:text-primary transition-colors">Terms</Link>
              <Link href="/contact" className="text-sm hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} PharmaAI. All rights reserved.</p>
            <p className="mt-2">This is a demonstration application and not a substitute for professional medical advice.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

