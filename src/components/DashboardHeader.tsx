import { Badge } from '@/components/ui/badge';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useProfile } from '@/hooks/useProfile';
import { useTitles } from '@/hooks/useTitles';
import { useRegions } from '@/hooks/useRegions';
import { Crown, Users, Target, User } from 'lucide-react';

interface DashboardHeaderProps {
  role: 'admin' | 'head' | 'manager' | 'account_manager';
  className?: string;
}

const ROLE_CONFIG = {
  admin: {
    dashboard: 'System Administrator Dashboard',
    badge: 'System Administrator',
    icon: Crown,
    badgeClass: 'bg-destructive text-destructive-foreground'
  },
  head: {
    dashboard: 'Level Head Dashboard', 
    badge: 'Level Head',
    icon: Users,
    badgeClass: 'bg-primary text-primary-foreground'
  },
  manager: {
    dashboard: 'Level Manager Dashboard',
    badge: 'Level Manager',
    icon: Target,
    badgeClass: 'bg-secondary text-secondary-foreground'
  },
  account_manager: {
    dashboard: 'Field Sales Staff Dashboard',
    badge: 'Field Sales Staff',
    icon: User,
    badgeClass: 'bg-accent text-accent-foreground'
  }
};

export const DashboardHeader = ({ role, className }: DashboardHeaderProps) => {
  const { getDashboardDisplay, loading } = useSystemSettings();
  const { profile } = useProfile();
  const { titles } = useTitles();
  const { regions } = useRegions();
  
  const config = ROLE_CONFIG[role];
  const IconComponent = config.icon;
  
  // Get dashboard display settings
  const dashboardSettings = !loading ? getDashboardDisplay() : { showTitleAndRegion: false };
  
  // Get user's title and region if display is enabled
  const userTitle = dashboardSettings.showTitleAndRegion && profile?.title_id 
    ? titles.find(t => t.id === profile.title_id)?.name 
    : null;
  
  const userRegion = dashboardSettings.showTitleAndRegion && profile?.region_id
    ? regions.find(r => r.id === profile.region_id)?.code
    : null;

  const additionalInfo = dashboardSettings.showTitleAndRegion && (userTitle || userRegion)
    ? `(${[userTitle, userRegion].filter(Boolean).join(', ')})`
    : null;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        <IconComponent className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {config.dashboard}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={config.badgeClass}>
              {config.badge}
            </Badge>
            {additionalInfo && (
              <span className="text-sm text-muted-foreground">
                {additionalInfo}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};