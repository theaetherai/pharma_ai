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
  Mail,
  MapPin,
  Phone,
  Search,
  Star,
  Stethoscope,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function DoctorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  // Sample doctor data
  const doctors = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      specialty: "Cardiologist",
      rating: 4.8,
      reviews: 124,
      experience: "15 years",
      education: "Harvard Medical School",
      availableSlots: ["Mon 10:00 AM", "Wed 2:30 PM", "Fri 9:00 AM"],
      location: "Heart Care Center, 123 Medical Blvd",
      image: "",
      acceptingNewPatients: true,
    },
    {
      id: 2,
      name: "Dr. Michael Chen",
      specialty: "Neurologist",
      rating: 4.7,
      reviews: 98,
      experience: "12 years",
      education: "Johns Hopkins University",
      availableSlots: ["Tue 11:00 AM", "Thu 3:00 PM"],
      location: "Neuro Health Institute, 456 Brain Ave",
      image: "",
      acceptingNewPatients: true,
    },
    {
      id: 3,
      name: "Dr. Emily Rodriguez",
      specialty: "Dermatologist",
      rating: 4.9,
      reviews: 156,
      experience: "10 years",
      education: "Stanford University",
      availableSlots: ["Mon 3:30 PM", "Thu 10:00 AM", "Fri 1:00 PM"],
      location: "Skin Health Clinic, 789 Dermis Lane",
      image: "",
      acceptingNewPatients: true,
    },
    {
      id: 4,
      name: "Dr. James Wilson",
      specialty: "Pediatrician",
      rating: 4.6,
      reviews: 87,
      experience: "8 years",
      education: "Yale School of Medicine",
      availableSlots: ["Tue 9:00 AM", "Wed 11:30 AM", "Fri 2:00 PM"],
      location: "Children's Wellness Center, 234 Kid Blvd",
      image: "",
      acceptingNewPatients: false,
    },
    {
      id: 5,
      name: "Dr. Patricia Martinez",
      specialty: "Psychiatrist",
      rating: 4.9,
      reviews: 112,
      experience: "14 years",
      education: "Columbia University",
      availableSlots: ["Mon 1:00 PM", "Thu 9:30 AM"],
      location: "Mind Wellness Clinic, 567 Psych Ave",
      image: "",
      acceptingNewPatients: true,
    },
  ];

  // Get unique specialties for filtering
  const specialties = Array.from(new Set(doctors.map(doc => doc.specialty)));
  
  // Filter doctors based on search and specialty
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = searchTerm === "" || 
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialty = selectedSpecialty === null || doctor.specialty === selectedSpecialty;
    
    return matchesSearch && matchesSpecialty;
  });

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
              <h1 className="text-2xl font-bold mb-2">Find a Doctor</h1>
              <p className="text-muted-foreground">
                Browse our network of specialists and primary care physicians
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or specialty..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <Button 
              variant={selectedSpecialty === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSpecialty(null)}
            >
              All Specialties
            </Button>
            {specialties.map(specialty => (
              <Button
                key={specialty}
                variant={selectedSpecialty === specialty ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSpecialty(specialty)}
              >
                {specialty}
              </Button>
            ))}
          </div>

          <div className="dashboard-grid-2">
            {filteredDoctors.length > 0 ? (
              filteredDoctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))
            ) : (
              <div className="text-center py-8 col-span-full">
                <p className="text-muted-foreground">No doctors found matching your criteria.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DoctorCard({ doctor }: { doctor: any }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border shadow-sm overflow-hidden">
        <div className="relative">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage src={doctor.image} alt={doctor.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {doctor.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg font-semibold mb-1">{doctor.name}</CardTitle>
                  <CardDescription className="text-base mb-2">{doctor.specialty}</CardDescription>
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium">{doctor.rating}</span>
                    <span className="text-sm text-muted-foreground">({doctor.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{doctor.experience} Experience</Badge>
                    {doctor.acceptingNewPatients ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                        Accepting New Patients
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Not Accepting New Patients
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Stethoscope className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Education: {doctor.education}</span>
              </div>
              <div className="flex items-start text-sm">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-1" />
                <span>{doctor.location}</span>
              </div>
              
              {expanded && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="pt-2 space-y-3 border-t mt-3"
                >
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>(555) 123-4567</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{doctor.name.toLowerCase().replace(' ', '.')}@medclinic.com</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Available Appointment Slots:</h4>
                    <div className="flex flex-wrap gap-2">
                      {doctor.availableSlots.map((slot, index) => (
                        <Badge key={index} variant="outline" className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {slot}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Less Details" : "More Details"}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Contact
              </Button>
              <Button 
                size="sm" 
                disabled={!doctor.acceptingNewPatients}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </div>
          </CardFooter>
        </div>
      </Card>
    </motion.div>
  );
} 