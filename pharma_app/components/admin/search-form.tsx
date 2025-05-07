"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FormEvent } from "react";

interface SearchFormProps {
  defaultValue: string;
}

export function SearchForm({ defaultValue }: SearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const searchValue = formData.get('search') as string;
    
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchValue) {
      params.set('search', searchValue);
    } else {
      params.delete('search');
    }
    
    // Reset to first page when searching
    params.set('page', '1');
    
    router.push(`${pathname}?${params.toString()}`);
  };
  
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <form onSubmit={handleSubmit}>
        <Input
          name="search"
          placeholder="Search drugs..."
          className="pl-10"
          defaultValue={defaultValue}
        />
      </form>
    </div>
  );
} 