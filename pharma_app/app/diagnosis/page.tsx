"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Activity, ArrowLeft, ArrowRight, Loader2 } from "lucide-react"

// Mock symptoms list
const commonSymptoms = [
  "Fever",
  "Headache",
  "Fatigue",
  "Cough",
  "Sore throat",
  "Shortness of breath",
  "Nausea",
  "Vomiting",
  "Diarrhea",
  "Muscle pain",
  "Joint pain",
  "Chest pain",
  "Abdominal pain",
]

const symptomConditionMap = {
  Fever: ["Upper Respiratory Infection", "Influenza", "COVID-19", "Strep Throat"],
  Headache: ["Migraine", "Tension Headache", "Sinusitis", "Upper Respiratory Infection"],
  Fatigue: ["Anemia", "Depression", "Chronic Fatigue Syndrome", "Influenza"],
  Cough: ["Upper Respiratory Infection", "Bronchitis", "Pneumonia", "COVID-19"],
  "Sore throat": ["Strep Throat", "Upper Respiratory Infection", "Tonsillitis", "Laryngitis"],
  "Shortness of breath": ["Asthma", "Pneumonia", "COVID-19", "Anxiety"],
  Nausea: ["Gastroenteritis", "Food Poisoning", "Migraine", "Pregnancy"],
  Vomiting: ["Gastroenteritis", "Food Poisoning", "Appendicitis", "Migraine"],
  Diarrhea: ["Gastroenteritis", "Food Poisoning", "Irritable Bowel Syndrome", "Crohn's Disease"],
  "Muscle pain": ["Influenza", "Fibromyalgia", "Rheumatoid Arthritis", "COVID-19"],
  "Joint pain": ["Osteoarthritis", "Rheumatoid Arthritis", "Gout", "Lupus"],
  "Chest pain": ["Angina", "Myocardial Infarction", "Gastroesophageal Reflux", "Anxiety"],
  "Abdominal pain": ["Appendicitis", "Gastritis", "Irritable Bowel Syndrome", "Gallstones"],
}

