import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserCheck, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile, UserProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

interface PendingUser {
  id: string;
  full_name: string | null;
  role: 'admin' | 'head' | 'manager' | 'account_manager';
  created_at: string;
}

export const RoleAssignmentPanel = () => {
  const { canManageRoles } = useProfile();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .in('role', ['account_manager', 'head', 'manager']) // Show users who need role assignments
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingUsers(data as PendingUser[] || []);
    } catch (error: any) {
      console.error('Error fetching pending users:', error);
      toast.error('Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserProfile['role']) => {
    try {
      setUpdating(userId);
      
      // Get current user data for audit logging
      const { data: currentUser } = await supabase
        .from('user_profiles')
        .select('role, full_name')
        .eq('id', userId)
        .single();

      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Role change is automatically logged by the database trigger
      toast.success(`User role updated to ${newRole.replace('_', ' ')}`);
      fetchPendingUsers(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating user role:', error);
      
      // Log the failed attempt
      if (error?.message?.includes('Insufficient privileges')) {
        toast.error('You do not have permission to assign this role');
      } else {
        toast.error(error?.message || 'Failed to update user role');
      }
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    if (canManageRoles()) {
      fetchPendingUsers();
    }
  }, [canManageRoles]);

  if (!canManageRoles()) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Manage Roles
            </CardTitle>
            <CardDescription>
              Assign roles to pending users in your organization
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchPendingUsers}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Pending Users</h3>
            <p className="text-muted-foreground">
              All users have been assigned roles. New registrations will appear here.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.full_name || 'No name provided'}
                  </TableCell>
                  <TableCell>No email available</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      <AlertCircle className="h-3 w-3" />
                      Pending
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        disabled={updating === user.id}
                        onValueChange={(value) => updateUserRole(user.id, value as UserProfile['role'])}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Assign role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="account_manager">Field Sales Staff</SelectItem>
                           <SelectItem value="head">Level Head</SelectItem>
                           <SelectItem value="manager">Level Manager</SelectItem>
                        </SelectContent>
                      </Select>
                      {updating === user.id && (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};