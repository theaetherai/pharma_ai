"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export function AddDrugButton() {
  return (
    <Link href="/admin/drugs/add">
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Add New Drug
      </Button>
    </Link>
  );
} 