export default function DiagnosisPage() {
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [diagnosisResults, setDiagnosisResults] = useState<null | any>(null)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])

  const handleSymptomToggle = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom))
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom])
    }
  }

  const handleDiagnose = () => {
    if (selectedSymptoms.length === 0) {
      return
    }

    setIsProcessing(true)

    // Simulate AI processing delay with a more realistic variable time
    const processingTime = 1500 + Math.random() * 2000

    setTimeout(() => {
      // Generate diagnosis based on selected symptoms
      const conditionCounts = {}
      let totalWeight = 0

      // Count condition occurrences based on selected symptoms
      selectedSymptoms.forEach((symptom) => {
        const relatedConditions = symptomConditionMap[symptom] || []
        const weight = 1 / relatedConditions.length
        totalWeight += weight

        relatedConditions.forEach((condition, index) => {
          // Give higher weight to conditions that appear first in the list
          const positionWeight = (relatedConditions.length - index) / relatedConditions.length
          conditionCounts[condition] = (conditionCounts[condition] || 0) + weight * positionWeight
        })
      })

      // Sort conditions by count and calculate confidence
      const sortedConditions = Object.entries(conditionCounts)
        .map(([condition, count]) => ({
          condition,
          confidence: Math.min(Math.round((count / totalWeight) * 100), 95), // Cap at 95% for realism
        }))
        .sort((a, b) => b.confidence - a.confidence)

      // Get top conditions
      const primaryDiagnosis = sortedConditions[0]
      const differentialDiagnoses = sortedConditions.slice(1, 4)

      // Add descriptions for conditions
      const conditionDescriptions = {
        "Upper Respiratory Infection":
          "A viral infection affecting the upper respiratory tract, including the nose, throat, and sinuses.",
        Influenza:
          "A contagious respiratory illness caused by influenza viruses that infect the nose, throat, and lungs.",
        "COVID-19": "A respiratory illness caused by the SARS-CoV-2 virus, affecting the respiratory system.",
        Migraine:
          "A neurological condition characterized by intense, debilitating headaches, often accompanied by nausea and sensitivity to light and sound.",
        Sinusitis: "Inflammation or swelling of the tissue lining the sinuses, often caused by infection.",
        Bronchitis: "Inflammation of the lining of the bronchial tubes, which carry air to and from the lungs.",
        Pneumonia: "An infection that inflames the air sacs in one or both lungs, which may fill with fluid.",
        Gastroenteritis: "Inflammation of the lining of the intestines caused by a virus, bacteria, or parasites.",
        "Strep Throat": "A bacterial infection causing inflammation and pain in the throat.",
        "Tension Headache": "A common type of headache characterized by a dull, aching sensation all over the head.",
        "Seasonal Allergies": "An allergic response to seasonal environmental factors like pollen.",
      }

      // Generate recommended tests based on primary diagnosis
      const testRecommendations = {
        "Upper Respiratory Infection": [
          "Throat Culture",
          "Complete Blood Count (CBC)",
          "Chest X-ray (if symptoms persist)",
        ],
        Influenza: ["Rapid Influenza Diagnostic Test", "Complete Blood Count (CBC)", "Chest X-ray"],
        "COVID-19": ["COVID-19 PCR Test", "Complete Blood Count (CBC)", "Chest X-ray", "Pulse Oximetry"],
        Migraine: ["Neurological Examination", "MRI or CT Scan", "Blood Tests"],
        Sinusitis: ["Nasal Endoscopy", "CT Scan of Sinuses", "Allergy Testing"],
        Bronchitis: ["Chest X-ray", "Pulmonary Function Test", "Sputum Culture"],
        Pneumonia: ["Chest X-ray", "Blood Culture", "Sputum Culture", "Pulse Oximetry"],
        Gastroenteritis: ["Stool Culture", "Blood Tests", "Abdominal Imaging"],
        "Strep Throat": ["Rapid Strep Test", "Throat Culture", "Complete Blood Count (CBC)"],
        "Tension Headache": ["Neurological Examination", "CT Scan or MRI (if severe)"],
        "Seasonal Allergies": ["Allergy Skin Tests", "Blood Tests for Allergen-Specific IgE"],
      }

      // Create diagnosis results object
      const mockResults = {
        primaryDiagnosis: {
          condition: primaryDiagnosis.condition,
          confidence: primaryDiagnosis.confidence,
          description:
            conditionDescriptions[primaryDiagnosis.condition] ||
            "A medical condition requiring further evaluation by a healthcare professional.",
        },
        differentialDiagnoses: differentialDiagnoses.map((diagnosis) => ({
          condition: diagnosis.condition,
          confidence: diagnosis.confidence,
          description:
            conditionDescriptions[diagnosis.condition] ||
            "A medical condition requiring further evaluation by a healthcare professional.",
        })),
        recommendedTests: testRecommendations[primaryDiagnosis.condition] || [
          "Complete Blood Count (CBC)",
          "Comprehensive Metabolic Panel",
          "Further evaluation by a specialist",
        ],
      }

      setDiagnosisResults(mockResults)
      setIsProcessing(false)
      setStep(3)
    }, processingTime)
  }

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
            <Link href="/diagnosis" className="font-medium">
              Diagnosis
            </Link>
            <Link href="/prescriptions" className="font-medium text-muted-foreground">
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
          <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </div>

        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">AI-Powered Diagnosis</h1>

          <div className="mb-8">
            <div className="flex justify-between mb-2 text-sm">
              <span>Patient Information</span>
              <span>Symptoms</span>
              <span>Diagnosis Results</span>
            </div>
            <Progress value={step * 33.33} className="h-2" />
          </div>

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
                <CardDescription>Enter basic patient information to help with diagnosis accuracy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" placeholder="35" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <RadioGroup defaultValue="male" className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female">Female</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other">Other</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicalHistory">Brief Medical History</Label>
                  <Textarea
                    id="medicalHistory"
                    placeholder="Include any relevant medical conditions, allergies, or current medications"
                    rows={4}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href="/">Cancel</Link>
                </Button>
                <Button onClick={() => setStep(2)}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Symptoms Assessment</CardTitle>
                <CardDescription>Select all symptoms the patient is experiencing</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="common">
                  <TabsList className="mb-4">
                    <TabsTrigger value="common">Common Symptoms</TabsTrigger>
                    <TabsTrigger value="all">All Symptoms</TabsTrigger>
                    <TabsTrigger value="custom">Custom Entry</TabsTrigger>
                  </TabsList>

                  <TabsContent value="common" className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {commonSymptoms.map((symptom) => (
                        <div key={symptom} className="flex items-center space-x-2">
                          <Checkbox
                            id={symptom}
                            checked={selectedSymptoms.includes(symptom)}
                            onCheckedChange={() => handleSymptomToggle(symptom)}
                          />
                          <Label htmlFor={symptom}>{symptom}</Label>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="all">
                    <p className="text-muted-foreground">
                      A comprehensive list of symptoms would be available here in a full implementation.
                    </p>
                  </TabsContent>

                  <TabsContent value="custom">
                    <div className="space-y-2">
                      <Label htmlFor="customSymptoms">Describe Additional Symptoms</Label>
                      <Textarea
                        id="customSymptoms"
                        placeholder="Describe any symptoms not listed above in detail"
                        rows={4}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 space-y-2">
                  <Label htmlFor="symptomDuration">Symptom Duration</Label>
                  <RadioGroup defaultValue="days" className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hours" id="hours" />
                      <Label htmlFor="hours">Hours (less than a day)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="days" id="days" />
                      <Label htmlFor="days">Days (1-6 days)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="week" id="week" />
                      <Label htmlFor="week">About a week</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weeks" id="weeks" />
                      <Label htmlFor="weeks">Weeks (more than a week)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="month" id="month" />
                      <Label htmlFor="month">A month or longer</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={handleDiagnose}
                  disabled={selectedSymptoms.length === 0 || isProcessing}
                  className="relative"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Analyzing symptoms...</span>
                    </>
                  ) : (
                    <>
                      Diagnose <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === 2 && isProcessing && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center space-x-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div className="space-y-1">
                  <p className="font-medium">AI Diagnosis in Progress</p>
                  <p className="text-sm text-muted-foreground">
                    Analyzing {selectedSymptoms.length} symptoms and comparing with medical database...
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && diagnosisResults && (
            <Card>
              <CardHeader>
                <CardTitle>Diagnosis Results</CardTitle>
                <CardDescription>AI-generated diagnosis based on patient information and symptoms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Primary Diagnosis</h3>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-semibold">{diagnosisResults.primaryDiagnosis.condition}</h4>
                        <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-sm font-medium">
                          {diagnosisResults.primaryDiagnosis.confidence}% Confidence
                        </div>
                      </div>
                      <p className="text-muted-foreground">{diagnosisResults.primaryDiagnosis.description}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Differential Diagnoses</h3>
                  <div className="space-y-3">
                    {diagnosisResults.differentialDiagnoses.map((diagnosis: any, index: number) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-lg font-semibold">{diagnosis.condition}</h4>
                            <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium">
                              {diagnosis.confidence}% Confidence
                            </div>
                          </div>
                          <p className="text-muted-foreground">{diagnosis.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Recommended Tests</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {diagnosisResults.recommendedTests.map((test: string, index: number) => (
                      <li key={index}>{test}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-muted p-4 rounded-lg text-sm">
                  <p className="font-medium mb-1">Important Note:</p>
                  <p>
                    This is an AI-generated diagnosis for demonstration purposes only. Always consult with a qualified
                    healthcare professional for accurate diagnosis and treatment.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Symptoms
                </Button>
                <Button asChild>
                  <Link href="/prescriptions">
                    View Prescription Recommendations <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )}
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

