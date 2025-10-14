import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Save, X, RefreshCw, Trash2 } from 'lucide-react';
import { useRegions } from '@/hooks/useRegions';
import { toast } from 'sonner';

export const RegionManagement = () => {
  const { regions, loading, createRegion, updateRegion, deleteRegion, refetch } = useRegions();
  const [newRegionName, setNewRegionName] = useState('');
  const [newRegionCode, setNewRegionCode] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingCode, setEditingCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newRegionName.trim() || !newRegionCode.trim()) {
      toast.error('Region name and code are required');
      return;
    }

    setCreating(true);
    try {
      await createRegion(newRegionName.trim(), newRegionCode.trim().toUpperCase());
      setNewRegionName('');
      setNewRegionCode('');
      toast.success('Region created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create region');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (region: any) => {
    setEditingId(region.id);
    setEditingName(region.name);
    setEditingCode(region.code);
  };

  const handleSave = async (id: string) => {
    if (!editingName.trim() || !editingCode.trim()) {
      toast.error('Region name and code are required');
      return;
    }

    setUpdating(id);
    try {
      await updateRegion(id, { 
        name: editingName.trim(),
        code: editingCode.trim().toUpperCase()
      });
      setEditingId(null);
      setEditingName('');
      setEditingCode('');
      toast.success('Region updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update region');
    } finally {
      setUpdating(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingName('');
    setEditingCode('');
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    setUpdating(id);
    try {
      await updateRegion(id, { is_active: !isActive });
      toast.success(isActive ? 'Region deactivated' : 'Region activated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update region status');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the region "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(id);
    try {
      const result = await deleteRegion(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Region deleted successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete region');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Region Management</CardTitle>
            <CardDescription>
              Manage geographical regions for user profiles
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new region */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter region name..."
            value={newRegionName}
            onChange={(e) => setNewRegionName(e.target.value)}
            className="flex-2"
          />
          <Input
            placeholder="Code"
            value={newRegionCode}
            onChange={(e) => setNewRegionCode(e.target.value.toUpperCase())}
            className="flex-1 max-w-[100px]"
            maxLength={6}
          />
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Regions table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Region Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No regions found. Create your first region above.
                  </TableCell>
                </TableRow>
              ) : (
                regions.map((region) => (
                  <TableRow key={region.id}>
                    <TableCell>
                      {editingId === region.id ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                        />
                      ) : (
                        <span className="font-medium">{region.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === region.id ? (
                        <Input
                          value={editingCode}
                          onChange={(e) => setEditingCode(e.target.value.toUpperCase())}
                          className="max-w-[80px]"
                          maxLength={6}
                        />
                      ) : (
                        <Badge variant="outline" className="font-mono">
                          {region.code}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={region.is_active ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleToggleActive(region.id, region.is_active)}
                      >
                        {region.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(region.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingId === region.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleSave(region.id)}
                              disabled={updating === region.id}
                            >
                              {updating === region.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                              disabled={updating === region.id}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(region)}
                              disabled={updating === region.id || deleting === region.id}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(region.id, region.name)}
                              disabled={updating === region.id || deleting === region.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {deleting === region.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
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
        )}
      </CardContent>
    </Card>
  );
};