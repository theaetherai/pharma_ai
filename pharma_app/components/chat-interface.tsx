"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, AlertCircle, X, RefreshCw, Stethoscope, UserRound, ShoppingCart, FileText, ChevronDown, ChevronUp, Clock, Check, List, Lightbulb, CreditCard, ArrowLeft, Printer, Pill, FileCheck, Clipboard, Loader2, Heart, Ban } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePharmaChat } from "@/hooks/use-pharma-chat";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { PaystackButton } from "@/components/paystack-button";
import { useAuth } from "@clerk/nextjs";
import { Notifications } from "./notifications";
import { PDFPrescription } from "./pdf-prescription";
import { toast } from "sonner";
import "@/lib/resilience-init"; // Import for side effects only
import { metrics, logger } from "@/lib/monitoring";
import { isNetworkError } from "@/lib/api-helpers";
import type { ChatMessage } from "@/hooks/use-pharma-chat"; // Import from hooks not api

// New type for medication with purchase options
type MedicationWithPurchase = {
  id?: string;
  drugId?: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  price: number;
  prescription?: boolean;
  inStock?: boolean;
  prescriptionGenerated?: boolean;
  stock_quantity?: number;
  form?: string;
  match_quality?: 'exact' | 'partial' | 'name_only';
  notFound?: boolean;
};

// Type for error handling
type FetchError = Error & {
  code?: string;
  cause?: unknown;
};

