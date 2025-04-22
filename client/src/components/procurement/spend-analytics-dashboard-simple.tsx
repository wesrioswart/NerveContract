import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Calendar, PieChart, Lightbulb } from "lucide-react";

// Simple mockup data
const weeklyData = [
  { week: 'Week 1', amount: 12450 },
  { week: 'Week 2', amount: 15780 },
  { week: 'Week 3', amount: 9800 },
  { week: 'Week 4', amount: 22100 },
  { week: 'Week 5', amount: 10350 }
];

const monthlyData = [
  { month: 'Jan', amount: 92450 },
  { month: 'Feb', amount: 86700 },
  { month: 'Mar', amount: 105800 },
  { month: 'Apr', amount: 94300 },
  { month: 'May', amount: 97500 }
];

const categoryData = [
  { category: 'Materials', amount: 243500, percentage: 42.3 },
  { category: 'Equipment Rental', amount: 118700, percentage: 20.6 },
  { category: 'Subcontractors', amount: 87900, percentage: 15.3 },
  { category: 'Labour', amount: 63200, percentage: 11.0 }
];

interface SpendAnalyticsDashboardProps {
  className?: string;
}

function formatCurrency(amount: number): string {
  return `£${amount.toLocaleString()}`;
}

export default function SpendAnalyticsDashboard({ className }: SpendAnalyticsDashboardProps) {
  return (
    <div className={className}>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-primary" />
            Spend Analytics Dashboard
          </CardTitle>
          <CardDescription>
            AI-powered procurement spend analysis
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="weekly">
            <TabsList className="mb-4">
              <TabsTrigger value="weekly" className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Monthly
              </TabsTrigger>
              <TabsTrigger value="category" className="flex items-center gap-1.5">
                <PieChart className="h-4 w-4" />
                Category
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="weekly">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-4">Weekly Spend</h3>
                <div className="space-y-4">
                  {weeklyData.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <span>{item.week}</span>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="monthly">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-4">Monthly Spend</h3>
                <div className="space-y-4">
                  {monthlyData.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <span>{item.month}</span>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="category">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-4">Category Breakdown</h3>
                <div className="space-y-4">
                  {categoryData.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <span>{item.category}</span>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(item.amount)}</div>
                        <div className="text-sm text-muted-foreground">{item.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}