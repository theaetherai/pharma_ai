"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, HelpCircle, LifeBuoy, MessageSquare, Phone } from "lucide-react";

export default function SupportPage() {
  const [messageSubmitted, setMessageSubmitted] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setTimeout(() => {
      setMessageSubmitted(true);
    }, 1000);
  };

  return (
    <div className="w-full h-full dashboard-scroll-content">
      <div className="dashboard-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Contact Support</h1>
            <p className="text-muted-foreground">
              Get help with your account, prescriptions, or medical questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Send us a message</CardTitle>
                  <CardDescription>
                    Our team will get back to you within 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {messageSubmitted ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8"
                    >
                      <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                        <Check className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-medium mb-2">Message Sent Successfully</h3>
                      <p className="text-muted-foreground mb-6">
                        Thank you for reaching out. We'll respond to your inquiry as soon as possible.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setMessageSubmitted(false)}
                      >
                        Send Another Message
                      </Button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" placeholder="John Doe" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" placeholder="john.doe@example.com" required />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="issue-type">Issue Type</Label>
                        <Select>
                          <SelectTrigger id="issue-type">
                            <SelectValue placeholder="Select an issue type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="account">Account Issue</SelectItem>
                            <SelectItem value="prescription">Prescription Question</SelectItem>
                            <SelectItem value="medical">Medical Question</SelectItem>
                            <SelectItem value="billing">Billing Issue</SelectItem>
                            <SelectItem value="technical">Technical Problem</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input id="subject" placeholder="Brief description of your issue" required />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          placeholder="Please provide details about your issue or question"
                          rows={6}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="attachments">Attachments (Optional)</Label>
                        <Input id="attachments" type="file" multiple />
                        <p className="text-xs text-muted-foreground">
                          Max file size: 10MB. Supported formats: JPG, PNG, PDF
                        </p>
                      </div>
                    </form>
                  )}
                </CardContent>
                {!messageSubmitted && (
                  <CardFooter className="border-t pt-4">
                    <Button type="submit" className="ml-auto" onClick={handleSubmit}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Options</CardTitle>
                  <CardDescription>
                    Other ways to get in touch with us
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-primary/10 p-2 rounded-md mr-3">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Phone Support</h3>
                      <p className="text-muted-foreground text-sm">Mon-Fri, 8am-8pm</p>
                      <a href="tel:+18001234567" className="text-primary hover:underline block mt-1">
                        +1 (800) 123-4567
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-primary/10 p-2 rounded-md mr-3">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Live Chat</h3>
                      <p className="text-muted-foreground text-sm">Available 24/7</p>
                      <Button variant="link" className="p-0 h-auto mt-1">
                        Start Chat
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-primary/10 p-2 rounded-md mr-3">
                      <LifeBuoy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Emergency Support</h3>
                      <p className="text-muted-foreground text-sm">24/7 for urgent medical issues</p>
                      <a href="tel:+18009119911" className="text-red-500 hover:underline block mt-1">
                        +1 (800) 911-9911
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>
                    Quick answers to common questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>How do I refill my prescription?</AccordionTrigger>
                      <AccordionContent>
                        You can refill your prescription by navigating to the Prescriptions page and clicking "Request Refill" next to any active prescription. Alternatively, you can contact your doctor directly or call our pharmacy support line.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>When will my medication order arrive?</AccordionTrigger>
                      <AccordionContent>
                        Standard delivery takes 2-3 business days. Express delivery is available for an additional fee and arrives within 24 hours. You can track your order in the Pharmacy section under "Order History."
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>How do I schedule an appointment?</AccordionTrigger>
                      <AccordionContent>
                        To schedule an appointment, go to the Appointments section and click "Schedule New Appointment." You can then select your doctor, preferred date and time, and reason for the visit.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                      <AccordionTrigger>Is my medical data secure?</AccordionTrigger>
                      <AccordionContent>
                        Yes, we take data security very seriously. All your medical data is encrypted and stored in compliance with HIPAA regulations. You can manage your privacy settings in the Profile section under "Security & Privacy."
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button variant="ghost" className="w-full">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    View All FAQs
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 