export function ChatInterface() {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { 
    messages, 
    isLoading, 
    error, 
    diagnosis,
    readyForCheckout,
    sendMessage, 
    requestDiagnosis, 
    clearChat,
    isLoadingHistory,
    resetChat,
    setMessages,
  } = usePharmaChat();
  
  const [unavailableDrugs, setUnavailableDrugs] = useState<MedicationWithPurchase[]>([]);
  const [cart, setCart] = useState<MedicationWithPurchase[]>([]);
  const [medications, setMedications] = useState<MedicationWithPurchase[]>([]);
  const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [showMedicationPanel, setShowMedicationPanel] = useState(true);
  const [simpleMode, setSimpleMode] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [prescriptionItem, setPrescriptionItem] = useState<MedicationWithPurchase | null>(null);
  const [prescriptionStatus, setPrescriptionStatus] = useState<'idle' | 'generating' | 'ready'>('idle');
  
  // New state for prescription modal
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  
  const notificationsRef = useRef<{ addNotification: (message: string) => void } | null>(null);
  
  // New state for the latest order ID 
  const [latestOrderId, setLatestOrderId] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderPaymentComplete, setOrderPaymentComplete] = useState(false);
  const [orderIdempotencyKey, setOrderIdempotencyKey] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("customer@example.com");
  
  // Check for existing payment session on mount
  useEffect(() => {
    const storedOrderId = sessionStorage.getItem('pharmaai-order-id');
    const storedIdempotencyKey = sessionStorage.getItem('pharmaai-idempotency-key');
    const storedPaymentComplete = sessionStorage.getItem('pharmaai-payment-complete');
    
    if (storedOrderId) {
      setLatestOrderId(storedOrderId);
      setOrderPlaced(true);
    }
    
    if (storedIdempotencyKey) {
      setOrderIdempotencyKey(storedIdempotencyKey);
    }
    
    if (storedPaymentComplete === 'true') {
      setOrderPaymentComplete(true);
    }
  }, []);
  
  // Fetch user email on component mount
  useEffect(() => {
    // Try to get user email from local storage or session if available
    const storedEmail = localStorage.getItem('user-email');
    if (storedEmail) {
      setUserEmail(storedEmail);
    } else {
      // Try to fetch from Clerk's API
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
          if (data.email) {
            setUserEmail(data.email);
            localStorage.setItem('user-email', data.email);
          }
        })
        .catch(err => console.error('Error fetching user email:', err));
    }
  }, []);
  
  // Persist unavailable drugs in localStorage to preserve state on refresh
  useEffect(() => {
    // Store unavailable drugs in localStorage when they change
    if (unavailableDrugs.length > 0) {
      localStorage.setItem('pharmaai-unavailable-drugs', JSON.stringify(unavailableDrugs));
    } else {
      localStorage.removeItem('pharmaai-unavailable-drugs');
    }
  }, [unavailableDrugs]);
  
  // Recover unavailable drugs from localStorage on component mount
  useEffect(() => {
    const storedUnavailableDrugs = localStorage.getItem('pharmaai-unavailable-drugs');
    if (storedUnavailableDrugs) {
      try {
        const parsedDrugs = JSON.parse(storedUnavailableDrugs);
        if (Array.isArray(parsedDrugs) && parsedDrugs.length > 0) {
          setUnavailableDrugs(parsedDrugs);
          
          // Also ensure the medications are in the state
          if (medications.length === 0) {
            setMedications(parsedDrugs);
            setCart(parsedDrugs);
            setShowMedicationPanel(true);
          }
        }
      } catch (error) {
        console.error('Error parsing stored unavailable drugs:', error);
        localStorage.removeItem('pharmaai-unavailable-drugs');
      }
    }
  }, []);
  
  // Effect to scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);
  
  // Scroll to bottom when history finishes loading
  useEffect(() => {
    if (!isLoadingHistory && messages.length > 0) {
      scrollToBottom();
    }
  }, [isLoadingHistory, messages.length]);
  
  // Effect to scroll to bottom when diagnosis is ready
  useEffect(() => {
    if (diagnosis && readyForCheckout) {
      console.log("Diagnosis data received in chat interface:", diagnosis);
      console.log("Ready for checkout:", readyForCheckout);
      scrollToBottom();
    }
  }, [diagnosis, readyForCheckout]);
  
  // Auto-focus input box after AI messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        // Add a slight delay to ensure the DOM has updated
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    }
  }, [messages]);
  
  // Effect to handle automatic checkout when diagnosis is ready
  useEffect(() => {
    if (readyForCheckout && diagnosis) {
      // Show diagnosis panel automatically
      setShowMedicationPanel(true);
      
      // Add recommended medications to cart automatically
      const fetchMedications = async () => {
        try {
          console.log("Processing diagnosis prescriptions:", diagnosis.prescriptions);
          const medsData = await generateMedicationOptions(diagnosis.prescriptions || []);
          
          // Filter out unavailable drugs
          const unavailableMeds = medsData.filter(med => med.notFound === true);
          setUnavailableDrugs(unavailableMeds);
          
          if (medsData.length > 0) {
            // Set medications state
            setMedications(medsData);
            
            // Clear existing cart and add new medications
            setCart(medsData);
            
            // Open the prescription modal after a short delay for better UX
        setTimeout(() => {
              setPrescriptionModalOpen(true);
            }, 500);
          }
        } catch (error) {
          console.error('Error fetching medications:', error);
        }
      };
      
      fetchMedications();
    }
  }, [readyForCheckout, diagnosis]);
  
  // Focus input on load
  useEffect(() => {
    if (!isLoadingHistory) {
      inputRef.current?.focus();
    }
  }, [isLoadingHistory]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    const message = inputValue;
    setInputValue("");
    
    if (message.toLowerCase() === "diagnose") {
      // Request an on-demand diagnosis
      await requestDiagnosis(true);
    } else if (message.toLowerCase() === "clear") {
      clearChat();
    } else {
      await sendMessage(message);
    }
  };

  // Process purchase with checkout page
  const openCheckoutModal = () => {
    // Don't allow opening checkout if payment is already complete
    if (orderPaymentComplete) {
      toast.info("Your order has already been paid for. You can view order details instead.");
      viewOrderDetails();
      return;
    }
    
    // Filter out unavailable drugs from the cart
    const availableItems = cart.filter(item => !item.notFound);
    
    // If no available items, show error and offer to download prescription
    if (availableItems.length === 0) {
      toast.error("No medications are available for checkout. Please download your prescription instead.");
      // Offer to download prescription
      if (confirm("Would you like to download your prescription to take to another pharmacy?")) {
        downloadPrescription();
      }
      return;
    }
    
    // Generate idempotency key for this order if none exists
    if (!orderIdempotencyKey) {
      // Create a UUID-like string for idempotency
      const newKey = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setOrderIdempotencyKey(newKey);
      sessionStorage.setItem('pharmaai-idempotency-key', newKey);
    }
    
    // Update the cart with only available items and ensure each has a drugId
    const cartWithDrugIds = availableItems.map(item => ({
      ...item,
      drugId: item.id || `medication_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    }));
    
    // Update the cart with the filtered list and drugId field
    setCart(cartWithDrugIds);
    
    // If some items were filtered out, notify the user
    if (cartWithDrugIds.length < cart.length) {
      toast.warning(`${cart.length - cartWithDrugIds.length} unavailable medication(s) have been removed from your cart.`);
    }
    
    // Close prescription modal and open checkout
    setPrescriptionModalOpen(false);
    setCheckoutOpen(true);
  };

  // Complete checkout (just a simulation)
  const completeCheckout = () => {
    setPurchaseStatus('processing');
    setTimeout(() => {
      setPurchaseStatus('success');
      setTimeout(() => {
        setPurchaseStatus('idle');
        setCart([]);
        setCheckoutOpen(false);
        
        // Add a completion message
        sendMessage("checkout_complete");
      }, 2000);
    }, 1500);
  };

  // Download prescription with improved error handling
  const downloadPrescription = () => {
    try {
      // Track metrics for prescription download
      metrics.recordPrescription('downloaded');
      logger.info('prescription', 'Prescription downloaded');
      
      // Set prescription status to show the user something is happening
      setPrescriptionStatus('generating');
      
      setTimeout(() => {
        try {
          // Create text content for the prescription
          const createPrescriptionText = () => {
            // Format current date
            const currentDate = new Date().toLocaleDateString();
            
            let prescriptionText = 
`PRESCRIPTION
-----------
Date: ${currentDate}
Prescribed by: Dr. PharmaAI
Patient: ${cart.length > 0 ? 'Current Patient' : 'Anonymous Patient'}

MEDICATIONS:
`;

            // Add each medication to the prescription
            cart.forEach((med, index) => {
              prescriptionText += `
${index + 1}. ${med.name} ${med.dosage}
   Instructions: Take ${med.frequency}
   ${med.notFound ? '** NOT AVAILABLE IN OUR PHARMACY **' : ''}
`;
            });

            // Add footer
            prescriptionText += `
-----------
This is a digital prescription generated by PharmaAI.
Please take to your local pharmacy to fulfill this prescription.
`;

            return prescriptionText;
          };
          
          // Log prescription details for tracking
          console.log('Generating prescription for medications:', 
                    cart.map(med => med.name).join(', '));
          console.log('Unavailable medications:', 
                    unavailableDrugs.map(med => med.name).join(', '));

          // Create the prescription text
          const prescriptionText = createPrescriptionText();
          
          // Create a download link
          const element = document.createElement('a');
          const file = new Blob([prescriptionText], {type: 'text/plain'});
          element.href = URL.createObjectURL(file);
          element.download = `prescription-${Date.now()}.txt`;
          
          // Try to save the prescription in offline storage too
          try {
            import('@/lib/idb-storage').then(({ setCacheItem }) => {
              setCacheItem(`prescription-${Date.now()}`, prescriptionText, 86400); // Cache for 24 hours
            }).catch(err => console.error('Failed to cache prescription:', err));
          } catch (cacheError) {
            console.warn('Failed to cache prescription for offline use:', cacheError);
          }
          
          // Simulate click to download
          document.body.appendChild(element);
          element.click();
          
          // Clean up
          document.body.removeChild(element);
          setPrescriptionStatus('idle');
          
          // Show success notification
          toast.success('Prescription downloaded successfully');
          
          // Add a confirmation message to the chat
          sendMessage("prescription_downloaded");
        } catch (err) {
          console.error('Error generating prescription file:', err);
          setPrescriptionStatus('idle');
          toast.error('Failed to generate prescription file. Please try again.');
        }
      }, 1500);
    } catch (error) {
      console.error('Error in prescription download process:', error);
      setPrescriptionStatus('idle');
      toast.error('Failed to generate prescription. Please try again.');
    }
  };

  // New function to download both text and PDF formats
  const downloadPrescriptionOptions = () => {
    // Create a modal or popover with download options
    toast.message('Choose download format', {
      description: (
        <div className="flex flex-col gap-2 mt-2">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={downloadPrescription}
          >
            <FileText className="h-4 w-4 mr-2" />
            Download as Text (.txt)
          </Button>
          {diagnosis && (
            <PDFPrescription
              diagnosis={diagnosis?.diagnosis || "No diagnosis available"}
              prescriptions={diagnosis?.prescriptions || []}
              className="w-full justify-start"
            />
          )}
        </div>
      ),
      duration: 5000,
    });
  };

  // Generate a prescription
  const generatePrescription = (medication: MedicationWithPurchase) => {
    try {
      // Track metrics for prescription generation
      metrics.recordPrescription('generated');
      logger.info('prescription', 'Prescription generated', { medication: medication.name });
      
    setPrescriptionItem(medication);
    setPrescriptionStatus('generating');
    
      // Simulate prescription generation
    setTimeout(() => {
      setPrescriptionStatus('ready');
      }, 2000);
    } catch (error) {
      logger.error('prescription', 'Failed to generate prescription', { error, medication: medication.name });
      metrics.recordPrescription('failed');
      toast.error("Failed to generate prescription. Please try again.");
    }
  };

  // Process prescription completed
  const handlePrescriptionCompleted = (medication: MedicationWithPurchase) => {
    // Mark this medication's prescription as generated in the cart
    setCart(prevCart => 
      prevCart.map(item => 
          item.name === medication.name 
          ? { ...item, prescriptionGenerated: true } 
            : item
        )
      );
    
    // Also update it in the medications array
    setMedications(prevMeds => 
      prevMeds.map(item => 
        item.name === medication.name 
          ? { ...item, prescriptionGenerated: true } 
          : item
      )
    );
    
    // Reset the prescription dialog state
    setPrescriptionStatus('idle');
    setPrescriptionItem(null);
    
    // Close prescription modal and open checkout modal
    setPrescriptionModalOpen(false);
    setCheckoutOpen(true);
  };

  // Wrapper for the resetChat function to also clear our custom state
  const handleResetChat = () => {
    // Clear medication-related state
    setCart([]);
    setMedications([]);
    setUnavailableDrugs([]);
    setShowMedicationPanel(false);
    setPrescriptionStatus('idle');
    setPrescriptionItem(null);
    setCheckoutOpen(false);
    setPurchaseStatus('idle');
    setOrderPlaced(false);
    setLatestOrderId(null);
    setOrderPaymentComplete(false);
    setOrderIdempotencyKey(null);
    
    // Clear payment-related session storage
    sessionStorage.removeItem('pharmaai-order-id');
    sessionStorage.removeItem('pharmaai-idempotency-key');
    sessionStorage.removeItem('pharmaai-payment-complete');
    
    // Don't reset userEmail as it's needed for authentication
    
    // Clear local storage
    localStorage.removeItem('pharmaai-unavailable-drugs');
    
    // Call the original resetChat function
    resetChat();
  };

  // Add a medication to cart
  const addToCart = (medication: MedicationWithPurchase) => {
    // Don't add unavailable medications to cart
    if (medication.notFound) {
      toast.error(`${medication.name} is not available and cannot be added to cart.`);
      return;
    }
    
    // If it's a prescription medication and not yet in cart, show prescription generation
    if (medication.prescription && !cart.some(item => item.name === medication.name)) {
      generatePrescription(medication);
    } else {
      setCart((prev) => [...prev, medication]);
      toast.success(`${medication.name} added to cart.`);
    }
  };

  // Remove a medication from cart
  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Update generateMedicationOptions function to better handle errors and unavailable drugs
  const generateMedicationOptions = async (prescription: any[] = []): Promise<MedicationWithPurchase[]> => {
    if (!prescription || prescription.length === 0) return [];
    
    try {
      // Format prescription strings for the API request
      const prescriptionStrings = prescription.map(med => 
        `${med.drug_name || ''} ${med.dosage || ''}`
      );
      
      console.log('Matching prescriptions:', prescriptionStrings);
      
      // Call the drug-matching API with timeout and retry
      console.log('Sending match-drugs API request with:', JSON.stringify({ prescriptions: prescriptionStrings }));
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
      
      try {
        const response = await fetch('/api/match-drugs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prescriptions: prescriptionStrings }),
          credentials: 'include', // Include auth cookies
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error(`API error (${response.status}):`, await response.text());
          throw new Error(`API error: ${response.status}`);
        }
        
        // Get response as text first to debug any parsing issues
        const responseText = await response.text();
        console.log('Raw match-drugs API response:', responseText);
        
        // Parse the response
        const data = JSON.parse(responseText);
        
        if (!data.success || !data.matches) {
          console.error('Invalid response structure:', data);
          throw new Error('Invalid response from match-drugs API');
        }
        
        console.log('Drug matching results:', JSON.stringify(data.matches, null, 2));
        
        // Clear previous unavailable drugs
        setUnavailableDrugs([]);
        
        // Process the matches
        const medicationOptions = data.matches.map((item: any, index: number) => {
          const { prescription: prescriptionString, match } = item;
          const originalPrescription = prescription[index];
          
          console.log(`Processing match for "${prescriptionString}":`, match ? 'Found match' : 'No match found');
          
          // If we found a match in the drug database
          if (match) {
            const medicationOption = {
              id: match.id,
              name: match.name,
              genericName: originalPrescription.drug_name !== match.name ? originalPrescription.drug_name : undefined,
              dosage: match.dosage,
              frequency: originalPrescription.duration || 'as needed',
              price: match.price,
              stock_quantity: match.stock_quantity,
              form: originalPrescription.form || match.form,
              prescription: match.match_quality !== 'exact', // Require prescription if not exact match
              inStock: match.stock_quantity > 0,
              match_quality: match.match_quality,
              notFound: match.stock_quantity <= 0, // Mark as not found if out of stock
              prescriptionGenerated: true // Set to true for immediate checkout
            };
            
            console.log(`Created medication option for "${prescriptionString}":`, medicationOption);
            
            // Add to unavailable drugs if out of stock
            if (medicationOption.stock_quantity <= 0) {
              setUnavailableDrugs(prev => [...prev, medicationOption]);
            }
            
            return medicationOption;
          } else {
            // Fallback for no matches - explicitly mark as notFound
            const fallbackOption = {
              name: originalPrescription.drug_name || "Unknown medication",
              genericName: originalPrescription.drug_name?.includes('(') ? originalPrescription.drug_name.split('(')[1].replace(')', '') : undefined,
              dosage: originalPrescription.dosage || "as directed",
              frequency: originalPrescription.duration || "as needed",
              form: originalPrescription.form || "tablet",
              price: Math.round(Math.random() * 20 + 5), // Random price between $5-$25
              prescription: true, // Need prescription for non-matched items
              inStock: false, // Mark as out of stock
              notFound: true, // Explicitly mark as not found in database
              prescriptionGenerated: true // Set to true to enable checkout
            };
            
            console.log(`Created fallback option for "${prescriptionString}":`, fallbackOption);
            
            // Add to unavailable drugs list
            setUnavailableDrugs(prev => [...prev, fallbackOption]);
            
            return fallbackOption;
          }
        });
        
        console.log('Final medication options:', medicationOptions);
        
        // If all medications are unavailable, show a toast notification
        if (medicationOptions.every((med: MedicationWithPurchase) => med.notFound)) {
          toast.warning('None of the prescribed medications are available in our pharmacy. You can download the prescription to take to another pharmacy.');
        } else if (medicationOptions.some((med: MedicationWithPurchase) => med.notFound)) {
          toast.info('Some prescribed medications are not available. You can proceed with available medications or download the full prescription.');
        }
        
        return medicationOptions;
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);
        
        // Check if this was an abort error (timeout)
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('API request timed out:', fetchError);
          toast.error('Drug matching request timed out. Using fallback data.');
        } else {
          console.error('Error fetching from match-drugs API:', fetchError);
        }
        
        throw fetchError; // Re-throw to be caught by the outer catch
      }
    } catch (error) {
      console.error('Error matching drugs:', error);
      
      // Fallback to random data in case of error, make sure all are marked as notFound
      const fallbackOptions = prescription.map(med => {
        const fallbackOption = {
          name: med.drug_name || "Unknown medication",
          genericName: med.drug_name?.includes('(') ? med.drug_name.split('(')[1].replace(')', '') : undefined,
      dosage: med.dosage || "as directed",
          frequency: med.duration || "as needed",
          form: med.form || "tablet",
      price: Math.round(Math.random() * 20 + 5), // Random price between $5-$25
          prescription: true, // Always need prescription for error fallbacks
          inStock: false, // Mark as out of stock
          notFound: true, // Explicitly mark as not found
          prescriptionGenerated: true // Set to true to enable checkout
        };
        
        // Add to unavailable drugs list
        setUnavailableDrugs(prev => [...prev, fallbackOption]);
        
        return fallbackOption;
      });
      
      console.log('Using fallback medication options due to error:', fallbackOptions);
      
      // Show error toast
      toast.error('Could not match your prescriptions to our inventory. You can download the prescription to take to a pharmacy.');
      
      return fallbackOptions;
    }
  };

  // Remove disclaimer from message content
  const cleanMessageContent = (content: string) => {
    // Guard against null or undefined content
    if (!content) return '';
    
    // Pattern to match the disclaimer
    const disclaimerPattern = /DISCLAIMER: This is not medical advice\. For serious symptoms, please consult a medical professional immediately\./;
    
    // Remove the disclaimer
    let cleanedContent = content.replace(disclaimerPattern, '');
    
    // Also remove "I'm not a doctor" phrases
    cleanedContent = cleanedContent.replace(/I'm not a doctor,? but I can try to help you with some general information\.?/g, '');
    cleanedContent = cleanedContent.replace(/I am not a doctor,? but I can try to help you with some general information\.?/g, '');
    cleanedContent = cleanedContent.replace(/As an AI assistant, I cannot provide medical advice\.?/g, '');
    cleanedContent = cleanedContent.replace(/Please consult a healthcare professional for medical advice\.?/g, '');
    
    return cleanedContent;
  };

  // Process response to simplify and break up multiple questions
  const processAssistantResponse = (content: string): string => {
    if (!simpleMode) return content;
    
    // Special case for system messages
    if (content === "checkout_complete") {
      return "Thank you for your purchase! Your medications will be shipped to your address. You should receive them within 2-3 business days.";
    }
    
    // Special case for prescription download
    if (content === "prescription_downloaded") {
      return "Your prescription has been downloaded. You can take this prescription to your local pharmacy to fill your medications.";
    }
    
    // Remove lengthy explanations and keep it concise
    let processed = content
      .replace(/I'm Dr\. PharmaAI,? and I'm here to help.+?(?=\.)\./, "")
      .replace(/Thank you for sharing.+?(?=\.)\./, "")
      .replace(/I understand that.+?(?=\.)\./, "")
      .replace(/It sounds like.+?(?=\.)\./, "")
      .replace(/I appreciate.+?(?=\.)\./, "");
      
    // Keep only short paragraphs (reduces explanation length)
    if (processed.length > 300) {
      const paragraphs = processed.split('\n');
      processed = paragraphs.filter(p => p.length < 100 || p.includes('?')).join('\n');
    }
    
    return processed;
  };

  // Animations for messages
  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  // Updated UI for rendering messages with animations
  const renderMessages = () => {
    // Only display the most recent 15 messages
    const recentMessages = messages.slice(-15);
    const hasOlderMessages = messages.length > 15;
    
    return (
      <>
        {hasOlderMessages && (
          <div className="flex justify-center mb-6">
            <div className="bg-muted/50 text-muted-foreground rounded-full px-3 py-1 text-xs">
              Showing most recent {recentMessages.length} of {messages.length} messages
            </div>
          </div>
        )}
        
        {/* Messages are already in chronological order (oldest to newest) */}
        {recentMessages.map((message, index) => {
      const isUser = message.role === "user";
      const content = cleanMessageContent(message.content);
      const formattedContent = processAssistantResponse(content);
      
      return (
        <motion.div
          key={index}
          className={`flex items-start mb-4 ${isUser ? "justify-end" : "justify-start"}`}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={messageVariants}
          layout
        >
          <div className={`flex ${isUser ? "flex-row-reverse" : "flex-row"} max-w-[85%] gap-3`}>
            <div className="flex-shrink-0 mt-1">
              {isUser ? (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserRound size={16} className="text-primary" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Bot size={16} className="text-accent" />
                </div>
              )}
            </div>
            <div
              className={`rounded-2xl px-4 py-3 shadow-sm ${
                isUser
                  ? "bg-primary text-primary-foreground rounded-tr-none"
                  : "bg-card rounded-tl-none border border-border"
              }`}
            >
              <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMessageContent(formattedContent) }} />
            </div>
          </div>
        </motion.div>
      );
        })}
      </>
    );
  };
  
  // Enhanced formatting for message content
  const formatMessageContent = (content: string) => {
    // Bold important medical terms
    content = content.replace(
      /\b(diagnosis|prescription|dosage|medication|symptoms|treatment)\b/gi,
      '<span class="font-medium">$1</span>'
    );
    
    // Format lists with better styling
    content = content.replace(
      /• (.*?)(?=(?:• |\n|$))/g,
      '<div class="flex items-start mt-1 gap-2"><div class="rounded-full bg-primary/10 w-1.5 h-1.5 mt-2 flex-shrink-0"></div><div>$1</div></div>'
    );
    
    // Replace newlines with proper breaks
    return content.replace(/\n/g, '<br />');
  };

  // Enhanced empty state
  const renderEmptyState = () => (
    <motion.div 
      className="flex flex-col items-center justify-center h-[300px] md:h-[400px] text-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Stethoscope size={24} className="text-primary" />
      </div>
      <h3 className="text-lg font-medium mb-2">Your AI Health Assistant</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        Describe your symptoms in detail for the most accurate diagnosis and medication recommendations.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        <Button
          variant="outline"
          onClick={() => sendMessage("I have a persistent headache and slight fever for the past 2 days.")}
          className="text-left justify-start h-auto py-3 px-4"
        >
          <div className="flex items-start">
            <span className="bg-primary/10 text-primary p-1 rounded mr-3">
              <Lightbulb size={16} />
            </span>
            <span className="text-sm">I have a persistent headache and slight fever</span>
          </div>
        </Button>
        <Button
          variant="outline"
          onClick={() => sendMessage("I've been having stomach pain and nausea after meals.")}
          className="text-left justify-start h-auto py-3 px-4"
        >
          <div className="flex items-start">
            <span className="bg-primary/10 text-primary p-1 rounded mr-3">
              <Lightbulb size={16} />
            </span>
            <span className="text-sm">I've been having stomach pain and nausea after meals</span>
          </div>
        </Button>
      </div>
    </motion.div>
  );

  // Function to view order details
  const viewOrderDetails = () => {
    if (!latestOrderId) {
      toast.error("Order details not available");
      return;
    }
    
    // Show order details in a modal
    toast.info(`Viewing Order #${latestOrderId} details`);
    
    // Open the checkout modal with order details
    setCheckoutOpen(true);
  };

  // Render medication panel
  const renderMedicationPanel = () => {
    // Check if all medications are unavailable
    const allDrugsUnavailable = medications.length > 0 && medications.every(med => med.notFound);
    // Check if some medications are unavailable but not all
    const someDrugsUnavailable = unavailableDrugs.length > 0 && !allDrugsUnavailable;
    
    return (
      <motion.div
        className="flex flex-col h-full w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-2 sm:p-4 flex flex-col h-full space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Prescribed Medications</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowMedicationPanel(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Medication cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto mb-4">
            {medications.map((med, i) => (
              <Card key={i} className={med.notFound ? "border-destructive/50" : ""}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{med.name}</CardTitle>
                      {med.genericName && (
                        <p className="text-xs text-muted-foreground">{med.genericName}</p>
                      )}
                    </div>
                    {!med.notFound && (
                      <div className="text-right font-bold">
                        GH₵{med.price?.toFixed(2)}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 py-2 text-sm">
                  <p>Dosage: {med.dosage}</p>
                  <p>Duration: {med.frequency}</p>
                  {med.stock_quantity !== undefined && (
                    <p>Stock: {med.stock_quantity > 0 ? `${med.stock_quantity} available` : 'Out of stock'}</p>
                  )}
                  {med.notFound && (
                    <Badge variant="destructive" className="mt-2">
                      Not Available
                    </Badge>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-2">
                  {med.notFound ? (
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      <Ban className="h-3 w-3 mr-1" />
                      Out of Stock
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={() => addToCart(med)}
                      disabled={cart.some(item => item.name === med.name)}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      {cart.some(item => item.name === med.name) ? 'Added to Cart' : 'Add to Cart'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
        </div>
        
          {/* Buttons for checkout or download prescription */}
        {cart.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between p-4 bg-muted rounded-lg mb-4">
                <div>
                  <p className="font-medium">Cart Summary</p>
                  <p className="text-sm text-muted-foreground">{cart.length} items</p>
            </div>
                <div>
                  <p className="font-bold">
                    GH₵{cart.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)}
                  </p>
                  </div>
              </div>

              {/* Render different actions based on availability */}
              {allDrugsUnavailable ? (
                <div className="space-y-3">
                  <Button 
                    className="w-full" 
                    variant="secondary"
                    onClick={downloadPrescriptionOptions}
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    Download Prescription
                  </Button>
                  <p className="text-xs text-muted-foreground text-center px-4">
                    None of the medications are available in our system. Please download the prescription and visit your local pharmacy.
                  </p>
                </div>
              ) : (
                <div className="relative group">
                  <Button 
                    className="w-full" 
                    onClick={orderPlaced ? viewOrderDetails : openCheckoutModal}
                    disabled={cart.length === 0 || allDrugsUnavailable || cart.filter(item => !item.notFound).length === 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {orderPlaced ? 'View Order Details' : 'Proceed to Checkout'}
                  </Button>
                  
                  {someDrugsUnavailable && (
                    <div className="mt-2">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={downloadPrescriptionOptions}
                      >
                        <FileCheck className="h-4 w-4 mr-2" />
                        Download Full Prescription
                      </Button>
                      <p className="text-xs text-muted-foreground text-center px-4 mt-1">
                        {cart.filter(item => item.notFound).length > 0 
                          ? "Some unavailable medications are in your cart and will be removed during checkout." 
                          : "Some medications are unavailable but not in your cart."}
                      </p>
                    </div>
                  )}

                  {(cart.length === 0 || allDrugsUnavailable) && !orderPlaced && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                      No drugs available for checkout. Please download your prescription instead.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Render prescription modal
  const renderPrescriptionModal = () => {
    if (!medications || medications.length === 0) return null;
    
    // Check if all medications are unavailable
    const allDrugsUnavailable = medications.length > 0 && medications.every(med => med.notFound);
    // Check if some medications are unavailable but not all
    const someDrugsUnavailable = unavailableDrugs.length > 0 && !allDrugsUnavailable;
    
    return (
      <Dialog open={prescriptionModalOpen} onOpenChange={setPrescriptionModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="bg-primary/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <DialogTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Prescription Details
            </DialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => setPrescriptionModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              {allDrugsUnavailable 
                ? "None of the prescribed medications are available in our system"
                : someDrugsUnavailable
                  ? "Some prescribed medications are not available in our system"
                  : "Your prescribed medications are available for purchase"}
            </DialogDescription>
              </div>

          <div className="p-4 sm:p-6">
            <h3 className="text-sm font-medium mb-3">Prescribed Medications</h3>
            
            <div className="border rounded-md divide-y mb-6 max-h-[300px] overflow-y-auto">
              {medications.map((med, i) => (
                <div key={i} className="p-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">{med.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {med.dosage}, {med.frequency}
                  </div>
                    {med.notFound && (
                      <Badge variant="destructive" className="mt-1 text-xs">
                        Not available
                      </Badge>
                    )}
                    {med.match_quality && !med.notFound && (
                      <Badge variant={
                        med.match_quality === 'exact' ? 'default' : 
                        med.match_quality === 'partial' ? 'secondary' : 'outline'
                      } className="mt-1 text-xs">
                        {med.match_quality === 'exact' ? 'Exact Match' : 
                          med.match_quality === 'partial' ? 'Partial Match' : 'Name Match'}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    {!med.notFound && <div className="font-medium">GH₵{med.price?.toFixed(2)}</div>}
                </div>
                  </div>
              ))}
                </div>
                
            {/* Render different actions based on availability */}
            <div className="space-y-3">
              {!allDrugsUnavailable ? (
                <Button 
                  className="w-full" 
                  onClick={orderPlaced ? viewOrderDetails : openCheckoutModal}
                  disabled={cart.filter(item => !item.notFound).length === 0}
                >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                  </Button>
              ) : (
                <Button 
                  className="w-full" 
                  variant="secondary"
                  onClick={downloadPrescriptionOptions}
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Download Prescription
                  </Button>
              )}
              
              {someDrugsUnavailable && (
                <div className="space-y-1">
                <Button 
                  className="w-full" 
                  variant="outline"
                    onClick={downloadPrescriptionOptions}
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Download Full Prescription
                </Button>
                  <p className="text-xs text-muted-foreground text-center px-4">
                    {cart.filter(item => item.notFound).length > 0 
                      ? "Some unavailable medications are in your cart and will be removed during checkout." 
                      : "Some medications are unavailable but not in your cart."}
                  </p>
                </div>
              )}
              
              {!allDrugsUnavailable && !someDrugsUnavailable && (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={downloadPrescriptionOptions}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download Prescription
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => setPrescriptionModalOpen(false)}
              >
                Continue Consultation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Render checkout dialog
  const renderCheckoutDialog = () => {
    const { userId } = useAuth();
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [isAddressValid, setIsAddressValid] = useState(false);
    
    const totalAmount = cart.reduce((sum, item) => sum + (item.price || 0), 0) + 5;
    
    // Validate address
    useEffect(() => {
      setIsAddressValid(deliveryAddress.trim().length > 0);
    }, [deliveryAddress]);
    
    // Function to handle payment initialization
    const handleInitiatePayment = async () => {
      if (!isAddressValid) {
        toast.error('Please enter a valid delivery address');
        return;
      }
      
      // Address created successfully, continue with payment
      // The PaystackButton will handle the rest
    };
    
    // Function to save prescriptions to database
    const savePrescriptions = async () => {
      if (!diagnosis || !diagnosis.prescriptions || diagnosis.prescriptions.length === 0) {
        return;
      }
      
      try {
        const response = await fetch('/api/save-prescription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            prescriptions: diagnosis.prescriptions,
            deliveryAddress: deliveryAddress.trim()
          }),
        });
        
        const data = await response.json();
        
        if (!data.success) {
          console.error('Error saving prescriptions:', data.message);
        } else {
          console.log('Prescriptions saved successfully:', data.message);
        }
      } catch (error) {
        console.error('Error saving prescriptions:', error);
      }
    };

    // Update handlePaymentSuccess to handle offline payments
    const handlePaymentSuccess = async (paymentData: any) => {
      try {
        // Check if this was an offline payment that was queued
        if (paymentData.isOffline) {
          logger.info('payment', 'Offline payment queued', { reference: paymentData.reference });
          toast.success("Your payment will be processed when your connection is restored.");
          
          // Close checkout
          setCheckoutOpen(false);
          
          // Add message using sendMessage
          sendMessage("checkout_complete");
          
          return;
        }
        
        // For successfully processed payments, continue with normal flow
        logger.info('payment', 'Payment successful', { 
          orderId: paymentData.order?.id,
          paymentId: paymentData.payment?.id,
          idempotencyKey: orderIdempotencyKey
        });
        
        // Save the order ID for later use
        if (paymentData.order?.id) {
          setLatestOrderId(paymentData.order.id);
          // Store order ID in sessionStorage to prevent duplicate payments
          sessionStorage.setItem('pharmaai-order-id', paymentData.order.id);
        }
        
        // Update status
        setPurchaseStatus('success');
        setOrderPlaced(true);
        setOrderPaymentComplete(true);
        
        // Store payment completion in sessionStorage
        sessionStorage.setItem('pharmaai-payment-complete', 'true');
        
        // Close checkout
        setCheckoutOpen(false);
        
        // Save prescriptions for each cart item if it's a prescription drug
        await savePrescriptions();
        
        // Add message using sendMessage
        sendMessage("checkout_complete");
        
        // Show a notification to the current user only
        if (notificationsRef.current) {
          notificationsRef.current.addNotification(`Order #${paymentData.order?.id || 'pending'} has been successfully placed!`);
        }
        
      } catch (error) {
        logger.error('payment', 'Error handling payment success', { error });
        toast.error("There was an error processing your payment result. Please contact support.");
      }
    };
    
    // Add a function to handle viewing order details
    const viewOrderDetails = () => {
      if (!latestOrderId) {
        toast.error("Order details not available");
        return;
      }
      
      // Show order details in a modal
      toast.info(`Viewing Order #${latestOrderId} details`);
      
      // Open the checkout modal with order details
      setCheckoutOpen(true);
    };
    
    return (
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="bg-primary/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <DialogTitle className="text-lg flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
                {orderPlaced ? `Order #${latestOrderId} Details` : 'Checkout'}
              </DialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => setCheckoutOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              Complete your purchase of medications and prescriptions
            </DialogDescription>
          </div>

          <div className="p-4 sm:p-6">
            <h3 className="text-sm font-medium mb-3">Order Summary</h3>
            
            <div className="border rounded-md divide-y mb-6">
              {cart.map((item, i) => (
                <div key={i} className="p-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.dosage}, {item.frequency}
                    </div>
                    {item.prescription && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {item.prescriptionGenerated ? '✓ Prescription Ready' : 'Prescription Required'} 
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">GH₵{item.price?.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">GH₵{cart.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping:</span>
                <span className="font-medium">GH₵5.00</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t pt-2">
                <span>Total:</span>
                <span>GH₵{totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Delivery Address Field */}
            <div className="space-y-2 mb-6">
              <Label htmlFor="delivery-address">Delivery Address</Label>
              <Input
                id="delivery-address"
                placeholder="Enter your delivery address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full" 
              />
              {!isAddressValid && deliveryAddress.length > 0 && (
                <p className="text-xs text-destructive">Please enter a valid delivery address</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={downloadPrescriptionOptions}
              >
                <FileText className="h-4 w-4 mr-2" />
                Download Prescription
              </Button>
              <PaystackButton
                amount={totalAmount}
                email={userEmail}
                name={userEmail || undefined}
                className="flex-1"
                disabled={!isAddressValid || orderPaymentComplete}
                cart={cart.map(item => ({
                  drugId: item.id || item.drugId || `med_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                  quantity: 1,
                  price: item.price || 0,
                  name: item.name,
                  dosage: item.dosage,
                  form: item.form
                }))}
                deliveryAddress={deliveryAddress}
                idempotencyKey={orderIdempotencyKey}
                onSuccess={handlePaymentSuccess}
                onCancel={() => {
                  setCheckoutOpen(false);
                  toast.error('Payment cancelled');
                }}
                onCloseCheckout={() => setCheckoutOpen(false)}
              >
                <Button
                  className="w-full bg-primary text-white hover:bg-primary/90"
                  disabled={isLoading || orderPaymentComplete}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                    </div>
                  ) : orderPaymentComplete ? (
                    "Payment Complete"
                  ) : (
                    `Pay ${totalAmount.toFixed(2)}`
                )}
              </Button>
              </PaystackButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
  // Render diagnosis panel
  const renderDiagnosisPanel = () => {
    if (!diagnosis) {
      console.log("No diagnosis data available - diagnosis panel not rendered");
      return null;
    }
    
    console.log("Rendering diagnosis panel with data:", diagnosis);
    
    return (
      <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden w-full">
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center">
            <Stethoscope className="mr-2 h-5 w-5" />
            Diagnosis & Prescription
          </h3>
          <div>
            <Button variant="outline" size="sm" onClick={() => setShowMedicationPanel(!showMedicationPanel)} className="bg-transparent text-white border-white hover:bg-white/20">
              {showMedicationPanel ? "Hide" : "Show"}
            </Button>
          </div>
        </div>
        
        {showMedicationPanel && (
          <div className="p-3 sm:p-4">
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Diagnosis:</h4>
              <p className="text-gray-700">{diagnosis.diagnosis}</p>
          </div>
          
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Prescription:</h4>
              <div className="space-y-4">
                {diagnosis.prescriptions && diagnosis.prescriptions.map((med, index) => (
                  <Card key={index} className={unavailableDrugs.some(drug => drug.name === med.drug_name) ? "border border-destructive/50" : "border border-gray-200"}>
                    <CardHeader className="py-3 px-4 bg-gray-50">
                      <CardTitle className="text-base flex items-center justify-between">
                        <div className="flex items-center">
                        <Pill className="h-4 w-4 mr-2 text-blue-600" />
                        {med.drug_name}
                        </div>
                        {unavailableDrugs.some(drug => drug.name === med.drug_name) && (
                          <Badge variant="destructive" className="ml-2">
                            Not Available
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-3 px-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
                          <p className="text-gray-500 font-medium">Dosage:</p>
                          <p>{med.dosage}</p>
          </div>
          <div>
                          <p className="text-gray-500 font-medium">Form:</p>
                          <p>{med.form}</p>
          </div>
          <div>
                          <p className="text-gray-500 font-medium">Duration:</p>
                          <p>{med.duration}</p>
          </div>
                    <div>
                          <p className="text-gray-500 font-medium">Instructions:</p>
                          <p>{med.instructions}</p>
                      </div>
                    </div>
                    </CardContent>
                  </Card>
                ))}
                
                {(!diagnosis.prescriptions || diagnosis.prescriptions.length === 0) && (
                  <div className="p-3 rounded-lg bg-gray-50 text-sm">
                    No specific medications recommended at this time.
                    </div>
                )}
                  </div>
            </div>
            
            {diagnosis.follow_up_recommendations && diagnosis.follow_up_recommendations !== "None" && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Follow-up Recommendations:</h4>
                <p className="text-gray-700">{diagnosis.follow_up_recommendations}</p>
              </div>
            )}
            
            <div className="flex justify-center mt-6">
                    <Button 
                className="w-full max-w-xs"
                onClick={orderPlaced ? viewOrderDetails : () => openCheckoutModal()}
                disabled={purchaseStatus === 'processing' || cart.filter(item => !item.notFound).length === 0}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {orderPlaced ? 'View Order Details' : 'Proceed to Checkout'}
                    </Button>
                  </div>
                </div>
        )}
            </div>
    );
  };

  // Render loading history indicator
  const renderLoadingHistory = () => (
    <motion.div 
      className="flex flex-col items-center justify-center h-64 p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center space-x-2 text-primary mb-4">
        <div className="w-3 h-3 rounded-full bg-primary/80 animate-pulse-gentle" style={{ animationDelay: '0ms' }}></div>
        <div className="w-3 h-3 rounded-full bg-primary/80 animate-pulse-gentle" style={{ animationDelay: '300ms' }}></div>
        <div className="w-3 h-3 rounded-full bg-primary/80 animate-pulse-gentle" style={{ animationDelay: '600ms' }}></div>
      </div>
      <p className="text-sm text-muted-foreground">Loading your conversation history...</p>
    </motion.div>
  );

  // Render the diagnosis card
  const renderDiagnosisCard = () => {
    if (!diagnosis) return null;
    
    return (
      <Card className="mt-6 rounded-xl overflow-hidden">
        <CardHeader className="bg-primary-50 p-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-primary/10">
              <Stethoscope className="h-5 w-5 text-primary" />
              </div>
            <CardTitle className="text-lg font-semibold">Diagnosis Summary</CardTitle>
            </div>
          <Button variant="ghost" size="icon" onClick={() => clearChat()}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Assessment</h4>
              <p className="text-sm">{diagnosis.diagnosis}</p>
              </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-muted-foreground">Recommended Treatment</h4>
                <Badge variant="secondary" className="text-xs">
                  {diagnosis.prescriptions?.length || 0} {(diagnosis.prescriptions?.length || 0) === 1 ? 'medication' : 'medications'}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {diagnosis.prescriptions && diagnosis.prescriptions.map((prescription, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    className={`flex items-start gap-3 p-3 rounded-lg ${unavailableDrugs.some(drug => drug.name === prescription.drug_name) ? "bg-muted/50 border border-destructive/30" : "bg-muted/50"}`}
                  >
                    <div className="mt-0.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                        <Pill className="h-4 w-4 text-primary" />
                      </span>
                    </div>
                    <div className="space-y-1 flex-grow">
                      <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{prescription.drug_name}</p>
                        {unavailableDrugs.some(drug => drug.name === prescription.drug_name) && (
                          <Badge variant="destructive" className="text-xs">
                            Not Available
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{prescription.dosage}</p>
                      <p className="text-xs text-muted-foreground">{prescription.form}</p>
                      <p className="text-xs text-muted-foreground">{prescription.duration}</p>
                      <p className="text-xs text-muted-foreground">{prescription.instructions}</p>
                          </div>
                  </motion.div>
                      ))}
                
                {(!diagnosis.prescriptions || diagnosis.prescriptions.length === 0) && (
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    No specific medications recommended at this time.
                    </div>
                )}
                      </div>
                    </div>
            
            {diagnosis.follow_up_recommendations && diagnosis.follow_up_recommendations !== "None" && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Follow-up Recommendations</h4>
                <p className="text-sm">{diagnosis.follow_up_recommendations}</p>
            </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Helper function to scroll to bottom
  const scrollToBottom = () => {
    // Try both the container and the end ref to ensure scrolling works
    if (chatContainerRef.current) {
      // Use a small timeout to ensure content is rendered
      setTimeout(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
    }
     
    // Also try using the messagesEndRef
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Main component render
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">PharmaAI Assistant</h2>
        <Notifications ref={notificationsRef} />
            </div>
      
      {/* Render checkout dialog */}
      {renderCheckoutDialog()}
      
      {/* Chat Container */}
      {isLoadingHistory ? renderLoadingHistory() : (
        <div ref={chatContainerRef} className="flex-1 w-full overflow-hidden flex flex-col">
          <div className="dashboard-scroll-content w-full px-2 sm:px-4">
            <div className="space-y-8 w-full">
            {messages.length === 0 ? renderEmptyState() : renderMessages()}
            {diagnosis && renderDiagnosisPanel()}
                <div ref={messagesEndRef} />
            </div>
          </div>
              </div>
            )}
      
      {/* Input Area */}
      <div className="border-t bg-background w-full flex-shrink-0">
        <div className="w-full px-2 sm:px-4 py-4">
          <form onSubmit={handleSendMessage}>
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
            <Input
                  ref={inputRef}
              value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="Describe your symptoms... (e.g., I have a headache)"
              disabled={isLoading}
                  className="pr-10 w-full"
                />
                {isLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                <Send className="h-4 w-4" />
            </Button>
            </div>
            
            {error && (
              <div className="mt-2">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}
          </form>
        </div>
      </div>
      
      {/* Add a floating download button for prescriptions if they exist and diagnosis is complete */}
      {readyForCheckout && diagnosis && (
        <div className="fixed bottom-20 right-4 z-50">
          <Button 
            className="rounded-full shadow-lg p-3 h-auto"
            variant="default"
            onClick={downloadPrescriptionOptions}
          >
            <FileText className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
} 