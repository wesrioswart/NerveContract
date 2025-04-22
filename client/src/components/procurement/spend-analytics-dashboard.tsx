import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp, PieChart, BarChart3, DollarSign, Lightbulb } from "lucide-react";

// Mock data for demonstration purposes
const spendData = {
  weeklySpend: [
    { week: 'Week 1', amount: 12450 },
    { week: 'Week 2', amount: 15780 },
    { week: 'Week 3', amount: 9800 },
    { week: 'Week 4', amount: 22100 },
    { week: 'Week 5', amount: 10350 },
    { week: 'Week 6', amount: 16200 },
  ],
  monthlySpend: [
    { month: 'Jan', amount: 42300 },
    { month: 'Feb', amount: 36750 },
    { month: 'Mar', amount: 51200 },
    { month: 'Apr', amount: 38900 },
  ],
  categoryBreakdown: [
    { category: 'Materials', amount: 85600, percentage: 38 },
    { category: 'Plant Hire', amount: 62400, percentage: 28 },
    { category: 'Subcontractors', amount: 45800, percentage: 21 },
    { category: 'PPE & Safety', amount: 18200, percentage: 8 },
    { category: 'Other', amount: 11000, percentage: 5 },
  ],
  anomalies: [
    { 
      id: 1, 
      description: 'Unusually high spend on Plant Hire in Week 4',
      severity: 'high',
      amount: 15800
    },
    { 
      id: 2, 
      description: 'Duplicate invoice detected for Thurrock Engineering',
      severity: 'medium',
      amount: 3450
    },
    { 
      id: 3, 
      description: 'Price increase of 15% on concrete supplies',
      severity: 'low',
      amount: 1200
    },
  ],
  nominalInsights: [
    {
      code: '5399',
      description: 'OTHER SITE CONSUMABLES',
      spend: 18750,
      trend: 'up',
      insight: 'Spending is 23% higher than previous month'
    },
    {
      code: '5402',
      description: 'PLANT HIRE',
      spend: 42300,
      trend: 'down',
      insight: 'Consistent weekly pattern detected'
    },
    {
      code: '5100',
      description: 'CONCRETE',
      spend: 35600,
      trend: 'neutral',
      insight: 'Multiple suppliers used - consolidation opportunity'
    },
  ],
  aiForecasts: [
    {
      id: 1,
      description: 'Based on current trends, expect 15-20% increase in material costs next month',
      confidence: 85
    },
    {
      id: 2,
      description: 'Plant hire spending likely to decrease as project moves to next phase',
      confidence: 72
    },
    {
      id: 3,
      description: 'Potential savings of £12,500 identified through supplier consolidation',
      confidence: 90
    }
  ]
};

// Format currency
const formatCurrency = (value: number): string => {
  return `£${(value / 100).toFixed(2)}`;
};

interface SpendAnalyticsDashboardProps {
  className?: string;
}

const SpendAnalyticsDashboard: React.FC<SpendAnalyticsDashboardProps> = ({ className }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="col-span-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xl">Spend Analytics</CardTitle>
              <CardDescription>
                AI-powered procurement intelligence
              </CardDescription>
            </div>
            <Tabs defaultValue="weekly" className="w-[400px]">
              <TabsList>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="category">Category</TabsTrigger>
              </TabsList>
              <TabsContent value="weekly" className="h-[200px] mt-2">
                <div className="flex justify-between items-end h-full px-2">
                  {spendData.weeklySpend.map((week, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="bg-primary/80 w-8 hover:bg-primary transition-all duration-200" 
                        style={{ 
                          height: `${(week.amount / 25000) * 100}%`,
                          minHeight: "10px"
                        }}
                      ></div>
                      <span className="text-xs mt-2">{week.week}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(week.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="monthly" className="h-[200px] mt-2">
                <div className="flex justify-between items-end h-full px-2">
                  {spendData.monthlySpend.map((month, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="bg-secondary/80 w-16 hover:bg-secondary transition-all duration-200" 
                        style={{ 
                          height: `${(month.amount / 60000) * 100}%`,
                          minHeight: "10px"
                        }}
                      ></div>
                      <span className="text-xs mt-2">{month.month}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(month.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="category" className="h-[200px] mt-2">
                <div className="flex flex-col space-y-2">
                  {spendData.categoryBreakdown.map((category, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{category.category}</span>
                        <span className="text-sm font-medium">{formatCurrency(category.amount)}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div 
                          className="bg-primary h-2.5 rounded-full" 
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{category.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="pt-4">
              <Button 
                variant="outline" 
                className="text-xs"
                onClick={() => {
                  // Navigate to detailed breakdown view
                  window.location.href = '/procurement?tab=detailed-breakdown';
                }}
              >
                <PieChart className="h-3.5 w-3.5 mr-1.5" />
                View Detailed Breakdown
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Anomaly Detection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
              Anomaly Detection
            </CardTitle>
            <CardDescription>
              AI-detected unusual spending patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {spendData.anomalies.map((anomaly) => (
                <div key={anomaly.id} className="flex items-start justify-between border-b pb-3">
                  <div>
                    <div className="flex items-center">
                      <Badge variant={
                        anomaly.severity === 'high' ? 'destructive' : 
                        anomaly.severity === 'medium' ? 'secondary' : 'outline'
                      }>
                        {anomaly.severity}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm">
                      {anomaly.description}
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {formatCurrency(anomaly.amount)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Nominal Code Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <BarChart3 className="h-5 w-5 text-blue-500 mr-2" />
              Nominal Code Insights
            </CardTitle>
            <CardDescription>
              GPSMACS code spending analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {spendData.nominalInsights.map((insight, index) => (
                <div key={index} className="flex items-start justify-between border-b pb-3">
                  <div>
                    <div className="font-medium">
                      {insight.code} - {insight.description}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground flex items-center">
                      {insight.trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-red-500 mr-1" />}
                      {insight.trend === 'down' && <TrendingUp className="h-3.5 w-3.5 text-green-500 mr-1 rotate-180" />}
                      {insight.insight}
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {formatCurrency(insight.spend)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Forecasts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Lightbulb className="h-5 w-5 text-amber-500 mr-2" />
            AI Spend Forecasts
          </CardTitle>
          <CardDescription>
            Predictive insights based on procurement patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {spendData.aiForecasts.map((forecast) => (
              <div key={forecast.id} className="p-3 bg-muted/40 rounded-lg">
                <div className="flex justify-between">
                  <div className="text-sm">{forecast.description}</div>
                  <Badge variant="outline" className="ml-2">
                    {forecast.confidence}% confidence
                  </Badge>
                </div>
              </div>
            ))}

            <Button variant="outline" className="w-full mt-2">
              <DollarSign className="h-4 w-4 mr-2" />
              Generate Detailed Forecast Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpendAnalyticsDashboard;