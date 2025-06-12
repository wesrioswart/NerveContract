import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Bell, 
  Mail, 
  Clock, 
  Globe, 
  Database,
  Key,
  FileText,
  Save,
  RotateCcw
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  
  // User Profile Settings
  const [userSettings, setUserSettings] = useState({
    fullName: "Jane Cooper",
    email: "jane.cooper@company.com",
    role: "Project Manager",
    timezone: "Europe/London",
    language: "en-GB",
    phoneNumber: "+44 7123 456789"
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    rfiReminders: true,
    ceNotifications: true,
    earlyWarnings: true,
    paymentAlerts: false,
    systemUpdates: true,
    weeklyReports: true,
    contractDeadlines: true
  });

  // Contract Settings
  const [contractSettings, setContractSettings] = useState({
    defaultContractType: "NEC4 ECC",
    rfiResponsePeriod: "21",
    ceAssessmentPeriod: "21",
    defaultCurrency: "GBP",
    fiscalYearStart: "april",
    retentionPercentage: "5",
    insuranceRequirement: true
  });

  // Integration Settings
  const [integrationSettings, setIntegrationSettings] = useState({
    outlookSync: false,
    teamsIntegration: true,
    sharePointSync: false,
    projectServerSync: false,
    autoBackup: true,
    backupFrequency: "daily"
  });

  const handleSaveSettings = (section: string) => {
    toast({
      title: "Settings Updated",
      description: `${section} settings have been saved successfully.`,
    });
  };

  const handleResetSettings = (section: string) => {
    toast({
      title: "Settings Reset",
      description: `${section} settings have been reset to defaults.`,
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and platform configuration
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Profile
              </CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={userSettings.fullName}
                    onChange={(e) => setUserSettings({...userSettings, fullName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userSettings.email}
                    onChange={(e) => setUserSettings({...userSettings, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={userSettings.role} onValueChange={(value) => setUserSettings({...userSettings, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Project Manager">Project Manager</SelectItem>
                      <SelectItem value="Contract Administrator">Contract Administrator</SelectItem>
                      <SelectItem value="Quantity Surveyor">Quantity Surveyor</SelectItem>
                      <SelectItem value="Site Manager">Site Manager</SelectItem>
                      <SelectItem value="Engineer">Engineer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={userSettings.phoneNumber}
                    onChange={(e) => setUserSettings({...userSettings, phoneNumber: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={userSettings.timezone} onValueChange={(value) => setUserSettings({...userSettings, timezone: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="America/New_York">New York (EST)</SelectItem>
                      <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={userSettings.language} onValueChange={(value) => setUserSettings({...userSettings, language: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-GB">English (UK)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="fr-FR">Français</SelectItem>
                      <SelectItem value="de-DE">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleSaveSettings("Profile")}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
                <Button variant="outline" onClick={() => handleResetSettings("Profile")}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Email Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailAlerts" className="font-medium">Email Alerts</Label>
                      <p className="text-sm text-muted-foreground">Receive email notifications for urgent items</p>
                    </div>
                    <Switch
                      id="emailAlerts"
                      checked={notifications.emailAlerts}
                      onCheckedChange={(checked) => setNotifications({...notifications, emailAlerts: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="rfiReminders" className="font-medium">RFI Response Reminders</Label>
                      <p className="text-sm text-muted-foreground">Reminders for pending RFI responses</p>
                    </div>
                    <Switch
                      id="rfiReminders"
                      checked={notifications.rfiReminders}
                      onCheckedChange={(checked) => setNotifications({...notifications, rfiReminders: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="ceNotifications" className="font-medium">Compensation Event Alerts</Label>
                      <p className="text-sm text-muted-foreground">Notifications for CE status changes</p>
                    </div>
                    <Switch
                      id="ceNotifications"
                      checked={notifications.ceNotifications}
                      onCheckedChange={(checked) => setNotifications({...notifications, ceNotifications: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="earlyWarnings" className="font-medium">Early Warning Notices</Label>
                      <p className="text-sm text-muted-foreground">Immediate alerts for new early warnings</p>
                    </div>
                    <Switch
                      id="earlyWarnings"
                      checked={notifications.earlyWarnings}
                      onCheckedChange={(checked) => setNotifications({...notifications, earlyWarnings: checked})}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">System Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="contractDeadlines" className="font-medium">Contract Deadline Alerts</Label>
                      <p className="text-sm text-muted-foreground">Warnings for approaching deadlines</p>
                    </div>
                    <Switch
                      id="contractDeadlines"
                      checked={notifications.contractDeadlines}
                      onCheckedChange={(checked) => setNotifications({...notifications, contractDeadlines: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weeklyReports" className="font-medium">Weekly Summary Reports</Label>
                      <p className="text-sm text-muted-foreground">Weekly project progress summaries</p>
                    </div>
                    <Switch
                      id="weeklyReports"
                      checked={notifications.weeklyReports}
                      onCheckedChange={(checked) => setNotifications({...notifications, weeklyReports: checked})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleSaveSettings("Notifications")}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notifications
                </Button>
                <Button variant="outline" onClick={() => handleResetSettings("Notifications")}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contract Settings */}
        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contract Configuration
              </CardTitle>
              <CardDescription>
                Set default values and preferences for contract management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractType">Default Contract Type</Label>
                  <Select value={contractSettings.defaultContractType} onValueChange={(value) => setContractSettings({...contractSettings, defaultContractType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEC4 ECC">NEC4 Engineering and Construction Contract</SelectItem>
                      <SelectItem value="NEC4 PSC">NEC4 Professional Service Contract</SelectItem>
                      <SelectItem value="NEC4 TSC">NEC4 Term Service Contract</SelectItem>
                      <SelectItem value="NEC4 SC">NEC4 Supply Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select value={contractSettings.defaultCurrency} onValueChange={(value) => setContractSettings({...contractSettings, defaultCurrency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">British Pound (£)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="AED">UAE Dirham (AED)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rfiPeriod">RFI Response Period (days)</Label>
                  <Input
                    id="rfiPeriod"
                    value={contractSettings.rfiResponsePeriod}
                    onChange={(e) => setContractSettings({...contractSettings, rfiResponsePeriod: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cePeriod">CE Assessment Period (days)</Label>
                  <Input
                    id="cePeriod"
                    value={contractSettings.ceAssessmentPeriod}
                    onChange={(e) => setContractSettings({...contractSettings, ceAssessmentPeriod: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retention">Retention Percentage (%)</Label>
                  <Input
                    id="retention"
                    value={contractSettings.retentionPercentage}
                    onChange={(e) => setContractSettings({...contractSettings, retentionPercentage: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fiscalYear">Fiscal Year Start</Label>
                  <Select value={contractSettings.fiscalYearStart} onValueChange={(value) => setContractSettings({...contractSettings, fiscalYearStart: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="january">January</SelectItem>
                      <SelectItem value="april">April</SelectItem>
                      <SelectItem value="july">July</SelectItem>
                      <SelectItem value="october">October</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="insurance" className="font-medium">Insurance Requirement Checks</Label>
                    <p className="text-sm text-muted-foreground">Automatically verify insurance requirements</p>
                  </div>
                  <Switch
                    id="insurance"
                    checked={contractSettings.insuranceRequirement}
                    onCheckedChange={(checked) => setContractSettings({...contractSettings, insuranceRequirement: checked})}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleSaveSettings("Contract")}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Contract Settings
                </Button>
                <Button variant="outline" onClick={() => handleResetSettings("Contract")}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integration Settings */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Integrations
              </CardTitle>
              <CardDescription>
                Configure external system connections and data synchronization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Microsoft Integration</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="outlookSync" className="font-medium">Outlook Calendar Sync</Label>
                      <p className="text-sm text-muted-foreground">Sync contract milestones with Outlook calendar</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={integrationSettings.outlookSync ? "default" : "secondary"}>
                        {integrationSettings.outlookSync ? "Connected" : "Disconnected"}
                      </Badge>
                      <Switch
                        id="outlookSync"
                        checked={integrationSettings.outlookSync}
                        onCheckedChange={(checked) => setIntegrationSettings({...integrationSettings, outlookSync: checked})}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="teamsIntegration" className="font-medium">Microsoft Teams Integration</Label>
                      <p className="text-sm text-muted-foreground">Send notifications to Teams channels</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={integrationSettings.teamsIntegration ? "default" : "secondary"}>
                        {integrationSettings.teamsIntegration ? "Connected" : "Disconnected"}
                      </Badge>
                      <Switch
                        id="teamsIntegration"
                        checked={integrationSettings.teamsIntegration}
                        onCheckedChange={(checked) => setIntegrationSettings({...integrationSettings, teamsIntegration: checked})}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sharePointSync" className="font-medium">SharePoint Document Sync</Label>
                      <p className="text-sm text-muted-foreground">Synchronize documents with SharePoint</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={integrationSettings.sharePointSync ? "default" : "secondary"}>
                        {integrationSettings.sharePointSync ? "Connected" : "Disconnected"}
                      </Badge>
                      <Switch
                        id="sharePointSync"
                        checked={integrationSettings.sharePointSync}
                        onCheckedChange={(checked) => setIntegrationSettings({...integrationSettings, sharePointSync: checked})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Backup & Data Management</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoBackup" className="font-medium">Automatic Data Backup</Label>
                      <p className="text-sm text-muted-foreground">Regular automated backups of project data</p>
                    </div>
                    <Switch
                      id="autoBackup"
                      checked={integrationSettings.autoBackup}
                      onCheckedChange={(checked) => setIntegrationSettings({...integrationSettings, autoBackup: checked})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select 
                      value={integrationSettings.backupFrequency} 
                      onValueChange={(value) => setIntegrationSettings({...integrationSettings, backupFrequency: value})}
                      disabled={!integrationSettings.autoBackup}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleSaveSettings("Integration")}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Integration Settings
                </Button>
                <Button variant="outline" onClick={() => handleResetSettings("Integration")}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Privacy
              </CardTitle>
              <CardDescription>
                Manage your account security and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Password & Authentication</h4>
                <div className="space-y-4">
                  <Button variant="outline">
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Last password change: 2 weeks ago
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Session Management</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Auto-logout after inactivity</Label>
                      <p className="text-sm text-muted-foreground">Automatically sign out after 2 hours of inactivity</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Button variant="outline">
                    Sign out all devices
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Data Privacy</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Activity Logging</Label>
                      <p className="text-sm text-muted-foreground">Log user actions for audit purposes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Analytics Tracking</Label>
                      <p className="text-sm text-muted-foreground">Help improve the platform with usage analytics</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleSaveSettings("Security")}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
                <Button variant="outline" onClick={() => handleResetSettings("Security")}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}