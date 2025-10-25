import React, { useState } from 'react';
import { Settings2, Search, Filter, Save, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RoleBadge } from '@/components/RoleBadge';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useProfile, UserProfile } from '@/hooks/useProfile';
import { TitleManagement } from '@/components/TitleManagement';
import { RegionManagement } from '@/components/RegionManagement';
import { OrganizationalHierarchy } from '@/components/OrganizationalHierarchy';
import { PermissionGuard } from '@/components/PermissionGuard';
import { useTitles } from '@/hooks/useTitles';
import { useRegions } from '@/hooks/useRegions';
import { EntityManagement } from '@/components/EntityManagement';
import { GlobalSettings } from '@/components/GlobalSettings';
import { FxRateManagement } from '@/components/FxRateManagement';
import { AuditLogViewer } from '@/components/AuditLogViewer';
import { EntityScopedDashboard } from '@/components/EntityScopedDashboard';
import { supabase } from '@/integrations/supabase/client';
import { useDivisions } from '@/hooks/useDivisions';
import { DivisionDepartmentManagement } from '@/components/DivisionDepartmentManagement';

type RoleFilter = 'all' | 'account_manager' | 'head' | 'manager' | 'admin' | 'pending';

interface UserUpdate {
  userId: string;
  role?: UserProfile['role'];
  title_id?: string;
  region_id?: string;
  division_id?: string | null;
  department_id?: string | null;
  teamId?: string;
  isDirty: boolean;
}

