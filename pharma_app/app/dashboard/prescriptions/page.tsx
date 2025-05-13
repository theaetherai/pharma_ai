"use client";

import { useEffect, useState } from "react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Calendar,
  Download,
  FilePlus,
  Pill,
  Search,
  Stethoscope,
  User,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@clerk/nextjs";
import { format } from "date-fns";

// Prescription interface
interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  prescribedAt: string;
  endDate: string;
  doctorName: string;
  refills: number;
  status: "ACTIVE" | "EXPIRED" | "COMPLETED" | "CANCELLED";
  instructions?: string;
}

export default function PrescriptionsPage() {
  const [activePrescriptions, setActivePrescriptions] = useState<Prescription[]>([]);
  const [pastPrescriptions, setPastPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { userId, isLoaded, isSignedIn } = useAuth();

  // Fetch prescriptions from the database
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/prescriptions');
        
        if (!response.ok) {
          throw new Error('Failed to fetch prescriptions');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Sort into active and past prescriptions
          const active = data.prescriptions.filter(
            (p: Prescription) => p.status === "ACTIVE"
          );
          
          const past = data.prescriptions.filter(
            (p: Prescription) => p.status !== "ACTIVE"
          );
          
          setActivePrescriptions(active);
          setPastPrescriptions(past);
        }
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch prescriptions if user is authenticated
    if (isLoaded && isSignedIn && userId) {
      fetchPrescriptions();
    }
  }, [isLoaded, isSignedIn, userId]);

  // Filter prescriptions based on search query
  const filteredActive = activePrescriptions.filter(p => 
    p.medication.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.doctorName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredPast = pastPrescriptions.filter(p => 
    p.medication.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.doctorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Request a refill
  const requestRefill = async (prescriptionId: string) => {
    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prescriptionId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Refill requested for ${activePrescriptions.find(p => p.id === prescriptionId)?.medication}`);
        // Refresh prescriptions list
        const updatedPrescriptions = activePrescriptions.map(p => 
          p.id === prescriptionId 
            ? {...p, refills: p.refills - 1}
            : p
        );
        setActivePrescriptions(updatedPrescriptions);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error requesting refill:', error);
      alert('Failed to request refill. Please try again.');
    }
  };
  
  // Handle top "Request Refill" button click
  const handleTopRefillButton = () => {
    // Find first prescription with refills available
    const eligiblePrescription = activePrescriptions.find(p => p.refills > 0);
    
    if (eligiblePrescription) {
      requestRefill(eligiblePrescription.id);
    } else {
      alert('No prescriptions available for refill.');
    }
  };

  return (
    <div className="w-full h-full dashboard-scroll-content">
      <div className="dashboard-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">Your Prescriptions</h1>
              <p className="text-muted-foreground">
                View and manage your prescription medications
              </p>
            </div>
            <Button onClick={handleTopRefillButton}>
              <FilePlus className="mr-2 h-4 w-4" />
              Request Refill
            </Button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prescriptions..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-lg">Loading prescriptions...</span>
            </div>
          ) : (
            <Tabs defaultValue="active" className="space-y-6">
              <TabsList className="mb-4">
                <TabsTrigger value="active">
                  Active Prescriptions {filteredActive.length > 0 && `(${filteredActive.length})`}
                </TabsTrigger>
                <TabsTrigger value="past">
                  Past Prescriptions {filteredPast.length > 0 && `(${filteredPast.length})`}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="space-y-4">
                {filteredActive.length === 0 ? (
                  <div className="text-center py-12 bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground">No active prescriptions found.</p>
                  </div>
                ) : (
                  filteredActive.map((prescription) => (
                    <PrescriptionCard 
                      key={prescription.id} 
                      prescription={prescription} 
                      status="active" 
                      onRequestRefill={requestRefill}
                    />
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="past" className="space-y-4">
                {filteredPast.length === 0 ? (
                  <div className="text-center py-12 bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground">No past prescriptions found.</p>
                  </div>
                ) : (
                  filteredPast.map((prescription) => (
                    <PrescriptionCard 
                      key={prescription.id} 
                      prescription={prescription} 
                      status="past" 
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </motion.div>
      </div>
    </div>
  );
}

interface PrescriptionCardProps {
  prescription: Prescription;
  status: "active" | "past";
  onRequestRefill?: (id: string) => void;
}

function PrescriptionCard({ prescription, status, onRequestRefill }: PrescriptionCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  // Get badge variant based on status
  const getBadgeVariant = () => {
    if (status === "active") return "default";
    
    switch (prescription.status) {
      case "EXPIRED": return "destructive";
      case "COMPLETED": return "secondary";
      case "CANCELLED": return "outline";
      default: return "secondary";
    }
  };
  
  // Get status text to display
  const getStatusText = () => {
    if (status === "active") return prescription.refills > 0 ? `${prescription.refills} refills left` : "No refills left";
    
    switch (prescription.status) {
      case "EXPIRED": return "Expired";
      case "COMPLETED": return "Completed";
      case "CANCELLED": return "Cancelled";
      default: return prescription.status;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border shadow-sm overflow-hidden ${
        status === "past" ? "opacity-70" : ""
      }`}>
        <div className="relative">
          <div className={`absolute top-0 left-0 w-full h-1 ${
            status === "active" 
              ? "bg-gradient-to-r from-blue-400 to-primary" 
              : "bg-gradient-to-r from-gray-300 to-gray-400"
          }`} />
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Pill className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">{prescription.medication}</CardTitle>
                    <Badge variant={status === "active" ? "default" : "secondary"} className="ml-2">
                      {prescription.dosage}
                    </Badge>
                  </div>
                  <CardDescription>{prescription.frequency}</CardDescription>
                </div>
              </div>
              <Badge variant={getBadgeVariant()} className={status === "active" && prescription.refills > 0 ? "bg-green-50 text-green-700 border-green-200" : ""}>
                {getStatusText()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Prescribed: {formatDate(prescription.prescribedAt)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Ends: {formatDate(prescription.endDate)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Stethoscope className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Prescribed by: {prescription.doctorName}</span>
                </div>
                {prescription.instructions && (
                  <div className="flex items-start text-sm">
                    <User className="h-4 w-4 mr-2 mt-1 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1">{prescription.instructions}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            {status === "active" && prescription.refills > 0 && onRequestRefill && (
              <Button size="sm" onClick={() => onRequestRefill(prescription.id)}>
                Refill Now
              </Button>
            )}
          </CardFooter>
        </div>
      </Card>
    </motion.div>
  );
} 