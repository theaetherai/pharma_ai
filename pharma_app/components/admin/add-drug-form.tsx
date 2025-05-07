'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, X } from 'lucide-react';
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

export function AddDrugForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Default values for the form
  const defaultValues: Partial<DrugFormValues> = {
    name: '',
    dosage: '',
    form: 'tablet',
    price: 0,
    stock_quantity: 0,
    category: 'other',
    description: '',
    prescription_required: false,
  };
  
  // Initialize the form
  const form = useForm<DrugFormValues>({
    resolver: zodResolver(drugFormSchema),
    defaultValues,
  });
  
  // Form submission handler
  const onSubmit = async (data: DrugFormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log('Submitting drug data:', data);
      
      const response = await fetch('/api/admin/drugs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('API error response:', responseData);
        throw new Error(responseData.error || 'Failed to add drug');
      }
      
      // Show success message
      toast.success('Drug added successfully!');
      
      // Navigate back to drugs list
      router.push('/admin/drugs');
      router.refresh();
    } catch (error: any) {
      console.error('Error adding drug:', error);
      toast.error(error.message || 'Failed to add drug. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Cancel handler
  const handleCancel = () => {
    router.back();
  };
  
  return (
    <Card className="w-full shadow-md overflow-hidden">
      <CardHeader className="bg-muted/50">
        <CardTitle>Add New Drug</CardTitle>
        <CardDescription>
          Add a new drug to the pharmacy inventory
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
                  Save Drug
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
} 