import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Database, 
  Shield, 
  Bell, 
  Monitor, 
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SystemSettings() {
  const { toast } = useToast();
  
  const [systemConfig, setSystemConfig] = useState({
    maintenanceMode: false,
    autoBackup: true,
    sessionTimeout: "30",
    maxLoginAttempts: "5",
    passwordExpiry: "90",
    dataRetention: "365"
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    systemAlerts: true,
    appointmentReminders: true,
    emergencyAlerts: true,
    maintenanceNotifications: false
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    ipWhitelist: "",
    encryptionLevel: "256",
    auditLogging: true,
    passwordComplexity: "high"
  });

  const [backupSettings, setBackupSettings] = useState({
    autoBackupEnabled: true,
    backupFrequency: "daily",
    retentionPeriod: "30",
    lastBackup: "2025-09-15 23:30:00",
    backupLocation: "Internal Storage"
  });

  const handleSystemConfigSave = () => {
    toast({
      title: "Success",
      description: "System configuration updated successfully",
    });
  };

  const handleNotificationSave = () => {
    toast({
      title: "Success",
      description: "Notification settings updated successfully",
    });
  };

  const handleSecuritySave = () => {
    toast({
      title: "Success",
      description: "Security settings updated successfully",
    });
  };

  const handleBackupSave = () => {
    toast({
      title: "Success",
      description: "Backup settings updated successfully",
    });
  };

  const handleManualBackup = () => {
    toast({
      title: "Backup Started",
      description: "Manual backup has been initiated",
    });
  };

  const handleSystemRestart = () => {
    toast({
      title: "System Restart",
      description: "System restart has been scheduled",
      variant: "destructive"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">System Settings</h1>
          <p className="text-muted-foreground">Configure software settings and system preferences</p>
        </div>
      </div>

      {/* System Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Configuration
          </CardTitle>
          <CardDescription>General system settings and operational parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">Enable to restrict system access during maintenance</p>
            </div>
            <Switch
              checked={systemConfig.maintenanceMode}
              onCheckedChange={(checked) => setSystemConfig({...systemConfig, maintenanceMode: checked})}
              data-testid="switch-maintenance-mode"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Backup</Label>
              <p className="text-sm text-muted-foreground">Automatically backup system data</p>
            </div>
            <Switch
              checked={systemConfig.autoBackup}
              onCheckedChange={(checked) => setSystemConfig({...systemConfig, autoBackup: checked})}
              data-testid="switch-auto-backup"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={systemConfig.sessionTimeout}
                onChange={(e) => setSystemConfig({...systemConfig, sessionTimeout: e.target.value})}
                data-testid="input-session-timeout"
              />
            </div>
            <div>
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={systemConfig.maxLoginAttempts}
                onChange={(e) => setSystemConfig({...systemConfig, maxLoginAttempts: e.target.value})}
                data-testid="input-max-login-attempts"
              />
            </div>
            <div>
              <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
              <Input
                id="passwordExpiry"
                type="number"
                value={systemConfig.passwordExpiry}
                onChange={(e) => setSystemConfig({...systemConfig, passwordExpiry: e.target.value})}
                data-testid="input-password-expiry"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="dataRetention">Data Retention Period (days)</Label>
            <Input
              id="dataRetention"
              type="number"
              value={systemConfig.dataRetention}
              onChange={(e) => setSystemConfig({...systemConfig, dataRetention: e.target.value})}
              className="w-full md:w-48"
              data-testid="input-data-retention"
            />
          </div>

          <Button onClick={handleSystemConfigSave} data-testid="button-save-system-config">
            <Save className="h-4 w-4 mr-2" />
            Save System Configuration
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>Configure security protocols and access controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
            </div>
            <Switch
              checked={securitySettings.twoFactorAuth}
              onCheckedChange={(checked) => setSecuritySettings({...securitySettings, twoFactorAuth: checked})}
              data-testid="switch-two-factor"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Audit Logging</Label>
              <p className="text-sm text-muted-foreground">Log all system activities and changes</p>
            </div>
            <Switch
              checked={securitySettings.auditLogging}
              onCheckedChange={(checked) => setSecuritySettings({...securitySettings, auditLogging: checked})}
              data-testid="switch-audit-logging"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Password Complexity</Label>
              <Select 
                value={securitySettings.passwordComplexity} 
                onValueChange={(value) => setSecuritySettings({...securitySettings, passwordComplexity: value})}
              >
                <SelectTrigger data-testid="select-password-complexity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Encryption Level</Label>
              <Select 
                value={securitySettings.encryptionLevel} 
                onValueChange={(value) => setSecuritySettings({...securitySettings, encryptionLevel: value})}
              >
                <SelectTrigger data-testid="select-encryption-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="128">128-bit</SelectItem>
                  <SelectItem value="256">256-bit</SelectItem>
                  <SelectItem value="512">512-bit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="ipWhitelist">IP Whitelist (comma-separated)</Label>
            <Input
              id="ipWhitelist"
              value={securitySettings.ipWhitelist}
              onChange={(e) => setSecuritySettings({...securitySettings, ipWhitelist: e.target.value})}
              placeholder="192.168.1.1, 10.0.0.1"
              data-testid="input-ip-whitelist"
            />
          </div>

          <Button onClick={handleSecuritySave} data-testid="button-save-security">
            <Save className="h-4 w-4 mr-2" />
            Save Security Settings
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>Configure system-wide notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Send notifications via email</p>
              </div>
              <Switch
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                data-testid="switch-email-notifications"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Send critical alerts via SMS</p>
              </div>
              <Switch
                checked={notificationSettings.smsNotifications}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, smsNotifications: checked})}
                data-testid="switch-sms-notifications"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>System Alerts</Label>
                <p className="text-sm text-muted-foreground">Notify about system issues and updates</p>
              </div>
              <Switch
                checked={notificationSettings.systemAlerts}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, systemAlerts: checked})}
                data-testid="switch-system-alerts"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Appointment Reminders</Label>
                <p className="text-sm text-muted-foreground">Send automatic appointment reminders</p>
              </div>
              <Switch
                checked={notificationSettings.appointmentReminders}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, appointmentReminders: checked})}
                data-testid="switch-appointment-reminders"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Emergency Alerts</Label>
                <p className="text-sm text-muted-foreground">Critical emergency notifications</p>
              </div>
              <Switch
                checked={notificationSettings.emergencyAlerts}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emergencyAlerts: checked})}
                data-testid="switch-emergency-alerts"
              />
            </div>
          </div>

          <Button onClick={handleNotificationSave} data-testid="button-save-notifications">
            <Save className="h-4 w-4 mr-2" />
            Save Notification Settings
          </Button>
        </CardContent>
      </Card>

      {/* Backup & Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup & Maintenance
          </CardTitle>
          <CardDescription>System backup and maintenance operations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Backup Frequency</Label>
              <Select 
                value={backupSettings.backupFrequency} 
                onValueChange={(value) => setBackupSettings({...backupSettings, backupFrequency: value})}
              >
                <SelectTrigger data-testid="select-backup-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="retentionPeriod">Retention Period (days)</Label>
              <Input
                id="retentionPeriod"
                type="number"
                value={backupSettings.retentionPeriod}
                onChange={(e) => setBackupSettings({...backupSettings, retentionPeriod: e.target.value})}
                data-testid="input-retention-period"
              />
            </div>
            <div>
              <Label>Last Backup</Label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" data-testid="badge-last-backup">
                  {backupSettings.lastBackup}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleManualBackup} data-testid="button-manual-backup">
              <Download className="h-4 w-4 mr-2" />
              Manual Backup
            </Button>
            <Button onClick={handleBackupSave} variant="outline" data-testid="button-save-backup">
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>

          <Separator />

          <div className="flex gap-4">
            <Button onClick={handleSystemRestart} variant="destructive" data-testid="button-system-restart">
              <RefreshCw className="h-4 w-4 mr-2" />
              Restart System
            </Button>
            <Button variant="outline" data-testid="button-clear-cache">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}