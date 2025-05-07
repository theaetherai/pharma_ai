"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  ArrowUp,
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Filter,
  Package,
  PackageCheck,
  Pill,
  Plus,
  Search,
  ShoppingCart,
  TrendingUp,
} from "lucide-react"

// Mock sales data
const recentSales = [
  {
    id: "ORD-7652",
    customer: "Memorial Hospital",
    product: "Amoxicillin 500mg",
    quantity: 500,
    total: 595.0,
    status: "Delivered",
    date: "2025-03-28",
  },
  {
    id: "ORD-7651",
    customer: "City Medical Center",
    product: "Ibuprofen 400mg",
    quantity: 1000,
    total: 450.0,
    status: "Processing",
    date: "2025-03-27",
  },
  {
    id: "ORD-7650",
    customer: "Riverside Clinic",
    product: "Loratadine 10mg",
    quantity: 300,
    total: 267.0,
    status: "Delivered",
    date: "2025-03-26",
  },
  {
    id: "ORD-7649",
    customer: "Family Care Practice",
    product: "Acetaminophen 500mg",
    quantity: 800,
    total: 360.0,
    status: "Delivered",
    date: "2025-03-25",
  },
  {
    id: "ORD-7648",
    customer: "Memorial Hospital",
    product: "Cephalexin 500mg",
    quantity: 200,
    total: 570.0,
    status: "Delivered",
    date: "2025-03-24",
  },
  {
    id: "ORD-7647",
    customer: "Wellness Center",
    product: "Naproxen 220mg",
    quantity: 400,
    total: 440.0,
    status: "Cancelled",
    date: "2025-03-23",
  },
]

// Mock inventory data
const inventoryItems = [
  {
    id: "MED-001",
    name: "Amoxicillin",
    dosage: "500mg",
    stock: 2500,
    reorderLevel: 500,
    unitPrice: 1.19,
    category: "Antibiotic",
  },
  {
    id: "MED-002",
    name: "Ibuprofen",
    dosage: "400mg",
    stock: 4200,
    reorderLevel: 1000,
    unitPrice: 0.45,
    category: "Pain Relief",
  },
  {
    id: "MED-003",
    name: "Loratadine",
    dosage: "10mg",
    stock: 1800,
    reorderLevel: 500,
    unitPrice: 0.89,
    category: "Antihistamine",
  },
  {
    id: "MED-004",
    name: "Acetaminophen",
    dosage: "500mg",
    stock: 3600,
    reorderLevel: 800,
    unitPrice: 0.45,
    category: "Pain Relief",
  },
  {
    id: "MED-005",
    name: "Cephalexin",
    dosage: "500mg",
    stock: 1200,
    reorderLevel: 300,
    unitPrice: 2.85,
    category: "Antibiotic",
  },
  {
    id: "MED-006",
    name: "Naproxen",
    dosage: "220mg",
    stock: 2200,
    reorderLevel: 500,
    unitPrice: 1.1,
    category: "Pain Relief",
  },
  {
    id: "MED-007",
    name: "Azithromycin",
    dosage: "250mg",
    stock: 900,
    reorderLevel: 300,
    unitPrice: 3.25,
    category: "Antibiotic",
  },
  {
    id: "MED-008",
    name: "Cetirizine",
    dosage: "10mg",
    stock: 1500,
    reorderLevel: 400,
    unitPrice: 0.75,
    category: "Antihistamine",
  },
]

