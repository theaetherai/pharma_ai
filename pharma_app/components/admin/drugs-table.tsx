"use client";

import { useState } from "react";
import { Edit, Trash, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Drug {
  id: string;
  name: string;
  dosage: string;
  form: string;
  price: number;
  stock_quantity: number;
  description?: string;
  category?: string;
  prescription_required?: boolean;
}

interface PaginationInfo {
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

interface DrugsTableProps {
  drugs: Drug[];
  pagination: PaginationInfo;
}

export function DrugsTable({ drugs, pagination }: DrugsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [drugToDelete, setDrugToDelete] = useState<Drug | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('limit', newSize);
    params.set('page', '1'); // Reset to first page when changing page size
    router.push(`${pathname}?${params.toString()}`);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get stock status with color
  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (quantity < 10) {
      return <Badge variant="warning">Low Stock ({quantity})</Badge>;
    } else {
      return <span>{quantity} in stock</span>;
    }
  };

  // Open delete confirmation dialog
  const confirmDelete = (drug: Drug) => {
    setDrugToDelete(drug);
    setDeleteDialogOpen(true);
  };

  // Delete drug
  const deleteDrug = async () => {
    if (!drugToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/drugs/${drugToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete drug');
      }
      
      toast.success(`${drugToDelete.name} deleted successfully`);
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error deleting drug:', error);
      toast.error('Failed to delete drug. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDrugToDelete(null);
    }
  };

  return (
    <>
      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Name</TableHead>
              <TableHead>Dosage</TableHead>
              <TableHead>Form</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drugs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No drugs found
                </TableCell>
              </TableRow>
            ) : (
              drugs.map((drug) => (
                <TableRow key={drug.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium">{drug.name}</TableCell>
                  <TableCell>{drug.dosage}</TableCell>
                  <TableCell>{drug.form}</TableCell>
                  <TableCell className="text-right">{formatCurrency(drug.price)}</TableCell>
                  <TableCell>{getStockStatus(drug.stock_quantity)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/drugs/edit/${drug.id}`} passHref>
                        <Button variant="ghost" size="icon" className="hover:text-blue-600 hover:bg-blue-50">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:text-red-600 hover:bg-red-50"
                        onClick={() => confirmDelete(drug)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Showing {drugs.length} of {pagination.totalRecords} drugs
            </p>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-16 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              Page {pagination.currentPage} of {pagination.totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{drugToDelete?.name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteDrug}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 