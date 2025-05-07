'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, X, AlertCircle } from 'lucide-react';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { toast } from 'sonner';

// Define the form schema with Zod
const drugFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  dosage: z.string().min(1, { message: 'Dosage is required' }),
  form: z.string().min(1, { message: 'Form is required' }),
  price: z.coerce.number().positive({ message: 'Price must be positive' }),
  stock_quantity: z.coerce.number().nonnegative({ message: 'Stock quantity cannot be negative' }),
  category: z.string().optional(),
  description: z.string().optional(),
  prescription_required: z.boolean().default(false),
});

// Infer the type from the schema
type DrugFormValues = z.infer<typeof drugFormSchema>;

// Form categories
const drugCategories = [
  { value: 'analgesic', label: 'Analgesic' },
  { value: 'antibiotic', label: 'Antibiotic' },
  { value: 'antihistamine', label: 'Antihistamine' },
  { value: 'antiviral', label: 'Antiviral' },
  { value: 'cardiac', label: 'Cardiac' },
  { value: 'decongestant', label: 'Decongestant' },
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'gastro', label: 'Gastrointestinal' },
  { value: 'hormone', label: 'Hormone' },
  { value: 'hypertension', label: 'Hypertension' },
  { value: 'nsaid', label: 'NSAID' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'vitamin', label: 'Vitamin' },
  { value: 'other', label: 'Other' },
];

// Drug form options
const drugForms = [
  { value: 'tablet', label: 'Tablet' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'liquid', label: 'Liquid' },
  { value: 'injection', label: 'Injection' },
  { value: 'cream', label: 'Cream' },
  { value: 'ointment', label: 'Ointment' },
  { value: 'suppository', label: 'Suppository' },
  { value: 'powder', label: 'Powder' },
  { value: 'patch', label: 'Patch' },
  { value: 'inhaler', label: 'Inhaler' },
  { value: 'drops', label: 'Drops' },
  { value: 'spray', label: 'Spray' },
  { value: 'other', label: 'Other' },
];

interface EditDrugFormProps {
  drugId: string;
}

export function EditDrugForm({ drugId }: EditDrugFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize the form
  const form = useForm<DrugFormValues>({
    resolver: zodResolver(drugFormSchema),
    defaultValues: {
      name: '',
      dosage: '',
      form: 'tablet',
      price: 0,
      stock_quantity: 0,
      category: 'other',
      description: '',
      prescription_required: false,
    },
  });
  
  // Fetch drug data
  useEffect(() => {
    const fetchDrug = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/admin/drugs/${drugId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch drug data');
        }
        
        const data = await response.json();
        
        // Reset form with fetched data
        form.reset({
          name: data.name,
          dosage: data.dosage,
          form: data.form,
          price: data.price,
          stock_quantity: data.stock_quantity,
          category: data.category || 'other',
          description: data.description || '',
          prescription_required: data.prescription_required || false,
        });
      } catch (err: any) {
        console.error('Error fetching drug:', err);
        setError(err.message || 'Failed to load drug data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (drugId) {
      fetchDrug();
    }
  }, [drugId, form]);
  
  // Form submission handler
  const onSubmit = async (data: DrugFormValues) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/admin/drugs/${drugId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update drug');
      }
      
      const result = await response.json();
      
      // Show success message
      toast.success('Drug updated successfully!');
      
      // Navigate back to drugs list
      router.push('/admin/drugs');
      router.refresh();
    } catch (error: any) {
      console.error('Error updating drug:', error);
      toast.error(error.message || 'Failed to update drug. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Cancel handler
  const handleCancel = () => {
    router.back();
  };
  
  if (isLoading) {
    return (
      <Card className="w-full shadow-md overflow-hidden">
        <CardHeader className="bg-muted/50">
          <CardTitle>Edit Drug</CardTitle>
          <CardDescription>Loading drug data...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full shadow-md overflow-hidden">
        <CardHeader className="bg-muted/50">
          <CardTitle>Edit Drug</CardTitle>
          <CardDescription>There was an error loading the drug</CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full shadow-md overflow-hidden">
      <CardHeader className="bg-muted/50">
        <CardTitle>Edit Drug</CardTitle>
        <CardDescription>
          Update drug information in the pharmacy inventory
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Drug Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Drug Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter drug name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Dosage */}
              <FormField
                control={form.control}
                name="dosage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 500mg, 10mg/ml" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Form */}
              <FormField
                control={form.control}
                name="form"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select drug form" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {drugForms.map((form) => (
                          <SelectItem key={form.value} value={form.value}>
                            {form.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {drugCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormDescription>Price in dollars (USD)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Stock Quantity */}
              <FormField
                control={form.control}
                name="stock_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormDescription>Number of units in stock</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter drug description, indications, side effects, etc."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Prescription Required */}
            <FormField
              control={form.control}
              name="prescription_required"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Prescription Required
                    </FormLabel>
                    <FormDescription>
                      Toggle on if this drug requires a prescription
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-muted/50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
} 