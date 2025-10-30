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
import { useDivisions } from '@/hooks/useDivisions';
import { useDepartments } from '@/hooks/useDepartments';
import { useAdminUsers } from '@/hooks/useAdminUsers';

interface PendingUser {
  id: string;
  full_name: string | null;
  role: 'admin' | 'head' | 'manager' | 'account_manager' | 'staff';
  created_at: string;
  division_id?: string | null;
  department_id?: string | null;
}

export const RoleAssignmentPanel = () => {
  const { canManageRoles } = useProfile();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const { divisions, loading: loadingDivs } = useDivisions();
  const { departments, loading: loadingDepts } = useDepartments();
  const { updateUserProfile } = useAdminUsers('', 'all');

  const [roleDraft, setRoleDraft] = useState<Record<string, UserProfile['role']>>({});
  const [assignments, setAssignments] = useState<Record<string, { divisionId: string | null; departmentId: string | null }>>({});

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, role, created_at, division_id, department_id')
        .in('role', ['account_manager', 'head', 'manager', 'staff'] as string[])
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rawUsers = (data ?? []) as any[];
      const allUsers: PendingUser[] = rawUsers.map((u) => ({
        id: u.id,
        full_name: u.full_name ?? null,
        role: (u.role ?? 'account_manager') as PendingUser['role'],
        created_at: u.created_at,
        division_id: u.division_id ?? null,
        department_id: u.department_id ?? null,
      }));
      
      // Filter to only show truly pending users based on role requirements
      const pendingUsers = allUsers.filter(user => {
        // Head role requires division_id
        if (user.role === 'head' && !user.division_id) return true;
        // Manager, account_manager, and staff roles require department_id
        if ((user.role === 'manager' || user.role === 'account_manager' || user.role === 'staff') && !user.department_id) return true;
        // If all requirements are met, user is not pending
        return false;
      });
      
      setPendingUsers(pendingUsers);

      // Prefill drafts from existing assignments
      const nextAssignments: Record<string, { divisionId: string | null; departmentId: string | null }> = {};
      const nextRoles: Record<string, UserProfile['role']> = {};
      for (const u of pendingUsers) {
        nextAssignments[u.id] = {
          divisionId: u.division_id ?? null,
          departmentId: u.department_id ?? null,
        };
        nextRoles[u.id] = u.role as UserProfile['role'];
      }
      setAssignments(nextAssignments);
      setRoleDraft(nextRoles);
    } catch (error: any) {
      console.error('Error fetching pending users:', error);
      toast.error('Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (user: PendingUser) => {
    console.log('🔄 Starting handleSave for user:', user);
    
    const targetRole = roleDraft[user.id] || user.role;
    const selectedDivision = assignments[user.id]?.divisionId ?? null;
    const selectedDepartment = assignments[user.id]?.departmentId ?? null;

    console.log('📋 Role approval data:', {
      userId: user.id,
      targetRole,
      selectedDivision,
      selectedDepartment,
      currentUserRole: user.role,
      currentDivisionId: user.division_id,
      currentDepartmentId: user.department_id
    });

    if (!targetRole) {
      console.error('❌ No target role selected');
      toast.error('Please select a role first');
      return;
    }

    // Validate role requirements
    if (targetRole === 'head' && !selectedDivision) {
      console.error('❌ Head role requires division');
      toast.error('Head role requires a division selection');
      return;
    }

    if ((targetRole === 'manager' || targetRole === 'account_manager' || targetRole === 'staff') && !selectedDepartment) {
      console.error('❌ Manager/Account Manager/Staff role requires department');
      toast.error('Manager, Account Manager, and Staff roles require a department selection');
      return;
    }

    setUpdating(user.id);
    console.log('🔄 Set updating status for user:', user.id);

    try {
      console.log('🚀 Calling updateUserProfile...');
      const result = await updateUserProfile(
        user.id,
        targetRole,
        selectedDivision,
        selectedDepartment
      );
      
      console.log('✅ updateUserProfile result:', result);

      if (result.success) {
        console.log('🎉 Profile update successful, showing success toast');
        toast.success(`User role updated to ${targetRole} successfully`);

        console.log('⏳ Waiting 500ms before refreshing data...');
        // Wait a bit for database consistency
        setTimeout(() => {
          console.log('🔄 Calling fetchPendingUsers to refresh data');
          fetchPendingUsers();
        }, 500);
      } else {
        console.error('❌ Profile update failed:', result.error);
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('💥 Error in handleSave:', error);
      toast.error(error.message || 'Failed to update user role');
    } finally {
      console.log('🏁 Clearing updating status for user:', user.id);
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
              Manage Roles & Assignments
            </CardTitle>
            <CardDescription>
              Assign roles and set division/department for pending users
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
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingUsers.map((user) => {
                const draftRole = roleDraft[user.id] || user.role;
                const assignment = assignments[user.id] || { divisionId: null, departmentId: null };
                const availableDepartments = assignment.divisionId
                  ? departments.filter((d) => d.division_id === assignment.divisionId)
                  : departments;

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || 'No name provided'}
                    </TableCell>
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
                      <Select
                        value={draftRole}
                        disabled={updating === user.id}
                        onValueChange={(value) => setRoleDraft((prev) => ({ ...prev, [user.id]: value as UserProfile['role'] }))}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Assign role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="account_manager">Field Sales Staff</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="head">Level Head</SelectItem>
                          <SelectItem value="manager">Level Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={assignment.divisionId || undefined}
                        disabled={updating === user.id || loadingDivs}
                        onValueChange={(value) => setAssignments((prev) => ({
                          ...prev,
                          [user.id]: { ...prev[user.id], divisionId: value }
                        }))}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder={loadingDivs ? 'Loading...' : 'Select division'} />
                        </SelectTrigger>
                        <SelectContent>
                          {divisions.length === 0 ? (
                            <SelectItem value="" disabled>
                              {loadingDivs ? 'Loading...' : 'No divisions'}
                            </SelectItem>
                          ) : (
                            divisions.map((div) => (
                              <SelectItem key={div.id} value={div.id}>{div.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={assignment.departmentId || undefined}
                        disabled={updating === user.id || loadingDepts || (draftRole === 'head')}
                        onValueChange={(value) => setAssignments((prev) => ({
                          ...prev,
                          [user.id]: { ...prev[user.id], departmentId: value }
                        }))}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder={loadingDepts ? 'Loading...' : 'Select department'} />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const depsByDiv = availableDepartments;
                            const depsFinal = depsByDiv.length > 0 ? depsByDiv : departments;
                            if (depsFinal.length === 0) {
                              return (
                                <SelectItem value="" disabled>
                                  {loadingDepts ? 'Loading...' : 'No departments'}
                                </SelectItem>
                              );
                            }
                            return depsFinal.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSave(user)}
                          disabled={updating === user.id}
                        >
                          Save
                        </Button>
                        {updating === user.id && (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};