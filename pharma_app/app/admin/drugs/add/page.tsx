import { Suspense } from "react";
import { Metadata } from "next";
import { PlusCircle, Pill, ArrowLeft } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { AddDrugForm } from "@/components/admin/add-drug-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Add New Drug - Pharmacy Admin",
  description: "Add a new drug to the pharmacy inventory",
};

function AddDrugSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-32" />
      </CardFooter>
    </Card>
  );
}

export default function AddDrugPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/drugs">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <PlusCircle className="h-6 w-6 text-primary" />
              Add New Drug
            </h2>
            <p className="text-muted-foreground">
              Add a new drug to the pharmacy inventory
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid gap-6">
        <Suspense fallback={<AddDrugSkeleton />}>
          <AddDrugForm />
        </Suspense>
      </div>
    </div>
  );
} 