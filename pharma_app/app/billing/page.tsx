"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Activity, ArrowLeft, Check, CreditCard, Loader2 } from "lucide-react"

// Mock prescription data with costs
const mockPrescriptions = [
  {
    id: "RX-12345",
    medication: "Amoxicillin",
    dosage: "500mg",
    quantity: 21,
    unitPrice: 1.19,
    totalPrice: 24.99,
  },
  {
    id: "RX-12346",
    medication: "Ibuprofen",
    dosage: "400mg",
    quantity: 20,
    unitPrice: 0.45,
    totalPrice: 8.99,
  },
  {
    id: "RX-12347",
    medication: "Loratadine",
    dosage: "10mg",
    quantity: 14,
    unitPrice: 0.89,
    totalPrice: 12.5,
  },
]

// Mock service fees
const mockServiceFees = [
  { description: "Consultation Fee", amount: 75.0 },
  { description: "Diagnostic Services", amount: 120.0 },
  { description: "Electronic Prescription Fee", amount: 5.0 },
]

export default function BillingPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const medicationTotal = mockPrescriptions.reduce((sum, item) => sum + item.totalPrice, 0)
  const serviceTotal = mockServiceFees.reduce((sum, item) => sum + item.amount, 0)
  const subtotal = medicationTotal + serviceTotal
  const tax = subtotal * 0.07
  const total = subtotal + tax

  const handlePayment = () => {
    setIsProcessing(true)

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      setIsComplete(true)
    }, 2000)
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
            <Link href="/diagnosis" className="font-medium text-muted-foreground">
              Diagnosis
            </Link>
            <Link href="/prescriptions" className="font-medium text-muted-foreground">
              Prescriptions
            </Link>
            <Link href="/billing" className="font-medium">
              Billing
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/prescriptions"
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Prescriptions
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Billing & Payment</h1>

          {!isComplete ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                    <CardDescription>Enter your payment details to complete the transaction</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Payment Method</Label>
                        <RadioGroup defaultValue="credit" className="grid grid-cols-3 gap-4 mt-2">
                          <div>
                            <RadioGroupItem value="credit" id="credit" className="peer sr-only" />
                            <Label
                              htmlFor="credit"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                              <CreditCard className="mb-3 h-6 w-6" />
                              Credit Card
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem value="insurance" id="insurance" className="peer sr-only" />
                            <Label
                              htmlFor="insurance"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                              <Activity className="mb-3 h-6 w-6" />
                              Insurance
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem value="other" id="other" className="peer sr-only" />
                            <Label
                              htmlFor="other"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                              <CreditCard className="mb-3 h-6 w-6" />
                              Other
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <Tabs defaultValue="credit">
                        <TabsContent value="credit" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                              <Label htmlFor="cardName">Name on Card</Label>
                              <Input id="cardName" placeholder="John Doe" />
                            </div>
                            <div className="col-span-2 space-y-2">
                              <Label htmlFor="cardNumber">Card Number</Label>
                              <Input id="cardNumber" placeholder="4111 1111 1111 1111" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="expiry">Expiration Date</Label>
                              <Input id="expiry" placeholder="MM/YY" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="cvv">CVV</Label>
                              <Input id="cvv" placeholder="123" />
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="insurance" className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="provider">Insurance Provider</Label>
                            <Select>
                              <SelectTrigger id="provider">
                                <SelectValue placeholder="Select provider" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="aetna">Aetna</SelectItem>
                                <SelectItem value="bluecross">Blue Cross Blue Shield</SelectItem>
                                <SelectItem value="cigna">Cigna</SelectItem>
                                <SelectItem value="humana">Humana</SelectItem>
                                <SelectItem value="united">UnitedHealthcare</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="policyNumber">Policy Number</Label>
                            <Input id="policyNumber" placeholder="Enter your policy number" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="groupNumber">Group Number</Label>
                            <Input id="groupNumber" placeholder="Enter your group number" />
                          </div>
                        </TabsContent>
                      </Tabs>

                      <div className="space-y-2">
                        <Label htmlFor="billingAddress">Billing Address</Label>
                        <Input id="billingAddress" placeholder="123 Main St" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input id="city" placeholder="New York" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Select>
                            <SelectTrigger id="state">
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ca">California</SelectItem>
                              <SelectItem value="ny">New York</SelectItem>
                              <SelectItem value="tx">Texas</SelectItem>
                              <SelectItem value="fl">Florida</SelectItem>
                              <SelectItem value="il">Illinois</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="zipCode">Zip Code</Label>
                          <Input id="zipCode" placeholder="10001" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Select defaultValue="us">
                            <SelectTrigger id="country">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="us">United States</SelectItem>
                              <SelectItem value="ca">Canada</SelectItem>
                              <SelectItem value="uk">United Kingdom</SelectItem>
                              <SelectItem value="au">Australia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Medications</h3>
                      <Table>
                        <TableBody>
                          {mockPrescriptions.map((prescription) => (
                            <TableRow key={prescription.id}>
                              <TableCell className="py-2">
                                {prescription.medication} {prescription.dosage}
                                <div className="text-xs text-muted-foreground">
                                  {prescription.quantity} units × ${prescription.unitPrice.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-2">${prescription.totalPrice.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Services</h3>
                      <Table>
                        <TableBody>
                          {mockServiceFees.map((fee, index) => (
                            <TableRow key={index}>
                              <TableCell className="py-2">{fee.description}</TableCell>
                              <TableCell className="text-right py-2">${fee.amount.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between py-1">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Tax (7%)</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1 font-bold">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={handlePayment} disabled={isProcessing}>
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>Pay ${total.toFixed(2)}</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center text-emerald-700">
                  <Check className="mr-2 h-6 w-6" />
                  Payment Complete
                </CardTitle>
                <CardDescription className="text-emerald-600">
                  Your payment has been processed successfully
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-emerald-200">
                  <h3 className="font-medium mb-2">Transaction Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Transaction ID:</div>
                    <div>TRX-{Math.floor(Math.random() * 1000000)}</div>
                    <div className="text-muted-foreground">Date:</div>
                    <div>{new Date().toLocaleDateString()}</div>
                    <div className="text-muted-foreground">Amount:</div>
                    <div className="font-medium">${total.toFixed(2)}</div>
                    <div className="text-muted-foreground">Payment Method:</div>
                    <div>Credit Card (ending in 1111)</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Next Steps</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-emerald-500" />
                      <span>Your prescriptions have been sent to your preferred pharmacy</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-emerald-500" />
                      <span>A receipt has been emailed to your registered email address</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-emerald-500" />
                      <span>Your medical records have been updated with today's diagnosis and prescriptions</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href="/">Return to Dashboard</Link>
                </Button>
                <Button asChild>
                  <Link href="#">Download Receipt</Link>
                </Button>
              </CardFooter>
            </Card>
          )}

          <div className="mt-8 bg-muted p-4 rounded-lg text-sm text-muted-foreground">
            <strong>Disclaimer:</strong> This is a prototype for demonstration purposes only. No actual payment
            processing occurs. Always consult with qualified healthcare professionals.
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

