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
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Search,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useState } from "react";

export default function AppointmentsPage() {
  const [showScheduler, setShowScheduler] = useState(false);
  
  // Sample appointment data
  const appointments = [
    {
      id: 1,
      doctor: "Dr. Sarah Johnson",
      specialty: "Cardiologist",
      date: "July 15, 2025",
      time: "10:00 AM",
      location: "Heart Care Center, 123 Medical Blvd",
      status: "upcoming",
    },
    {
      id: 2,
      doctor: "Dr. Michael Chen",
      specialty: "Neurologist",
      date: "August 3, 2025",
      time: "2:30 PM",
      location: "Neuro Health Institute, 456 Brain Ave",
      status: "upcoming",
    },
    {
      id: 3,
      doctor: "Dr. Emily Rodriguez",
      specialty: "Dermatologist",
      date: "May 12, 2025",
      time: "9:15 AM",
      location: "Skin Health Clinic, 789 Dermis Lane",
      status: "completed",
    },
  ];

  return (
    <div className="w-full h-full dashboard-scroll-content">
      <div className="dashboard-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="dashboard-header">
            <div>
              <h1 className="text-2xl font-bold mb-2">Your Appointments</h1>
              <p className="text-muted-foreground">
                Schedule and manage your medical appointments
              </p>
            </div>
            <Button onClick={() => setShowScheduler(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Appointment
            </Button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search appointments..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="dashboard-grid-2">
            {appointments.map((appointment) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`border shadow-sm overflow-hidden ${
                  appointment.status === "completed" ? "opacity-70" : ""
                }`}>
                  <div className="relative">
                    <div className={`absolute top-0 left-0 w-full h-1 ${
                      appointment.status === "upcoming" 
                        ? "bg-gradient-to-r from-violet-500 to-blue-500" 
                        : "bg-gradient-to-r from-gray-300 to-gray-400"
                    }`} />
                    <CardHeader>
                      <div className="flex justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Stethoscope className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base font-semibold">{appointment.doctor}</CardTitle>
                            <CardDescription>{appointment.specialty}</CardDescription>
                          </div>
                        </div>
                        <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary h-fit">
                          {appointment.status === "upcoming" ? "Upcoming" : "Completed"}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{appointment.date}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{appointment.time}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{appointment.location}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 border-t pt-3">
                      {appointment.status === "upcoming" && (
                        <>
                          <Button variant="outline" size="sm">Reschedule</Button>
                          <Button variant="destructive" size="sm">Cancel</Button>
                        </>
                      )}
                      {appointment.status === "completed" && (
                        <Button variant="outline" size="sm">View Details</Button>
                      )}
                    </CardFooter>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {showScheduler && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-background rounded-lg shadow-lg max-w-md w-full relative"
              >
                <button 
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted"
                  onClick={() => setShowScheduler(false)}
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Schedule New Appointment</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Doctor</label>
                      <div className="relative">
                        <UserRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Select doctor" className="pl-10" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input type="date" className="pl-10" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input type="time" className="pl-10" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Reason for Visit</label>
                      <Input placeholder="Brief description of your visit" />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowScheduler(false)}>Cancel</Button>
                    <Button onClick={() => {
                      alert("Appointment scheduled!");
                      setShowScheduler(false);
                    }}>Schedule</Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 