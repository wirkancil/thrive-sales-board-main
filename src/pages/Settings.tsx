import React, { useState } from 'react';
import { User, Settings as SettingsIcon, Shield, Moon, Sun, Bell, Globe, Lock, LogOut, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/NotificationBell';

type SettingsSection = 'profile' | 'preferences' | 'security';

const settingsNavigation = [
  { id: 'profile' as SettingsSection, label: 'Profile', icon: User },
  { id: 'preferences' as SettingsSection, label: 'Preferences', icon: SettingsIcon },
  { id: 'security' as SettingsSection, label: 'Security', icon: Shield },
];

const timezones = [
  { value: 'UTC', label: 'UTC (GMT+0)' },
  { value: 'America/New_York', label: 'Eastern Time (GMT-5)' },
  { value: 'America/Chicago', label: 'Central Time (GMT-6)' },
  { value: 'America/Denver', label: 'Mountain Time (GMT-7)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (GMT-8)' },
  { value: 'Europe/London', label: 'London (GMT+0)' },
  { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
];

export default function Settings() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'account_manager':
        return 'Field Sales Staff';
      case 'head':
        return 'Strategic Leadership';
      case 'manager':
        return 'Operational Leader';
      case 'admin':
        return 'System Administrator';
      default:
        return 'User';
    }
  };

  const renderProfileSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Manage your personal information and account details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {user?.user_metadata?.full_name 
                ? getInitials(user.user_metadata.full_name)
                : user?.email?.charAt(0).toUpperCase()
              }
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="text-lg font-medium">
              {user?.user_metadata?.full_name || profile?.full_name || 'User'}
            </h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {profile?.role && (
              <Badge variant="secondary">{getRoleDisplayName(profile.role)}</Badge>
            )}
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input 
              id="fullName" 
              placeholder="Enter your full name"
              defaultValue={user?.user_metadata?.full_name || profile?.full_name || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email"
              placeholder="john@example.com"
              defaultValue={user?.email || ""}
              disabled
              className="bg-muted/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              placeholder="Enter your full name"
              defaultValue={profile?.full_name || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input 
              id="department" 
              placeholder="Enter your department"
              defaultValue={profile?.department || ""}
            />
          </div>
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderPreferencesSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>
          Customize your experience and notification settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="theme">Theme</Label>
            <p className="text-sm text-muted-foreground">
              Choose your preferred theme
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Sun className="h-4 w-4" />
            <Switch
              id="theme"
              checked={isDarkMode}
              onCheckedChange={setIsDarkMode}
            />
            <Moon className="h-4 w-4" />
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications">Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive email notifications for updates
            </p>
          </div>
          <Switch
            id="notifications"
            checked={notifications}
            onCheckedChange={setNotifications}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select defaultValue="America/New_York">
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {timezones
                .filter(timezone => timezone.value && timezone.value.trim() !== '' && timezone.label && timezone.label.trim() !== '')
                .map((timezone) => (
                  <SelectItem key={timezone.value} value={timezone.value}>
                    {timezone.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderSecuritySection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>
          Manage your account security and privacy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">
                  Last changed 3 months ago
                </p>
              </div>
            </div>
            <Button variant="outline">Reset Password</Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security
                </p>
              </div>
            </div>
            <Switch
              checked={twoFactorAuth}
              onCheckedChange={setTwoFactorAuth}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <LogOut className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Active Sessions</p>
                <p className="text-sm text-muted-foreground">
                  Sign out from all other devices
                </p>
              </div>
            </div>
            <Button variant="outline" className="text-destructive hover:text-destructive">
              Logout All Devices
            </Button>
          </div>
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'preferences':
        return renderPreferencesSection();
      case 'security':
        return renderSecuritySection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <NotificationBell />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1">
          <Card className="sticky top-6">
            <CardContent className="p-4">
              <nav className="space-y-2">
                {settingsNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-3">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}