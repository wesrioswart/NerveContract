import { useState, useMemo, useCallback } from "react";
import { ProgrammeMilestone } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, getStatusColor } from "@/lib/utils";

type ProgrammeTableProps = {
  milestones: ProgrammeMilestone[];
  isLoading: boolean;
};

export default function ProgrammeTable({ milestones, isLoading }: ProgrammeTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Optimized filtering with useMemo to prevent recalculation on every render
  const filteredAndSortedMilestones = useMemo(() => {
    if (!milestones) return [];
    
    // Filter milestones based on search term and status filter
    const filtered = milestones.filter((milestone) => {
      const matchesSearch = milestone.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || milestone.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
    
    // Sort milestones by planned date
    return [...filtered].sort(
      (a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime()
    );
  }, [milestones, searchTerm, statusFilter]);
  
  // Memoized event handlers to prevent unnecessary re-renders
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);
  
  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search milestones..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full"
          />
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <Select
            value={statusFilter}
            onValueChange={handleStatusFilterChange}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not started">Not Started</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="w-full md:w-auto">
            <span className="material-icons mr-2">calendar_today</span>
            Filter by Date
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <span className="material-icons animate-spin text-primary">refresh</span>
          <span className="ml-2">Loading programme milestones...</span>
        </div>
      ) : filteredAndSortedMilestones.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || statusFilter !== "all" ? "No matching milestones found" : "No milestones found"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">MILESTONE</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">PLANNED DATE</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">ACTUAL DATE</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">STATUS</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">DELAY (DAYS)</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">REASON</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedMilestones.map((milestone) => {
                const { bgColor, textColor } = getStatusColor(milestone.status);
                
                return (
                  <tr 
                    key={milestone.id} 
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="py-3 text-sm font-medium px-2">{milestone.name}</td>
                    <td className="py-3 text-sm px-2">{formatDate(milestone.plannedDate, "dd MMM yyyy")}</td>
                    <td className="py-3 text-sm px-2">
                      {milestone.actualDate ? formatDate(milestone.actualDate, "dd MMM yyyy") : "-"}
                    </td>
                    <td className="py-3 text-sm px-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${bgColor} ${textColor}`}>
                        {milestone.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm px-2">
                      {milestone.delayDays ? (
                        <span className="text-red-600 font-medium">{milestone.delayDays}</span>
                      ) : "-"}
                    </td>
                    <td className="py-3 text-sm px-2">{milestone.delayReason || "-"}</td>
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
