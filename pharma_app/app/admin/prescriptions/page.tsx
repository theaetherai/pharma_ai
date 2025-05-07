import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, FileText } from "lucide-react";
import { PrescriptionStatus, Prescription } from "@prisma/client";
import { PrescriptionActions } from "@/components/admin/prescription-actions";

// Define the type for prescriptions including the joined user data
type PrescriptionWithUser = Prescription & {
  user: {
    name: string | null;
    email: string | null;
  } | null;
};

export default async function AdminPrescriptionsPage() {
  // Initialize prescriptions with empty array
  let prescriptions: PrescriptionWithUser[] = [];
  let error = null;

  try {
    // Fetch prescriptions data
    prescriptions = await db.prescription.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        prescribedAt: "desc",
      },
      take: 20
    });
  } catch (err) {
    console.error("Failed to fetch prescriptions:", err);
    error = err;
  }

  // Helper function to format status with color
  const getStatusColor = (status: PrescriptionStatus) => {
    switch (status) {
      case PrescriptionStatus.ACTIVE:
        return "text-green-500 bg-green-50 border border-green-200";
      case PrescriptionStatus.EXPIRED:
        return "text-red-500 bg-red-50 border border-red-200";
      case PrescriptionStatus.COMPLETED:
        return "text-blue-500 bg-blue-50 border border-blue-200";
      case PrescriptionStatus.CANCELLED:
        return "text-gray-500 bg-gray-50 border border-gray-200";
      default:
        return "text-gray-500 bg-gray-50 border border-gray-200";
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Prescriptions</h2>
        <p className="text-muted-foreground">
          Manage patient prescriptions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-4 border rounded-md bg-red-50 text-red-700">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} />
                <span className="font-medium">Unable to connect to database</span>
              </div>
              <p className="text-sm">
                We couldn't retrieve prescription data at this moment. Please try again later or contact support if the issue persists.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-4 text-left">Patient</th>
                    <th className="p-4 text-left">Medication</th>
                    <th className="p-4 text-left">Dosage</th>
                    <th className="p-4 text-left">Prescribed By</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Prescribed Date</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.length > 0 ? (
                    prescriptions.map((prescription) => (
                      <tr key={prescription.id} className="border-b">
                        <td className="p-4">{prescription.user?.name || "Unknown"}</td>
                        <td className="p-4">{prescription.medication}</td>
                        <td className="p-4">{prescription.dosage} {prescription.frequency}</td>
                        <td className="p-4">{prescription.doctorName}</td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(prescription.status)}`}>
                            {prescription.status}
                          </span>
                        </td>
                        <td className="p-4">{formatDate(prescription.prescribedAt)}</td>
                        <td className="p-4">
                          <PrescriptionActions prescriptionId={prescription.id} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-muted-foreground">
                        No prescriptions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 