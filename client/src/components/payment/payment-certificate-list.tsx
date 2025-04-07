import { useState } from "react";
import { PaymentCertificate } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Search, Download, Loader2 } from "lucide-react";

type PaymentCertificateListProps = {
  projectId: number;
  certificates: PaymentCertificate[];
  isLoading: boolean;
};

export default function PaymentCertificateList({ projectId, certificates, isLoading }: PaymentCertificateListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Filter certificates based on search term and status filter
  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch = cert.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || cert.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });
  
  // Sort certificates by due date (most recent first)
  const sortedCertificates = [...filteredCertificates].sort(
    (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
  );
  
  const handleViewCertificate = (certificate: PaymentCertificate) => {
    // In a complete implementation, this would navigate to a details page
    // or show a modal with the certificate details
    alert(`Viewing details for ${certificate.reference}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" />
          <Input
            placeholder="Search by reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8"
          />
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="certified">Certified</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="w-full md:w-auto flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            <span>Export List</span>
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
          <span>Loading payment certificates...</span>
        </div>
      ) : sortedCertificates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || statusFilter !== "all" ? "No matching payment certificates found" : "No payment certificates found"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">REFERENCE</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">AMOUNT</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">DUE DATE</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">STATUS</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">SUBMITTED BY</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">SUBMITTED ON</th>
              </tr>
            </thead>
            <tbody>
              {sortedCertificates.map((certificate) => {
                const { bgColor, textColor } = getStatusColor(certificate.status);
                
                return (
                  <tr 
                    key={certificate.id} 
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewCertificate(certificate)}
                  >
                    <td className="py-3 text-sm font-medium px-2">{certificate.reference}</td>
                    <td className="py-3 text-sm font-medium px-2">{formatCurrency(certificate.amount)}</td>
                    <td className="py-3 text-sm px-2">{formatDate(certificate.dueDate, "dd MMM yyyy")}</td>
                    <td className="py-3 text-sm px-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${bgColor} ${textColor}`}>
                        {certificate.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm px-2">
                      {certificate.submittedBy ? "Jane Cooper" : "-"}
                    </td>
                    <td className="py-3 text-sm text-gray-500 px-2">
                      {certificate.submittedAt ? formatDate(certificate.submittedAt, "dd MMM yyyy") : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
