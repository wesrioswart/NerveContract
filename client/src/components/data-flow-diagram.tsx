import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Phone, 
  FileText, 
  Camera, 
  Clock, 
  Cloud, 
  Truck, 
  Users, 
  AlertTriangle,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Database
} from "lucide-react";

interface DataSource {
  id: string;
  name: string;
  type: 'email' | 'mobile' | 'weather' | 'supplier' | 'sensor' | 'manual';
  icon: React.ReactNode;
  description: string;
  examples: string[];
  frequency: string;
  dataTypes: string[];
}

interface DataFlowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  inputs: string[];
  outputs: string[];
}

export default function DataFlowDiagram() {
  const dataSources: DataSource[] = [
    {
      id: 'email',
      name: 'Email System',
      type: 'email',
      icon: <Mail className="h-4 w-4" />,
      description: 'Site managers, suppliers, and subcontractors send emails about delays, issues, and progress',
      examples: [
        'Site Manager: "Steel delivery delayed 2 days due to supplier issue"',
        'Subcontractor: "Concrete pour delayed - rain forecast"',
        'Supplier: "Equipment breakdown - excavator hire extended"'
      ],
      frequency: 'Real-time',
      dataTypes: ['Delays', 'Cost Changes', 'Resource Issues', 'Weather Impact']
    },
    {
      id: 'mobile',
      name: 'Mobile App',
      type: 'mobile',
      icon: <Phone className="h-4 w-4" />,
      description: 'Site staff use mobile app to report issues, scan equipment, and update progress',
      examples: [
        'Site Engineer: Scans equipment QR code to report breakdown',
        'Foreman: Reports completion of foundation work',
        'QA Inspector: Submits non-conformance report with photos'
      ],
      frequency: 'Real-time',
      dataTypes: ['Equipment Status', 'Progress Updates', 'Quality Issues', 'Photos']
    },
    {
      id: 'weather',
      name: 'Weather API',
      type: 'weather',
      icon: <Cloud className="h-4 w-4" />,
      description: 'Automatic weather monitoring affects concrete pours, outdoor work, and material deliveries',
      examples: [
        'Rain forecast: Concrete pour rescheduled',
        'High winds: Crane operations suspended',
        'Temperature drop: Curing time extended'
      ],
      frequency: 'Hourly',
      dataTypes: ['Weather Conditions', 'Forecasts', 'Work Restrictions', 'Material Impact']
    },
    {
      id: 'supplier',
      name: 'Supplier Systems',
      type: 'supplier',
      icon: <Truck className="h-4 w-4" />,
      description: 'Suppliers send automated updates about deliveries, delays, and cost changes',
      examples: [
        'Steel supplier: "Delivery delayed - logistics issue"',
        'Equipment hire: "Rate increase due to fuel costs"',
        'Concrete supplier: "Ready mix available earlier than planned"'
      ],
      frequency: 'Real-time',
      dataTypes: ['Delivery Status', 'Cost Updates', 'Availability', 'Quality Certificates']
    },
    {
      id: 'sensor',
      name: 'IoT Sensors',
      type: 'sensor',
      icon: <Camera className="h-4 w-4" />,
      description: 'Site sensors monitor conditions and equipment performance automatically',
      examples: [
        'Temperature sensor: Concrete curing conditions',
        'Equipment telemetry: Machine performance data',
        'Site cameras: Progress monitoring'
      ],
      frequency: 'Continuous',
      dataTypes: ['Environmental Data', 'Equipment Performance', 'Progress Photos', 'Safety Monitoring']
    },
    {
      id: 'manual',
      name: 'Manual Input',
      type: 'manual',
      icon: <Users className="h-4 w-4" />,
      description: 'Project staff enter compensation events, early warnings, and cost estimates manually',
      examples: [
        'Commercial Manager: Files compensation event with cost breakdown',
        'Project Manager: Creates early warning for potential delay',
        'Estimator: Updates cost estimates based on market changes'
      ],
      frequency: 'As needed',
      dataTypes: ['Compensation Events', 'Early Warnings', 'Cost Estimates', 'Risk Assessments']
    }
  ];

  const dataFlowSteps: DataFlowStep[] = [
    {
      id: 'intake',
      title: 'Data Intake',
      description: 'AI Email Agent processes all incoming data and classifies it automatically',
      icon: <Mail className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-800',
      inputs: ['Emails', 'Mobile Reports', 'Weather Data', 'Supplier Updates'],
      outputs: ['Classified Events', 'Extracted Data', 'Project Assignment']
    },
    {
      id: 'analysis',
      title: 'AI Analysis',
      description: 'Multi-model AI system analyzes impact, calculates costs, and determines urgency',
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'bg-yellow-100 text-yellow-800',
      inputs: ['Classified Events', 'Historical Data', 'Contract Terms'],
      outputs: ['Impact Assessment', 'Cost Calculation', 'Risk Level']
    },
    {
      id: 'validation',
      title: 'Cost Validation',
      description: 'Commercial Agent validates costs against contract rates and market data',
      icon: <DollarSign className="h-4 w-4" />,
      color: 'bg-green-100 text-green-800',
      inputs: ['Cost Calculations', 'Contract Rates', 'Market Data'],
      outputs: ['Validated Costs', 'Variance Analysis', 'Approval Requirements']
    },
    {
      id: 'approval',
      title: 'Human Approval',
      description: 'Position-based approval system routes decisions to appropriate authority level',
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'bg-purple-100 text-purple-800',
      inputs: ['Validated Costs', 'Impact Assessment', 'User Authority'],
      outputs: ['Approved Changes', 'Rejected Items', 'Escalation Requirements']
    },
    {
      id: 'execution',
      title: 'Programme Update',
      description: 'Approved changes automatically update MS Project schedules and budgets',
      icon: <Database className="h-4 w-4" />,
      color: 'bg-red-100 text-red-800',
      inputs: ['Approved Changes', 'Current Programme', 'Resource Allocation'],
      outputs: ['Updated Schedule', 'Cost Impact', 'Team Notifications']
    }
  ];

  const realExamples = [
    {
      scenario: 'Steel Delivery Delay',
      source: 'Email from supplier',
      content: '"Due to transport strike, steel delivery delayed 2 days. Impact: £8,500 additional costs"',
      processing: 'Email Agent classifies as compensation event, extracts cost and delay data',
      outcome: 'Auto-approved by Project Manager, programme updated, notifications sent'
    },
    {
      scenario: 'Weather Impact',
      source: 'Weather API + Site Manager email',
      content: 'Rain forecast detected, Site Manager confirms concrete pour postponed',
      processing: 'Operational Agent correlates weather data with programme activities',
      outcome: 'Schedule adjusted, resources reallocated, subcontractors notified'
    },
    {
      scenario: 'Equipment Breakdown',
      source: 'Mobile app report',
      content: 'Site Engineer scans QR code: "Excavator XYZ-123 hydraulic failure"',
      processing: 'Equipment Agent processes scan, checks hire agreements and replacement availability',
      outcome: 'Replacement equipment ordered, costs calculated, programme impact assessed'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            How the System Knows About Real-World Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sources" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sources">Data Sources</TabsTrigger>
              <TabsTrigger value="flow">Processing Flow</TabsTrigger>
              <TabsTrigger value="examples">Real Examples</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sources" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataSources.map((source) => (
                  <Card key={source.id} className="p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      {source.icon}
                      <h3 className="font-medium">{source.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {source.frequency}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{source.description}</p>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {source.dataTypes.map((type) => (
                          <Badge key={type} variant="secondary" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500">
                        <strong>Examples:</strong>
                        <ul className="mt-1 ml-2">
                          {source.examples.map((example, idx) => (
                            <li key={idx} className="mb-1">• {example}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="flow" className="space-y-4">
              <div className="space-y-4">
                {dataFlowSteps.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-4">
                    <div className={`p-2 rounded-full ${step.color}`}>
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{step.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>
                          <strong>Inputs:</strong>
                          <ul className="ml-2">
                            {step.inputs.map((input) => (
                              <li key={input}>• {input}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <strong>Outputs:</strong>
                          <ul className="ml-2">
                            {step.outputs.map((output) => (
                              <li key={output}>• {output}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    {index < dataFlowSteps.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-gray-400 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="examples" className="space-y-4">
              {realExamples.map((example, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{example.scenario}</h3>
                      <Badge variant="outline">{example.source}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-blue-50 p-2 rounded">
                        <strong>Original Data:</strong> {example.content}
                      </div>
                      <div className="bg-yellow-50 p-2 rounded">
                        <strong>AI Processing:</strong> {example.processing}
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <strong>Final Outcome:</strong> {example.outcome}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}