export default function VendorPage() {
  const [activeTab, setActiveTab] = useState("overview")

  // Calculate metrics
  const totalSales = recentSales.reduce((sum, sale) => sum + sale.total, 0)
  const totalOrders = recentSales.length
  const averageOrderValue = totalSales / totalOrders
  const lowStockItems = inventoryItems.filter((item) => item.stock <= item.reorderLevel).length

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-500" />
            <Link href="/" className="text-xl font-bold">
              HealthPrototype
            </Link>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="font-medium text-muted-foreground">
              Home
            </Link>
            <Link href="/patients" className="font-medium text-muted-foreground">
              Patients
            </Link>
            <Link href="/diagnosis" className="font-medium text-muted-foreground">
              Diagnosis
            </Link>
            <Link href="/prescriptions" className="font-medium text-muted-foreground">
              Prescriptions
            </Link>
            <Link href="/billing" className="font-medium text-muted-foreground">
              Billing
            </Link>
            <Link href="/vendor" className="font-medium">
              Vendor
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Vendor Sales Management</h1>
            <p className="text-muted-foreground">Manage your inventory, track sales, and analyze performance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="hidden md:flex">
              <Calendar className="mr-2 h-4 w-4" />
              March 2025
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium">Total Sales</p>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-2xl font-bold">${totalSales.toFixed(2)}</h3>
                    <div className="flex items-center text-sm text-emerald-500">
                      <ArrowUp className="h-4 w-4 mr-1" />
                      12.5%
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">+$320 from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium">Orders</p>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-2xl font-bold">{totalOrders}</h3>
                    <div className="flex items-center text-sm text-emerald-500">
                      <ArrowUp className="h-4 w-4 mr-1" />
                      8.2%
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">+2 from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium">Average Order Value</p>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</h3>
                    <div className="flex items-center text-sm text-emerald-500">
                      <ArrowUp className="h-4 w-4 mr-1" />
                      3.8%
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">+$15.40 from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium">Low Stock Items</p>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-2xl font-bold">{lowStockItems}</h3>
                    <div className="flex items-center text-sm text-red-500">
                      <ArrowUp className="h-4 w-4 mr-1" />2
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">+2 items need reordering</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                  <CardDescription>Your most recent orders and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentSales.slice(0, 5).map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">{sale.id}</TableCell>
                          <TableCell>{sale.customer}</TableCell>
                          <TableCell>{sale.product}</TableCell>
                          <TableCell>${sale.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                sale.status === "Delivered"
                                  ? "default"
                                  : sale.status === "Processing"
                                    ? "outline"
                                    : "destructive"
                              }
                            >
                              {sale.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" asChild className="ml-auto">
                    <Link href="#sales">View All Sales</Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Low Stock Items</CardTitle>
                  <CardDescription>Items that need to be reordered soon</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Reorder Level</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryItems
                        .filter((item) => item.stock <= item.reorderLevel)
                        .map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.name} {item.dosage}
                              <div className="text-xs text-muted-foreground">{item.category}</div>
                            </TableCell>
                            <TableCell className={item.stock < item.reorderLevel / 2 ? "text-red-500 font-medium" : ""}>
                              {item.stock} units
                            </TableCell>
                            <TableCell>{item.reorderLevel} units</TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">
                                Reorder
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" asChild className="ml-auto">
                    <Link href="#inventory">View All Inventory</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <CardTitle>Sales History</CardTitle>
                    <CardDescription>View and manage all your sales transactions</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="search" placeholder="Search orders..." className="pl-8 w-[200px]" />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.id}</TableCell>
                        <TableCell>{sale.customer}</TableCell>
                        <TableCell>{sale.product}</TableCell>
                        <TableCell>{sale.quantity}</TableCell>
                        <TableCell>${sale.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              sale.status === "Delivered"
                                ? "default"
                                : sale.status === "Processing"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {sale.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing <strong>1-{recentSales.length}</strong> of <strong>{recentSales.length}</strong> orders
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <CardTitle>Inventory Management</CardTitle>
                    <CardDescription>Track and manage your product inventory</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="search" placeholder="Search products..." className="pl-8 w-[200px]" />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Product
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Reorder Level</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>
                          {item.name} {item.dosage}
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className={item.stock <= item.reorderLevel ? "text-red-500 font-medium" : ""}>
                          {item.stock}
                        </TableCell>
                        <TableCell>{item.reorderLevel}</TableCell>
                        <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.stock > item.reorderLevel
                                ? "default"
                                : item.stock <= item.reorderLevel / 2
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {item.stock > item.reorderLevel
                              ? "In Stock"
                              : item.stock <= item.reorderLevel / 2
                                ? "Critical"
                                : "Low Stock"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                            {item.stock <= item.reorderLevel && <Button size="sm">Reorder</Button>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Sales Performance</CardTitle>
                  <CardDescription>Monthly sales performance for the past 6 months</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="flex flex-col items-center text-center">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Sales chart would be displayed here in a full implementation
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Products</CardTitle>
                  <CardDescription>Best selling products by revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-full">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Amoxicillin 500mg</span>
                          <span className="text-sm font-medium">$1,245.00</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: "85%" }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-full">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Ibuprofen 400mg</span>
                          <span className="text-sm font-medium">$980.00</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: "70%" }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-full">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Cephalexin 500mg</span>
                          <span className="text-sm font-medium">$870.00</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: "65%" }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-full">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Loratadine 10mg</span>
                          <span className="text-sm font-medium">$650.00</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: "50%" }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-full">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Acetaminophen 500mg</span>
                          <span className="text-sm font-medium">$520.00</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: "40%" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Distribution</CardTitle>
                  <CardDescription>Sales distribution by customer type</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] flex items-center justify-center">
                  <div className="flex flex-col items-center text-center">
                    <Pill className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Customer distribution chart would be displayed here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory Turnover</CardTitle>
                  <CardDescription>Product turnover rate by category</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] flex items-center justify-center">
                  <div className="flex flex-col items-center text-center">
                    <PackageCheck className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Inventory turnover chart would be displayed here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-muted py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Activity className="h-5 w-5 text-emerald-500" />
              <span className="font-semibold">HealthPrototype</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 HealthPrototype. Prototype demonstration only.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

