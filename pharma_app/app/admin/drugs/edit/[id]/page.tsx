'use client';

import { EditDrugForm } from '@/components/admin/edit-drug-form';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';

interface EditDrugPageProps {
  params: {
    id: string;
  };
}

export default function EditDrugPage({ params }: EditDrugPageProps) {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="/admin/drugs">Drugs</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>Edit Drug</BreadcrumbItem>
      </Breadcrumb>
      
      <PageHeader
        heading="Edit Drug" 
        subheading="Update drug information in the system"
      />
      
      <EditDrugForm drugId={params.id} />
    </div>
  );
}