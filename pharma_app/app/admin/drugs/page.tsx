import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill, AlertCircle, ServerCrash } from "lucide-react";
import { DrugsTable } from "@/components/admin/drugs-table";
import { Button } from "@/components/ui/button";
import { LowStockFilterButton } from "@/components/admin/low-stock-filter-button";
import { SearchForm } from "@/components/admin/search-form";
import { AddDrugButton } from "@/components/admin/add-drug-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Making the page dynamic to refresh data on each request
export const dynamic = "force-dynamic";

// Function to safely run database queries with error handling
async function safeDbQuery<T>(queryFn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    console.error("Database query error:", error);
    return fallback;
  }
}

export default async function AdminDrugsPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string; search?: string; lowStock?: string; };
}) {
  // Parse pagination parameters
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const limit = searchParams.limit ? parseInt(searchParams.limit) : 20;
  const search = searchParams.search || '';
  const lowStock = searchParams.lowStock === 'true';
  
  // Track database connectivity status
  let dbConnected = true;
  let errorMessage = "";
  
  // Build where clause for filters
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { dosage: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  if (lowStock) {
    where.stock_quantity = { lt: 10 };
  }
  
  // Get total count for pagination with error handling
  const totalDrugs = await safeDbQuery(
    () => db.drug.count({ where }),
    0
  ).catch(error => {
    dbConnected = false;
    errorMessage = error.message || "Cannot connect to database";
    console.error("Error counting drugs:", error);
    return 0;
  });
  
  // Get drugs with pagination with error handling
  const drugs = await safeDbQuery(
    () => db.drug.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    []
  ).catch(error => {
    dbConnected = false;
    errorMessage = error.message || "Cannot connect to database";
    console.error("Error fetching drugs:", error);
    return [];
  });
  
  // Get drug statistics with error handling
  let totalDrugsCount = 0;
  let lowStockDrugsCount = 0;
  let outOfStockDrugsCount = 0;
  
  try {
    const results = await Promise.allSettled([
      db.drug.count(),
      db.drug.count({ where: { stock_quantity: { lt: 10, gt: 0 } }}),
      db.drug.count({ where: { stock_quantity: 0 }})
    ]);
    
    totalDrugsCount = results[0].status === 'fulfilled' ? results[0].value : 0;
    lowStockDrugsCount = results[1].status === 'fulfilled' ? results[1].value : 0;
    outOfStockDrugsCount = results[2].status === 'fulfilled' ? results[2].value : 0;
    
    // If all queries failed, mark as disconnected
    if (results.every(result => result.status === 'rejected')) {
      dbConnected = false;
      errorMessage = (results[0].status === 'rejected' && results[0].reason?.message) || 
                    "Cannot connect to database";
    }
  } catch (error: any) {
    dbConnected = false;
    errorMessage = error.message || "Cannot connect to database";
    console.error("Error fetching drug statistics:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manage Drugs</h2>
          <p className="text-muted-foreground">
            View and manage pharmacy inventory
          </p>
        </div>
        <AddDrugButton />
      </div>
      
      {!dbConnected && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Database Connection Error</AlertTitle>
          <AlertDescription>
            Cannot connect to the database. {errorMessage}
            <div className="mt-2">
              <p className="text-sm">Possible solutions:</p>
              <ul className="text-sm list-disc pl-5 mt-1">
                <li>Check if your database server is running</li>
                <li>Verify network connectivity</li>
                <li>Ensure database credentials are correct</li>
                <li>The Neon database may be in sleep mode if using the free tier</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drugs</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dbConnected ? totalDrugsCount : (
                <span className="text-muted-foreground flex items-center">
                  <ServerCrash className="h-4 w-4 mr-2" /> Unavailable
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dbConnected ? lowStockDrugsCount : (
                <span className="text-muted-foreground flex items-center">
                  <ServerCrash className="h-4 w-4 mr-2" /> Unavailable
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dbConnected ? outOfStockDrugsCount : (
                <span className="text-muted-foreground flex items-center">
                  <ServerCrash className="h-4 w-4 mr-2" /> Unavailable
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex gap-4 mb-6">
        <SearchForm defaultValue={search} />
        <LowStockFilterButton lowStock={lowStock} />
      </div>

      {dbConnected ? (
        <DrugsTable 
          drugs={drugs}
          pagination={{
            totalRecords: totalDrugs,
            currentPage: page,
            pageSize: limit,
            totalPages: Math.ceil(totalDrugs / limit)
          }}
        />
      ) : (
        <div className="bg-muted/20 rounded-md p-10 text-center">
          <ServerCrash className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Database Connection Error</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            Cannot load drug data because the database is currently unavailable. Please try again later.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry Connection
          </Button>
        </div>
      )}
    </div>
  );
} 