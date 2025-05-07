"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Activity, ArrowLeft, ArrowRight, FileText, Pill, AlertCircle } from "lucide-react"

// Mock prescription data
const mockPrescriptions = [
  {
    id: "RX-12345",
    medication: "Amoxicillin",
    dosage: "500mg",
    frequency: "Every 8 hours",
    duration: "7 days",
    instructions: "Take with food",
    cost: 24.99,
    category: "Antibiotic",
  },
  {
    id: "RX-12346",
    medication: "Ibuprofen",
    dosage: "400mg",
    frequency: "Every 6 hours as needed",
    duration: "5 days",
    instructions: "Take with food or milk",
    cost: 8.99,
    category: "Pain Relief",
  },
  {
    id: "RX-12347",
    medication: "Loratadine",
    dosage: "10mg",
    frequency: "Once daily",
    duration: "14 days",
    instructions: "Take on an empty stomach",
    cost: 12.5,
    category: "Antihistamine",
  },
]

// Mock alternative medications
const mockAlternatives = [
  {
    original: "Amoxicillin 500mg",
    alternatives: [
      { name: "Ampicillin 500mg", cost: 19.99, notes: "Similar efficacy, may cause more GI side effects" },
      { name: "Cephalexin 500mg", cost: 28.5, notes: "Broader spectrum, use if penicillin allergy" },
    ],
  },
  {
    original: "Ibuprofen 400mg",
    alternatives: [
      { name: "Naproxen 220mg", cost: 10.99, notes: "Longer duration of action, twice daily dosing" },
      { name: "Acetaminophen 500mg", cost: 7.5, notes: "Less GI irritation, less anti-inflammatory effect" },
    ],
  },
]

export default function PrescriptionsPage() {
  const [selectedTab, setSelectedTab] = useState("recommended")

  const totalCost = mockPrescriptions.reduce((sum, prescription) => sum + prescription.cost, 0)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-500" />
            <Link href="/" className="text-xl font-bold">
              HealthPrototype
            </Link>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="font-medium text-muted-foreground">
              Home
            </Link>
            <Link href="/patients" className="font-medium text-muted-foreground">
              Patients
            </Link>
            <Link href="/diagnosis" className="font-medium text-muted-foreground">
              Diagnosis
            </Link>
            <Link href="/prescriptions" className="font-medium">
              Prescriptions
            </Link>
            <Link href="/billing" className="font-medium text-muted-foreground">
              Billing
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/diagnosis"
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Diagnosis
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Prescription Recommendations</h1>

          <Tabs defaultValue="recommended" onValueChange={setSelectedTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="recommended">Recommended</TabsTrigger>
              <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
            </TabsList>

            <TabsContent value="recommended">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Pill className="mr-2 h-5 w-5 text-emerald-500" />
                    Recommended Medications
                  </CardTitle>
                  <CardDescription>Based on the diagnosis of Upper Respiratory Infection</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medication</TableHead>
                        <TableHead>Dosage</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockPrescriptions.map((prescription) => (
                        <TableRow key={prescription.id}>
                          <TableCell className="font-medium">
                            {prescription.medication}
                            <Badge variant="outline" className="ml-2">
                              {prescription.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{prescription.dosage}</TableCell>
                          <TableCell>{prescription.frequency}</TableCell>
                          <TableCell>{prescription.duration}</TableCell>
                          <TableCell>${prescription.cost.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-6 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Estimated Cost:</span>
                      <span className="font-bold text-lg">${totalCost.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Costs may vary based on pharmacy and insurance coverage
                    </p>
                  </div>

                  <div className="mt-6 space-y-4">
                    <h3 className="font-medium">Special Instructions</h3>
                    <ul className="space-y-2">
                      {mockPrescriptions.map((prescription) => (
                        <li key={prescription.id} className="flex items-start">
                          <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                          <span>
                            <strong>{prescription.medication}:</strong> {prescription.instructions}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" asChild>
                    <Link href="/diagnosis">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Diagnosis
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/billing">
                      Proceed to Billing <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="alternatives">
              <Card>
                <CardHeader>
                  <CardTitle>Alternative Medications</CardTitle>
                  <CardDescription>Potential alternatives to the recommended medications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {mockAlternatives.map((item, index) => (
                    <div key={index} className="space-y-3">
                      <h3 className="font-medium">Alternatives for {item.original}</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Alternative</TableHead>
                            <TableHead>Cost</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {item.alternatives.map((alt, altIndex) => (
                            <TableRow key={altIndex}>
                              <TableCell className="font-medium">{alt.name}</TableCell>
                              <TableCell>${alt.cost.toFixed(2)}</TableCell>
                              <TableCell>{alt.notes}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interactions">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
                    Potential Interactions
                  </CardTitle>
                  <CardDescription>Analysis of potential drug interactions and contraindications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg mb-6">
                    <h3 className="font-medium text-amber-800 mb-2">No significant interactions detected</h3>
                    <p className="text-amber-700">
                      The recommended medications do not have any significant interactions with each other. Always
                      inform your healthcare provider about all medications you are taking.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Medication Precautions</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span>
                          <strong>Amoxicillin:</strong> Avoid alcohol. May reduce effectiveness of oral contraceptives.
                        </span>
                      </li>
                      <li className="flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span>
                          <strong>Ibuprofen:</strong> Avoid taking with other NSAIDs. May interact with blood pressure
                          medications.
                        </span>
                      </li>
                      <li className="flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span>
                          <strong>Loratadine:</strong> May cause drowsiness. Avoid driving until you know how it affects
                          you.
                        </span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-8 bg-muted p-4 rounded-lg text-sm text-muted-foreground">
            <strong>Disclaimer:</strong> This is a prototype for demonstration purposes only. Do not use for actual
            medical prescriptions. Always consult with qualified healthcare professionals.
          </div>
        </div>
      </main>

      <footer className="bg-muted py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Activity className="h-5 w-5 text-emerald-500" />
              <span className="font-semibold">HealthPrototype</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 HealthPrototype. Prototype demonstration only.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

