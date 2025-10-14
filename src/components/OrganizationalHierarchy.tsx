import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ChevronDown } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

interface HierarchyLevel {
  role: string;
  title: string;
  description: string;
  permissions: string[];
}

const hierarchyLevels: HierarchyLevel[] = [
  {
    role: 'admin',
    title: 'System Administrator',
    description: 'Full system access and management capabilities',
    permissions: ['All system functions', 'User management', 'Global settings', 'Security configuration']
  },
  {
    role: 'head',
    title: 'Level Head',
    description: 'Manages Level Manager areas and strategic oversight', 
    permissions: ['Manager area oversight', 'Strategic planning', 'Territory management', 'Team performance review']
  },
  {
    role: 'manager',
    title: 'Level Manager',
    description: 'Manages Level Head areas and operational processes',
    permissions: ['Head area management', 'Pipeline oversight', 'Performance monitoring', 'Target setting']
  },
  {
    role: 'account_manager',
    title: 'Field Sales Staff',
    description: 'Direct customer engagement and opportunity management',
    permissions: ['Customer interaction', 'Opportunity management', 'Activity logging', 'Deal progression']
  }
];

export const OrganizationalHierarchy = () => {
  const { profile } = useProfile();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'head': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'account_manager': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isCurrentUserRole = (role: string) => profile?.role === role;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle>Organizational Hierarchy</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hierarchyLevels.map((level, index) => (
            <div key={level.role} className="relative">
              {/* Hierarchy Level Card */}
              <div className={`
                p-4 rounded-lg border-2 transition-all duration-200
                ${isCurrentUserRole(level.role) 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-border bg-card hover:bg-muted/50'
                }
              `}>
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(level.role)}>
                        {level.title}
                      </Badge>
                      {isCurrentUserRole(level.role) && (
                        <Badge variant="secondary" className="text-xs">
                          Your Role
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {level.description}
                    </p>
                  </div>
                </div>

                {/* Permissions */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Key Permissions:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {level.permissions.map((permission, permIndex) => (
                      <div key={permIndex} className="flex items-center gap-1 text-xs text-muted-foreground">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                        <span>{permission}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target & Reporting Flow */}
                {level.role !== 'account_manager' && (
                  <div className="mt-3 p-2 bg-muted/30 rounded text-xs">
                    <span className="font-medium text-muted-foreground">
                      Reporting Flow: 
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {level.role === 'admin' && 'Receives all reports from Level Heads'}
                      {level.role === 'head' && 'Sets Level Manager targets • Receives Level Manager reports'}
                      {level.role === 'manager' && 'Sets Field Sales Staff targets • Receives Field Sales Staff reports'}
                    </span>
                  </div>
                )}
              </div>

              {/* Connecting Line */}
              {index < hierarchyLevels.length - 1 && (
                <div className="flex justify-center py-2">
                  <div className="flex flex-col items-center">
                    <div className="w-px h-4 bg-border" />
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    <div className="w-px h-4 bg-border" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Target Flow Summary */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-medium text-sm mb-2 text-foreground">Target & Reporting Flow Summary</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>• <strong>Level Head</strong> sets targets for Level Managers</div>
            <div>• <strong>Level Manager</strong> sets targets for Field Sales Staff</div>
            <div>• <strong>Field Sales Staff</strong> executes only, no self-quota</div>
            <div>• Reports roll up automatically: Field Sales Staff → Level Manager → Level Head → Admin</div>
            <div>• Dashboards show both role + title/region labels</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};