'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

type Transaction = {
  id: string;
  amount: number;
  paymentMethod: string;
  transactionDate: string;
  status: string;
  user: {
    name: string | null;
    email: string;
  };
  order?: {
    items?: Array<{
      drug?: {
        name: string;
        dosage: string;
      };
      quantity?: number;
    }>;
  } | null;
};

interface RecentTransactionsProps {
  data: any[]; // Use any to avoid type conflicts with the API response
  title?: string;
  description?: string;
}

function RecentTransactionsComponent({
  data = [],
  title = "Recent Transactions",
  description = "Latest payment transactions",
}: RecentTransactionsProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Get payment method badge color
  const getPaymentMethodColor = (method: string) => {
    const methodLower = method.toLowerCase();
    if (methodLower.includes('card')) return 'bg-blue-100 text-blue-800';
    if (methodLower.includes('paypal')) return 'bg-indigo-100 text-indigo-800';
    if (methodLower.includes('bank')) return 'bg-green-100 text-green-800';
    if (methodLower.includes('cash')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left font-medium">Customer</th>
                <th className="p-2 text-left font-medium">Amount</th>
                <th className="p-2 text-left font-medium">Method</th>
                <th className="p-2 text-left font-medium">Time</th>
                <th className="p-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((transaction) => (
                  <tr key={transaction.id} className="border-b">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{transaction.user?.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{transaction.user?.email}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">{formatCurrency(transaction.amount)}</div>
                      {transaction.order && transaction.order.items && (
                        <div className="text-sm text-muted-foreground">
                          {transaction.order.items.length} items
                        </div>
                      )}
                    </td>
                    <td className="p-2">
                      <Badge variant="outline" className={getPaymentMethodColor(transaction.paymentMethod)}>
                        {transaction.paymentMethod}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="text-sm">{formatTimeAgo(transaction.transactionDate)}</div>
                    </td>
                    <td className="p-2">
                      <Badge 
                        variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                        className={transaction.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {transaction.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    No recent transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const RecentTransactions = memo(RecentTransactionsComponent);

// Also export as default for lazy loading compatibility
export default RecentTransactions; 