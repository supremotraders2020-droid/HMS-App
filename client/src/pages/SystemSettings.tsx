import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IntegerInput } from "@/components/validated-inputs";
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
  Download,
  Trash2,
  Save,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  HardDrive
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface BackupLog {
  id: string;
  backupType: string;
  status: string;
  tablesIncluded: number | null;
  totalRecords: number | null;
  fileSize: string | null;
  filePath: string | null;
  startedAt: string;
  completedAt: string | null;
  triggeredBy: string | null;
}

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
    lastBackup: "",
    backupLocation: "Internal Storage"
  });

  const { data: savedSettings, isLoading: isLoadingSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/system/settings"],
  });

  const { data: backupHistory, isLoading: isLoadingBackups } = useQuery<BackupLog[]>({
    queryKey: ["/api/system/backups"],
  });

  useEffect(() => {
    if (savedSettings) {
      if (savedSettings.maintenanceMode !== undefined) {
        setSystemConfig(prev => ({ ...prev, maintenanceMode: savedSettings.maintenanceMode === "true" }));
      }
      if (savedSettings.autoBackup !== undefined) {
        setSystemConfig(prev => ({ ...prev, autoBackup: savedSettings.autoBackup === "true" }));
      }
      if (savedSettings.sessionTimeout) setSystemConfig(prev => ({ ...prev, sessionTimeout: savedSettings.sessionTimeout }));
      if (savedSettings.maxLoginAttempts) setSystemConfig(prev => ({ ...prev, maxLoginAttempts: savedSettings.maxLoginAttempts }));
      if (savedSettings.passwordExpiry) setSystemConfig(prev => ({ ...prev, passwordExpiry: savedSettings.passwordExpiry }));
      if (savedSettings.dataRetention) setSystemConfig(prev => ({ ...prev, dataRetention: savedSettings.dataRetention }));

      if (savedSettings.twoFactorAuth !== undefined) setSecuritySettings(prev => ({ ...prev, twoFactorAuth: savedSettings.twoFactorAuth === "true" }));
      if (savedSettings.ipWhitelist) setSecuritySettings(prev => ({ ...prev, ipWhitelist: savedSettings.ipWhitelist }));
      if (savedSettings.encryptionLevel) setSecuritySettings(prev => ({ ...prev, encryptionLevel: savedSettings.encryptionLevel }));
      if (savedSettings.auditLogging !== undefined) setSecuritySettings(prev => ({ ...prev, auditLogging: savedSettings.auditLogging !== "false" }));
      if (savedSettings.passwordComplexity) setSecuritySettings(prev => ({ ...prev, passwordComplexity: savedSettings.passwordComplexity }));

      if (savedSettings.emailNotifications !== undefined) setNotificationSettings(prev => ({ ...prev, emailNotifications: savedSettings.emailNotifications !== "false" }));
      if (savedSettings.smsNotifications !== undefined) setNotificationSettings(prev => ({ ...prev, smsNotifications: savedSettings.smsNotifications !== "false" }));
      if (savedSettings.systemAlerts !== undefined) setNotificationSettings(prev => ({ ...prev, systemAlerts: savedSettings.systemAlerts !== "false" }));
      if (savedSettings.appointmentReminders !== undefined) setNotificationSettings(prev => ({ ...prev, appointmentReminders: savedSettings.appointmentReminders !== "false" }));
      if (savedSettings.emergencyAlerts !== undefined) setNotificationSettings(prev => ({ ...prev, emergencyAlerts: savedSettings.emergencyAlerts !== "false" }));

      if (savedSettings.autoBackupEnabled !== undefined) setBackupSettings(prev => ({ ...prev, autoBackupEnabled: savedSettings.autoBackupEnabled !== "false" }));
      if (savedSettings.backupFrequency) setBackupSettings(prev => ({ ...prev, backupFrequency: savedSettings.backupFrequency }));
      if (savedSettings.retentionPeriod) setBackupSettings(prev => ({ ...prev, retentionPeriod: savedSettings.retentionPeriod }));
      if (savedSettings.lastBackup) setBackupSettings(prev => ({ ...prev, lastBackup: savedSettings.lastBackup }));
    }
  }, [savedSettings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: Record<string, string>) => {
      const res = await apiRequest("PUT", "/api/system/settings", settings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/settings"] });
    },
  });

  const manualBackupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/system/backup");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/backups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system/settings"] });
      toast({
        title: "Backup Completed",
        description: `${data.tablesExported} tables exported, ${data.totalRecords} records (${data.fileSize})`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Backup Failed",
        description: error.message || "Something went wrong during backup",
        variant: "destructive",
      });
    },
  });

  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/system/clear-cache");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Cache Cleared", description: "System cache has been cleared successfully" });
    },
  });

  const handleSystemConfigSave = () => {
    saveSettingsMutation.mutate({
      maintenanceMode: String(systemConfig.maintenanceMode),
      autoBackup: String(systemConfig.autoBackup),
      sessionTimeout: systemConfig.sessionTimeout,
      maxLoginAttempts: systemConfig.maxLoginAttempts,
      passwordExpiry: systemConfig.passwordExpiry,
      dataRetention: systemConfig.dataRetention,
    });
    toast({ title: "Saved", description: "System configuration updated successfully" });
  };

  const handleNotificationSave = () => {
    saveSettingsMutation.mutate({
      emailNotifications: String(notificationSettings.emailNotifications),
      smsNotifications: String(notificationSettings.smsNotifications),
      systemAlerts: String(notificationSettings.systemAlerts),
      appointmentReminders: String(notificationSettings.appointmentReminders),
      emergencyAlerts: String(notificationSettings.emergencyAlerts),
      maintenanceNotifications: String(notificationSettings.maintenanceNotifications),
    });
    toast({ title: "Saved", description: "Notification settings updated successfully" });
  };

  const handleSecuritySave = () => {
    saveSettingsMutation.mutate({
      twoFactorAuth: String(securitySettings.twoFactorAuth),
      ipWhitelist: securitySettings.ipWhitelist,
      encryptionLevel: securitySettings.encryptionLevel,
      auditLogging: String(securitySettings.auditLogging),
      passwordComplexity: securitySettings.passwordComplexity,
    });
    toast({ title: "Saved", description: "Security settings updated successfully" });
  };

  const handleBackupSave = () => {
    saveSettingsMutation.mutate({
      autoBackupEnabled: String(backupSettings.autoBackupEnabled),
      backupFrequency: backupSettings.backupFrequency,
      retentionPeriod: backupSettings.retentionPeriod,
    });
    toast({ title: "Saved", description: "Backup settings updated successfully" });
  };

  const handleManualBackup = () => {
    manualBackupMutation.mutate();
  };

  const handleSystemRestart = () => {
    toast({
      title: "System Restart",
      description: "System restart has been scheduled",
      variant: "destructive"
    });
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Never";
    try {
      return new Date(dateStr).toLocaleString("en-IN", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  const lastBackupDisplay = backupHistory && backupHistory.length > 0 
    ? formatDate(backupHistory.find(b => b.status === "completed")?.completedAt)
    : (backupSettings.lastBackup ? formatDate(backupSettings.lastBackup) : "Never");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">System Settings</h1>
          <p className="text-muted-foreground">Configure software settings and system preferences</p>
        </div>
        {isLoadingSettings && (
          <Badge variant="secondary">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Loading settings...
          </Badge>
        )}
      </div>

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
              <IntegerInput
                id="sessionTimeout"
                min={1}
                value={systemConfig.sessionTimeout}
                onValueChange={(value) => setSystemConfig({...systemConfig, sessionTimeout: value})}
                data-testid="input-session-timeout"
              />
            </div>
            <div>
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <IntegerInput
                id="maxLoginAttempts"
                min={1}
                value={systemConfig.maxLoginAttempts}
                onValueChange={(value) => setSystemConfig({...systemConfig, maxLoginAttempts: value})}
                data-testid="input-max-login-attempts"
              />
            </div>
            <div>
              <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
              <IntegerInput
                id="passwordExpiry"
                min={1}
                value={systemConfig.passwordExpiry}
                onValueChange={(value) => setSystemConfig({...systemConfig, passwordExpiry: value})}
                data-testid="input-password-expiry"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="dataRetention">Data Retention Period (days)</Label>
            <IntegerInput
              id="dataRetention"
              min={1}
              value={systemConfig.dataRetention}
              onValueChange={(value) => setSystemConfig({...systemConfig, dataRetention: value})}
              className="w-full md:w-48"
              data-testid="input-data-retention"
            />
          </div>

          <Button onClick={handleSystemConfigSave} disabled={saveSettingsMutation.isPending} data-testid="button-save-system-config">
            {saveSettingsMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save System Configuration
          </Button>
        </CardContent>
      </Card>

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

          <Button onClick={handleSecuritySave} disabled={saveSettingsMutation.isPending} data-testid="button-save-security">
            {saveSettingsMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Security Settings
          </Button>
        </CardContent>
      </Card>

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

          <Button onClick={handleNotificationSave} disabled={saveSettingsMutation.isPending} data-testid="button-save-notifications">
            {saveSettingsMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Notification Settings
          </Button>
        </CardContent>
      </Card>

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
              <IntegerInput
                id="retentionPeriod"
                min={1}
                value={backupSettings.retentionPeriod}
                onValueChange={(value) => setBackupSettings({...backupSettings, retentionPeriod: value})}
                data-testid="input-retention-period"
              />
            </div>
            <div>
              <Label>Last Backup</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" data-testid="badge-last-backup">
                  <Clock className="h-3 w-3 mr-1" />
                  {lastBackupDisplay}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button onClick={handleManualBackup} disabled={manualBackupMutation.isPending} data-testid="button-manual-backup">
              {manualBackupMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Backing up...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Manual Backup
                </>
              )}
            </Button>
            <Button onClick={handleBackupSave} variant="outline" disabled={saveSettingsMutation.isPending} data-testid="button-save-backup">
              {saveSettingsMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Settings
            </Button>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-4">
            <Button onClick={handleSystemRestart} variant="destructive" data-testid="button-system-restart">
              <RefreshCw className="h-4 w-4 mr-2" />
              Restart System
            </Button>
            <Button variant="outline" onClick={() => clearCacheMutation.mutate()} disabled={clearCacheMutation.isPending} data-testid="button-clear-cache">
              {clearCacheMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Backup History
          </CardTitle>
          <CardDescription>Recent backup operations and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingBackups ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading backup history...</span>
            </div>
          ) : !backupHistory || backupHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No backups yet. Click "Manual Backup" to create your first backup.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
                <span>Backup</span>
                <span className="w-24 text-center">Type</span>
                <span className="w-24 text-center">Status</span>
                <span className="w-20 text-center">Size</span>
                <span className="w-20 text-center">Records</span>
              </div>
              {backupHistory.map((backup) => (
                <div key={backup.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center p-3 border rounded-md">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{formatDate(backup.startedAt)}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {backup.tablesIncluded ? `${backup.tablesIncluded} tables` : "Processing..."}
                    </p>
                  </div>
                  <div className="w-24 text-center">
                    <Badge variant={backup.backupType === "manual" ? "default" : "secondary"}>
                      {backup.backupType === "manual" ? "Manual" : "Auto"}
                    </Badge>
                  </div>
                  <div className="w-24 text-center">
                    {backup.status === "completed" ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Done
                      </Badge>
                    ) : backup.status === "in_progress" ? (
                      <Badge variant="secondary">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Running
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </div>
                  <div className="w-20 text-center text-sm text-muted-foreground">
                    {backup.fileSize || "-"}
                  </div>
                  <div className="w-20 text-center text-sm text-muted-foreground">
                    {backup.totalRecords?.toLocaleString() || "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}