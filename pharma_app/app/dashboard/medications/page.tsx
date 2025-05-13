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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Filter,
  Info,
  ListFilter,
  Pill,
  Plus,
  Search,
  ShoppingCart,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function MedicationsPage() {
  const [filterPrescription, setFilterPrescription] = useState(false);
  const [filterOTC, setFilterOTC] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Sample medication data
  const medications = [
    {
      id: 1,
      name: "Amoxicillin",
      genericName: "Amoxicillin",
      description: "An antibiotic used to treat bacterial infections.",
      dosage: "250mg, 500mg",
      category: "Antibiotics",
      requiresPrescription: true,
      inStock: true,
      price: 14.99
    },
    {
      id: 2,
      name: "Ibuprofen",
      genericName: "Ibuprofen",
      description: "A nonsteroidal anti-inflammatory drug used for pain relief and to reduce fever and inflammation.",
      dosage: "200mg, 400mg, 600mg",
      category: "Pain Relievers",
      requiresPrescription: false,
      inStock: true,
      price: 8.99
    },
    {
      id: 3,
      name: "Lisinopril",
      genericName: "Lisinopril",
      description: "An ACE inhibitor used to treat high blood pressure and heart failure.",
      dosage: "5mg, 10mg, 20mg",
      category: "Blood Pressure",
      requiresPrescription: true,
      inStock: true,
      price: 12.50
    },
    {
      id: 4,
      name: "Cetirizine",
      genericName: "Cetirizine hydrochloride",
      description: "An antihistamine used to relieve allergy symptoms such as watery eyes, runny nose, itching eyes, and sneezing.",
      dosage: "10mg",
      category: "Allergy",
      requiresPrescription: false,
      inStock: true,
      price: 9.99
    },
    {
      id: 5,
      name: "Metformin",
      genericName: "Metformin hydrochloride",
      description: "An oral diabetes medicine that helps control blood sugar levels.",
      dosage: "500mg, 850mg, 1000mg",
      category: "Diabetes",
      requiresPrescription: true,
      inStock: false,
      price: 16.75
    },
  ];

  // Filter medications based on filters
  const filteredMedications = medications.filter(med => {
    const matchesSearch = searchTerm === "" || 
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPrescription = !filterPrescription || med.requiresPrescription;
    const matchesOTC = !filterOTC || !med.requiresPrescription;
    
    return matchesSearch && matchesPrescription && matchesOTC;
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
              <h1 className="text-2xl font-bold mb-2">Medications Database</h1>
              <p className="text-muted-foreground">
                Browse and search for medications and supplements
              </p>
            </div>
            <Button>
              <ShoppingCart className="mr-2 h-4 w-4" />
              View Cart
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search medications..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Select defaultValue="all">
                <SelectTrigger className="w-full sm:w-[180px]">
                  <ListFilter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="antibiotics">Antibiotics</SelectItem>
                  <SelectItem value="pain-relievers">Pain Relievers</SelectItem>
                  <SelectItem value="blood-pressure">Blood Pressure</SelectItem>
                  <SelectItem value="allergy">Allergy</SelectItem>
                  <SelectItem value="diabetes">Diabetes</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="prescription" 
                checked={filterPrescription}
                onCheckedChange={(checked) => setFilterPrescription(checked as boolean)}
              />
              <Label htmlFor="prescription">Prescription Only</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="otc" 
                checked={filterOTC}
                onCheckedChange={(checked) => setFilterOTC(checked as boolean)}
              />
              <Label htmlFor="otc">Over the Counter</Label>
            </div>
          </div>

          <div className="dashboard-grid">
            {filteredMedications.length > 0 ? (
              filteredMedications.map((medication) => (
                <MedicationCard key={medication.id} medication={medication} />
              ))
            ) : (
              <div className="text-center py-8 col-span-full">
                <p className="text-muted-foreground">No medications found matching your criteria.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function MedicationCard({ medication }: { medication: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border shadow-sm overflow-hidden">
        <div className="relative">
          <div className={`absolute top-0 left-0 w-full h-1 ${
            medication.requiresPrescription
              ? "bg-gradient-to-r from-blue-400 to-primary"
              : "bg-gradient-to-r from-green-400 to-teal-500"
          }`} />
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Pill className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base font-semibold">{medication.name}</CardTitle>
                    {medication.requiresPrescription ? (
                      <Badge variant="default" className="ml-2">
                        Prescription
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-2">
                        Over the Counter
                      </Badge>
                    )}
                    {!medication.inStock && (
                      <Badge variant="destructive" className="ml-2">
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{medication.genericName}</CardDescription>
                </div>
              </div>
              <div className="text-lg font-semibold text-primary">
                ${medication.price.toFixed(2)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm">{medication.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Category: {medication.category}</Badge>
                <Badge variant="outline">Dosage: {medication.dosage}</Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-3">
            <Button variant="outline" size="sm">
              <Info className="h-4 w-4 mr-2" />
              Details
            </Button>
            <Button size="sm" disabled={!medication.inStock || medication.requiresPrescription}>
              <Plus className="h-4 w-4 mr-2" />
              {medication.requiresPrescription ? "Need Prescription" : "Add to Cart"}
            </Button>
          </CardFooter>
        </div>
      </Card>
    </motion.div>
  );
} 