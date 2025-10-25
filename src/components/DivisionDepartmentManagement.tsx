import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Save, X, RefreshCw, Trash2, Building2, GitBranch } from 'lucide-react';
import { useDivisions } from '@/hooks/useDivisions';
import { useDepartments } from '@/hooks/useDepartments';
import { toast } from 'sonner';

export const DivisionDepartmentManagement = () => {
  // Divisions
  const { divisions, loading: divisionsLoading, createDivision, updateDivision, deleteDivision, refetch: refetchDivisions } = useDivisions();
  const [newDivisionName, setNewDivisionName] = useState('');
  const [editingDivisionId, setEditingDivisionId] = useState<string | null>(null);
  const [editingDivisionName, setEditingDivisionName] = useState('');
  const [creatingDivision, setCreatingDivision] = useState(false);
  const [updatingDivision, setUpdatingDivision] = useState<string | null>(null);
  const [deletingDivision, setDeletingDivision] = useState<string | null>(null);

  // Departments
  const { departments, loading: departmentsLoading, createDepartment, updateDepartment, deleteDepartment, refetch: refetchDepartments } = useDepartments();
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newDepartmentDivisionId, setNewDepartmentDivisionId] = useState<string>('');
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [editingDepartmentName, setEditingDepartmentName] = useState('');
  const [editingDepartmentDivisionId, setEditingDepartmentDivisionId] = useState<string>('');
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [updatingDepartment, setUpdatingDepartment] = useState<string | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<string | null>(null);
  const [filterDivisionId, setFilterDivisionId] = useState<string>('all');

  const filteredDepartments = useMemo(() => {
    if (filterDivisionId === 'all') return departments;
    if (filterDivisionId === 'none') return departments.filter((d) => !d.division_id);
    return departments.filter((d) => d.division_id === filterDivisionId);
  }, [departments, filterDivisionId]);

  const syncOrgUnits = () => {
    try {
      window.dispatchEvent(new CustomEvent('org-units-changed'));
    } catch (e) {
      // no-op for environments without window
    }
  };

  // Division handlers
  const handleCreateDivision = async () => {
    if (!newDivisionName.trim()) {
      toast.error('Division name is required');
      return;
    }
    setCreatingDivision(true);
    try {
      await createDivision(newDivisionName.trim());
      setNewDivisionName('');
      toast.success('Division created successfully');
      syncOrgUnits();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create division');
    } finally {
      setCreatingDivision(false);
    }
  };

  const handleEditDivision = (division: any) => {
    setEditingDivisionId(division.id);
    setEditingDivisionName(division.name);
  };

  const handleSaveDivision = async (id: string) => {
    if (!editingDivisionName.trim()) {
      toast.error('Division name is required');
      return;
    }
    setUpdatingDivision(id);
    try {
      await updateDivision(id, { name: editingDivisionName.trim() });
      setEditingDivisionId(null);
      setEditingDivisionName('');
      toast.success('Division updated successfully');
      syncOrgUnits();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update division');
    } finally {
      setUpdatingDivision(null);
    }
  };

  const handleCancelDivision = () => {
    setEditingDivisionId(null);
    setEditingDivisionName('');
  };

  const handleDeleteDivision = async (id: string, name: string) => {
    if (!confirm(`Delete division "${name}"? This cannot be undone.`)) return;
    setDeletingDivision(id);
    try {
      await deleteDivision(id);
      toast.success('Division deleted successfully');
      syncOrgUnits();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete division');
    } finally {
      setDeletingDivision(null);
    }
  };

  // Department handlers
  const handleCreateDepartment = async () => {
    if (!newDepartmentName.trim()) {
      toast.error('Department name is required');
      return;
    }
    setCreatingDepartment(true);
    try {
      const divisionId = newDepartmentDivisionId && newDepartmentDivisionId !== 'none' ? newDepartmentDivisionId : null;
      await createDepartment(newDepartmentName.trim(), divisionId);
      setNewDepartmentName('');
      setNewDepartmentDivisionId('');
      toast.success('Department created successfully');
      syncOrgUnits();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create department');
    } finally {
      setCreatingDepartment(false);
    }
  };

  const handleEditDepartment = (dept: any) => {
    setEditingDepartmentId(dept.id);
    setEditingDepartmentName(dept.name);
    setEditingDepartmentDivisionId(dept.division_id || '');
  };

  const handleSaveDepartment = async (id: string) => {
    if (!editingDepartmentName.trim()) {
      toast.error('Department name is required');
      return;
    }
    setUpdatingDepartment(id);
    try {
      await updateDepartment(id, { 
        name: editingDepartmentName.trim(),
        division_id: editingDepartmentDivisionId && editingDepartmentDivisionId !== 'none' ? editingDepartmentDivisionId : null,
      });
      setEditingDepartmentId(null);
      setEditingDepartmentName('');
      setEditingDepartmentDivisionId('');
      toast.success('Department updated successfully');
      syncOrgUnits();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update department');
    } finally {
      setUpdatingDepartment(null);
    }
  };

  const handleCancelDepartment = () => {
    setEditingDepartmentId(null);
    setEditingDepartmentName('');
    setEditingDepartmentDivisionId('');
  };

  const handleDeleteDepartment = async (id: string, name: string) => {
    if (!confirm(`Delete department "${name}"? This cannot be undone.`)) return;
    setDeletingDepartment(id);
    try {
      await deleteDepartment(id);
      toast.success('Department deleted successfully');
      syncOrgUnits();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete department');
    } finally {
      setDeletingDepartment(null);
    }
  };

  const handleRefreshAll = async () => {
    await Promise.all([refetchDivisions(), refetchDepartments()]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Division & Department Management</CardTitle>
            <CardDescription>
              Manage organizational units and keep dropdowns in sync
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefreshAll} disabled={divisionsLoading || departmentsLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${(divisionsLoading || departmentsLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Divisions Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Divisions
            </Badge>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Enter division name..."
              value={newDivisionName}
              onChange={(e) => setNewDivisionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateDivision()}
            />
            <Button onClick={handleCreateDivision} disabled={creatingDivision}>
              {creatingDivision ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Division Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {divisions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No divisions found.</TableCell>
                </TableRow>
              ) : (
                divisions.map((division) => (
                  <TableRow key={division.id}>
                    <TableCell>
                      {editingDivisionId === division.id ? (
                        <Input
                          value={editingDivisionName}
                          onChange={(e) => setEditingDivisionName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveDivision(division.id)}
                        />
                      ) : (
                        <span className="font-medium">{division.name}</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(division.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingDivisionId === division.id ? (
                          <>
                            <Button size="sm" onClick={() => handleSaveDivision(division.id)} disabled={updatingDivision === division.id}>
                              {updatingDivision === division.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelDivision} disabled={updatingDivision === division.id}>
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleEditDivision(division)} disabled={updatingDivision === division.id || deletingDivision === division.id}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteDivision(division.id, division.name)} disabled={updatingDivision === division.id || deletingDivision === division.id} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              {deletingDivision === division.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Departments Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" /> Departments
            </Badge>
          </div>

          {/* Create department */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input
              placeholder="Enter department name..."
              value={newDepartmentName}
              onChange={(e) => setNewDepartmentName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateDepartment()}
            />
            <Select value={newDepartmentDivisionId} onValueChange={setNewDepartmentDivisionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select division (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {divisions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreateDepartment} disabled={creatingDepartment}>
              {creatingDepartment ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Filter departments */}
          <div className="flex items-center gap-2">
            <Select value={filterDivisionId} onValueChange={setFilterDivisionId}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Filter by division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                <SelectItem value="none">Unassigned</SelectItem>
                {divisions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setFilterDivisionId('all')}>Reset</Button>
          </div>

          {/* Departments table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department Name</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No departments found.</TableCell>
                </TableRow>
              ) : (
                filteredDepartments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>
                      {editingDepartmentId === dept.id ? (
                        <Input
                          value={editingDepartmentName}
                          onChange={(e) => setEditingDepartmentName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveDepartment(dept.id)}
                        />
                      ) : (
                        <span className="font-medium">{dept.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingDepartmentId === dept.id ? (
                        <Select value={editingDepartmentDivisionId} onValueChange={setEditingDepartmentDivisionId}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select division" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {divisions.map((d) => (
                              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-muted-foreground">{divisions.find(d => d.id === dept.division_id)?.name || '—'}</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(dept.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingDepartmentId === dept.id ? (
                          <>
                            <Button size="sm" onClick={() => handleSaveDepartment(dept.id)} disabled={updatingDepartment === dept.id}>
                              {updatingDepartment === dept.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelDepartment} disabled={updatingDepartment === dept.id}>
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleEditDepartment(dept)} disabled={updatingDepartment === dept.id || deletingDepartment === dept.id}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteDepartment(dept.id, dept.name)} disabled={updatingDepartment === dept.id || deletingDepartment === dept.id} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              {deletingDepartment === dept.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};