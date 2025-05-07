// Type definitions for PharmaAI application

// Chat related types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Prescription and medication related types
export interface Prescription {
  drug: string;
  dosage: string;
  duration: string;
}

export interface Medication {
  id: number;
  name: string;
  genericName: string;
  description: string;
  dosage: string;
  category: string;
  requiresPrescription: boolean;
  inStock: boolean;
  price: number;
}

// Diagnosis related types
export interface Diagnosis {
  diagnosis: string;
  prescription: Prescription[];
  recommendations?: string[];
  medications?: Medication[];
  severity?: 'mild' | 'moderate' | 'severe';
  followUp?: {
    recommended: boolean;
    timeframe: string;
    specialist?: string;
  };
}

// Health related types
export interface HealthMetrics {
  bloodPressure?: {
    systolic: number;
    diastolic: number;
    date: string;
  };
  heartRate?: number;
  bloodSugar?: number;
  cholesterol?: {
    total: number;
    ldl: number;
    hdl: number;
  };
  weight?: number;
  height?: number;
  bmi?: number;
}

export interface HealthProfile {
  metrics: HealthMetrics;
  allergies: string[];
  conditions: string[];
  currentMedications: string[];
  familyHistory: string[];
  healthScore: number;
}

// Doctor and appointment related types
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  experience: number;
  education: string[];
  availableSlots: {
    date: string;
    times: string[];
  }[];
  location: string;
  image: string;
  acceptingNewPatients: boolean;
}

export interface Appointment {
  id: string;
  doctor: Doctor;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  reason: string;
  notes?: string;
}

// Order related types
export interface Order {
  id: string;
  date: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    prescription?: boolean;
  }[];
  total: number;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  trackingNumber?: string;
}

// User related types
export interface UserSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    prescriptionReminders: boolean;
    appointmentReminders: boolean;
    refillReminders: boolean;
  };
  privacy: {
    shareDataWithDoctors: boolean;
    allowAnalytics: boolean;
    marketingEmails: boolean;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reduceAnimations: boolean;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  healthProfile?: HealthProfile;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  settings: UserSettings;
} 