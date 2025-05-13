"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChatInterface } from "@/components/chat-interface";
import {
  Activity,
  Bot,
  Calendar,
  Heart,
  Pill,
  Plus,
  Stethoscope,
  Thermometer,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user } = useUser();
  const firstName = user?.firstName || "User";

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="w-full h-full dashboard-scroll-content">
      <div className="dashboard-page space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl md:text-3xl font-medium mb-1">
            Welcome back, <span className="text-primary">{firstName}</span>
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your health information and services.
          </p>
        </motion.div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          <motion.div variants={item}>
            <Link href="/dashboard/health-score" className="block">
              <Card className="border shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium">Health Score</CardTitle>
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Heart className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <CardDescription>Overall wellness assessment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className="text-3xl font-bold">87</div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +3%
                      </span>
                    </div>
                    <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: "87%" }} />
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link href="/dashboard/vitals" className="block">
              <Card className="border shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-blue-400" />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium">Vitals</CardTitle>
                      <div className="p-2 bg-accent/10 rounded-full">
                        <Activity className="h-4 w-4 text-accent" />
                      </div>
                    </div>
                    <CardDescription>Latest measurements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Thermometer className="h-3 w-3" /> Temperature
                        </div>
                        <div className="font-medium">98.6°F</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Activity className="h-3 w-3" /> Heart Rate
                        </div>
                        <div className="font-medium">72 BPM</div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link href="/dashboard/medications" className="block">
              <Card className="border shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-violet-500" />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium">Medications</CardTitle>
                      <div className="p-2 bg-blue-500/10 rounded-full">
                        <Pill className="h-4 w-4 text-blue-500" />
                      </div>
                    </div>
                    <CardDescription>Active prescriptions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">Amoxicillin</div>
                        <div className="text-xs text-muted-foreground">500mg</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">Ibuprofen</div>
                        <div className="text-xs text-muted-foreground">200mg</div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link href="/dashboard/appointments" className="block">
              <Card className="border shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-primary" />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium">Appointments</CardTitle>
                      <div className="p-2 bg-violet-500/10 rounded-full">
                        <Calendar className="h-4 w-4 text-violet-500" />
                      </div>
                    </div>
                    <CardDescription>Upcoming visits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium">Dr. Sarah Johnson</div>
                        <div className="text-xs text-muted-foreground flex items-center mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          July 15, 2023 • 10:00 AM
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border shadow-md overflow-hidden">
                <CardHeader className="border-b bg-secondary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      <CardTitle>AI Health Assistant</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard/chat">
                        Full Consultation
                      </Link>
                    </Button>
                  </div>
                  <CardDescription>
                    Describe your symptoms for an initial assessment
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[420px]">
                    <ChatInterface />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card className="border shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    <CardTitle>Recommended Doctors</CardTitle>
                  </div>
                  <CardDescription>Based on your health profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-primary">
                        RJ
                      </div>
                      <div>
                        <div className="font-medium text-sm">Dr. Robert Johnson</div>
                        <div className="text-xs text-muted-foreground">Cardiologist</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center font-bold text-accent">
                        AL
                      </div>
                      <div>
                        <div className="font-medium text-sm">Dr. Amy Lee</div>
                        <div className="text-xs text-muted-foreground">Neurologist</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="w-full text-primary">
                    <div className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      View All Doctors
                    </div>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="border shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <Pill className="h-5 w-5 text-primary" />
                    <CardTitle>Vaccination Status</CardTitle>
                  </div>
                  <CardDescription>Your immunization record</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <div className="text-sm">COVID-19</div>
                      <div className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Up to date
                      </div>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                      <div className="text-sm">Influenza</div>
                      <div className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Up to date
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm">Tetanus</div>
                      <div className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                        Due soon
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="w-full text-primary">
                    <div className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Vaccination
                    </div>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 