export default function Admin() {
  const { profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const { users, loading: usersLoading, refetch, updateUserProfile, deleteUser } = useAdminUsers(searchQuery, roleFilter);
  const { titles } = useTitles();
  const { regions } = useRegions();
  const { divisions, refetch: refetchDivisions } = useDivisions();

  const [departments, setDepartments] = useState<Array<{ id: string; name: string; division_id: string | null }>>([]);

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, division_id')
      .order('name', { ascending: true });
    setDepartments(error ? [] : (data || []));
  };

  React.useEffect(() => {
    fetchDepartments();
  }, []);

  React.useEffect(() => {
    const handler = () => {
      refetchDivisions();
      fetchDepartments();
    };
    window.addEventListener('org-units-changed', handler);
    return () => window.removeEventListener('org-units-changed', handler);
  }, [refetchDivisions]);

  const [userUpdates, setUserUpdates] = useState<Record<string, UserUpdate>>({});
  const [savingUsers, setSavingUsers] = useState<Set<string>>(new Set());

  // No need for client-side filtering anymore since we use server-side filtering
  const filteredUsers = users || [];

  const handleRoleChange = (userId: string, newRole: UserProfile['role']) => {
    // Find the user to get their current role
    const user = users?.find(u => u.id === userId);
    const currentRole = user?.role;
    
    // Only mark as dirty if the role actually changed
    if (currentRole !== newRole) {
      setUserUpdates(prev => ({
        ...prev,
        [userId]: {
          userId,
          role: newRole,
          isDirty: true
        }
      }));
    } else {
      // If role is the same as original, remove from updates
      setUserUpdates(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    }
  };

  const handleTitleChange = (userId: string, newTitleId: string) => {
    // Find the user to get their current title
    const user = users?.find(u => u.id === userId);
    const currentTitleId = user?.title_id;
    
    // Only mark as dirty if the title actually changed
    if (currentTitleId !== newTitleId) {
      setUserUpdates(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          userId,
          title_id: newTitleId,
          isDirty: true
        }
      }));
    } else {
      // If title is the same as original, remove title from updates
      setUserUpdates(prev => {
        const updated = { ...prev };
        if (updated[userId]) {
          delete updated[userId].title_id;
          // If no other changes, remove the entire entry
          if (!updated[userId].role && !updated[userId].region_id && !updated[userId].division_id && !updated[userId].department_id) {
            delete updated[userId];
          }
        }
        return updated;
      });
    }
  };

  const handleRegionChange = (userId: string, newRegionId: string) => {
    // Find the user to get their current region
    const user = users?.find(u => u.id === userId);
    const currentRegionId = user?.region_id;
    
    // Only mark as dirty if the region actually changed
    if (currentRegionId !== newRegionId) {
      setUserUpdates(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          userId,
          region_id: newRegionId,
          isDirty: true
        }
      }));
    } else {
      // If region is the same as original, remove region from updates
      setUserUpdates(prev => {
        const updated = { ...prev };
        if (updated[userId]) {
          delete updated[userId].region_id;
          // If no other changes, remove the entire entry
          if (!updated[userId].role && !updated[userId].title_id && !updated[userId].division_id && !updated[userId].department_id) {
            delete updated[userId];
          }
        }
        return updated;
      });
    }
  };

  const handleDivisionChange = (userId: string, newDivisionId: string) => {
    const user = users?.find(u => u.id === userId);
    const currentDivisionId = user?.division_id || null;
    const nextDivisionId = newDivisionId === 'none' ? null : (newDivisionId || null);
    if (currentDivisionId !== nextDivisionId) {
      setUserUpdates(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          userId,
          division_id: nextDivisionId,
          isDirty: true,
        }
      }));
    } else {
      setUserUpdates(prev => {
        const updated = { ...prev };
        if (updated[userId]) {
          delete updated[userId].division_id;
          if (!updated[userId].role && !updated[userId].title_id && !updated[userId].region_id && !updated[userId].department_id) {
            delete updated[userId];
          }
        }
        return updated;
      });
    }
  };

  const handleDepartmentChange = (userId: string, newDepartmentId: string) => {
    const user = users?.find(u => u.id === userId);
    const currentDepartmentId = user?.department_id || null;
    const nextDepartmentId = newDepartmentId === 'none' ? null : (newDepartmentId || null);
    if (currentDepartmentId !== nextDepartmentId) {
      setUserUpdates(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          userId,
          department_id: nextDepartmentId,
          isDirty: true,
        }
      }));
    } else {
      setUserUpdates(prev => {
        const updated = { ...prev };
        if (updated[userId]) {
          delete updated[userId].department_id;
          if (!updated[userId].role && !updated[userId].title_id && !updated[userId].region_id && !updated[userId].division_id) {
            delete updated[userId];
          }
        }
        return updated;
      });
    }
  };

  const handleTeamChange = (userId: string, teamId: string) => {
    setUserUpdates(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        userId,
        teamId,
        isDirty: true
      }
    }));
  };

  const saveUserRole = async (userId: string) => {
    const update = userUpdates[userId];
    if (!update || !update.isDirty) return;

    setSavingUsers(prev => new Set(prev).add(userId));

    try {
      const current = users?.find(u => u.id === userId);
      const newRole = update.role ?? current?.role ?? 'account_manager';
      const newDivisionId = (update.division_id !== undefined) ? update.division_id : (current?.division_id ?? null);
      const newDepartmentId = (update.department_id !== undefined) ? update.department_id : (current?.department_id ?? null);

      const result = await updateUserProfile(
        userId,
        newRole,
        newDivisionId,
        newDepartmentId
      );

      if (result.success) {
        // Remove from updates after successful save
        setUserUpdates(prev => {
          const newUpdates = { ...prev };
          delete newUpdates[userId];
          return newUpdates;
        });
      }
    } catch (error: any) {
      // Error handling would be displayed in UI
    } finally {
      setSavingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const discardChanges = (userId: string) => {
    setUserUpdates(prev => {
      const newUpdates = { ...prev };
      delete newUpdates[userId];
      return newUpdates;
    });
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users?.find(u => u.id === userId);
    const isAdminTarget = user?.role === 'admin';
    const isSelf = userId === profile?.id;
    if (isAdminTarget || isSelf) return;
    const confirmed = window.confirm('Delete this user? This action cannot be undone.');
    if (!confirmed) return;
    setSavingUsers(prev => new Set([...prev, userId]));
    const { error } = await deleteUser(userId);
    setSavingUsers(prev => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
    if (error) {
      console.error('Failed to delete user', error);
      alert('Failed to delete user: ' + (error.message || 'Unknown error'));
    } else {
      setUserUpdates(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      refetch();
    }
  };

  const getCurrentRole = (user: any) => {
    return userUpdates[user.id]?.role || user.role;
  };

  const getCurrentTitle = (user: any) => {
    return userUpdates[user.id]?.title_id !== undefined ? userUpdates[user.id]?.title_id : user.title_id;
  };

  const getCurrentRegion = (user: any) => {
    return userUpdates[user.id]?.region_id !== undefined ? userUpdates[user.id]?.region_id : user.region_id;
  };

  const isDirty = (userId: string) => {
    const updates = userUpdates[userId];
    return updates?.isDirty || false;
  };

  const canManageUser = (userRole: UserProfile['role']) => {
    return profile?.role === 'admin' || (profile?.role === 'manager' && userRole !== 'admin' && userRole !== 'manager');
  };

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
      </div>

      {/* Organizational Hierarchy - visible to all roles */}
      <OrganizationalHierarchy />

      <PermissionGuard permission="canAccessUserManagement">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <TitleManagement />
            <RegionManagement />
            <DivisionDepartmentManagement />
          </div>
          
          <EntityManagement />
          
          <GlobalSettings />
          
          <FxRateManagement />
          
          <AuditLogViewer />
          
          <EntityScopedDashboard />
        </div>
      </PermissionGuard>

      <PermissionGuard permission="canAccessUserManagement">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle className="text-xl">Manage User Roles</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select value={roleFilter} onValueChange={(value: RoleFilter) => setRoleFilter(value)}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="pending">Pending Assignment</SelectItem>
                  <SelectItem value="account_manager">Field Sales Staff</SelectItem>
                  <SelectItem value="head">Level Head</SelectItem>
                  <SelectItem value="manager">Level Manager</SelectItem>
                  <SelectItem value="admin">System Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Name</TableHead>
                    <TableHead className="min-w-[180px] hidden sm:table-cell">Email</TableHead>
                    <TableHead className="min-w-[140px]">Current Role</TableHead>
                    <TableHead className="min-w-[100px]">Title</TableHead>
                    <TableHead className="min-w-[80px]">Region</TableHead>
                    <TableHead className="min-w-[120px]">Division</TableHead>
                    <TableHead className="min-w-[140px]">Department</TableHead>
                    <TableHead className="text-right min-w-[160px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                 {filteredUsers.map((user) => {
                   const currentRole = getCurrentRole(user);
                   const isUserDirty = isDirty(user.id);
                   const isSaving = savingUsers.has(user.id);
                   const canManage = canManageUser(user.role);
                   const currentDivisionId = (userUpdates[user.id]?.division_id !== undefined) ? (userUpdates[user.id]?.division_id ?? '') : (user.division_id ?? '');
                   const currentDepartmentId = (userUpdates[user.id]?.department_id !== undefined) ? (userUpdates[user.id]?.department_id ?? '') : (user.department_id ?? '');

                    return (
                     <TableRow key={user.id} className={isUserDirty ? "bg-muted/30" : ""}>
                       <TableCell className="font-medium">
                         <div className="truncate max-w-[120px]" title={user.full_name || 'No name'}>
                           {user.full_name || 'No name'}
                         </div>
                       </TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">
                          <div className="truncate max-w-[180px]" title={user.email || 'No email'}>
                            {user.email || 'No email'}
                          </div>
                        </TableCell>
                      <TableCell>
                        <RoleBadge role={user.role} />
                      </TableCell>
                      <TableCell>
                        {canManage ? (
                          <Select
                            value={getCurrentTitle(user) || undefined}
                            onValueChange={(value) => handleTitleChange(user.id, value)}
                            disabled={isSaving}
                          >
                            <SelectTrigger className="w-full max-w-[100px]">
                              <SelectValue placeholder="Optional" />
                            </SelectTrigger>
                            <SelectContent className="max-w-[150px]">
                              {titles
                                .filter(title => title.is_active && title.id && title.id.trim() !== '')
                                .map((title) => (
                                  <SelectItem key={title.id} value={title.id}>
                                    <span className="truncate">{title.name}</span>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm text-muted-foreground truncate block max-w-[100px]">
                            {titles.find(t => t.id === user.title_id)?.name || '-'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {canManage ? (
                          <Select
                            value={getCurrentRegion(user) || undefined}
                            onValueChange={(value) => handleRegionChange(user.id, value)}
                            disabled={isSaving}
                          >
                            <SelectTrigger className="w-full max-w-[80px]">
                              <SelectValue placeholder="Optional" />
                            </SelectTrigger>
                            <SelectContent className="max-w-[120px]">
                              {regions
                                .filter(region => region.is_active && region.id && region.id.trim() !== '')
                                .map((region) => (
                                  <SelectItem key={region.id} value={region.id}>
                                    <span className="truncate font-mono">{region.code}</span>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm text-muted-foreground truncate block max-w-[80px] font-mono">
                            {regions.find(r => r.id === user.region_id)?.code || '-'}
                          </span>
                        )}
                       </TableCell>
                      <TableCell>
                        {canManage ? (
                          <Select
                            value={currentDivisionId || ''}
                            onValueChange={(value) => handleDivisionChange(user.id, value)}
                            disabled={isSaving}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Division" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {divisions.map((d) => (
                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {canManage ? (
                          <Select
                            value={currentDepartmentId || ''}
                            onValueChange={(value) => handleDepartmentChange(user.id, value)}
                            disabled={isSaving}
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue placeholder="Department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {departments
                                .filter(dep => {
                                  const selectedDiv = currentDivisionId || user.division_id || null;
                                  return selectedDiv ? dep.division_id === selectedDiv : true;
                                })
                                .map((dep) => (
                                  <SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                         <div className="flex items-center gap-2 justify-end">
                          {canManage ? (
                            <>
                              <Select
                                value={currentRole}
                                onValueChange={(value: UserProfile['role']) => handleRoleChange(user.id, value)}
                                disabled={isSaving || user.role === 'admin' || user.id === profile?.id}
                              >
                                <SelectTrigger className="w-full max-w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-w-[200px]">
                                  <SelectItem value="account_manager">Field Sales Staff</SelectItem>
                                  <SelectItem value="head">Level Head</SelectItem>
                                  <SelectItem value="manager">Level Manager</SelectItem>
                                  <SelectItem value="admin">System Administrator</SelectItem>
                                </SelectContent>
                              </Select>
                              {isUserDirty && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => saveUserRole(user.id)}
                                    disabled={isSaving}
                                    className="h-8 w-8 p-0"
                                  >
                                    {isSaving ? (
                                      <div className="h-3 w-3 animate-spin border border-current border-t-transparent rounded-full" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => discardChanges(user.id)}
                                    disabled={isSaving}
                                    className="h-8 w-8 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={isSaving || user.role === 'admin' || user.id === profile?.id}
                                className="h-8"
                              >
                                Delete
                              </Button>
                            </>
                          ) : (
                            <RoleBadge role={user.role} />
                          )}
                         </div>
                      </TableCell>
                     </TableRow>
                  );
                })}
              </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      </PermissionGuard>
    </div>
  );
}