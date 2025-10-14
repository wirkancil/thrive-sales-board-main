import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Save, X, RefreshCw, Trash2 } from 'lucide-react';
import { useTitles } from '@/hooks/useTitles';
import { toast } from 'sonner';

export const TitleManagement = () => {
  const { titles, loading, createTitle, updateTitle, deleteTitle, refetch } = useTitles();
  const [newTitleName, setNewTitleName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newTitleName.trim()) {
      toast.error('Title name is required');
      return;
    }

    setCreating(true);
    try {
      await createTitle(newTitleName.trim());
      setNewTitleName('');
      toast.success('Title created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create title');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (title: any) => {
    setEditingId(title.id);
    setEditingName(title.name);
  };

  const handleSave = async (id: string) => {
    if (!editingName.trim()) {
      toast.error('Title name is required');
      return;
    }

    setUpdating(id);
    try {
      await updateTitle(id, { name: editingName.trim() });
      setEditingId(null);
      setEditingName('');
      toast.success('Title updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update title');
    } finally {
      setUpdating(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    setUpdating(id);
    try {
      await updateTitle(id, { is_active: !isActive });
      toast.success(isActive ? 'Title deactivated' : 'Title activated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update title status');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the title "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(id);
    try {
      const result = await deleteTitle(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Title deleted successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete title');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Title Management</CardTitle>
            <CardDescription>
              Manage job titles for user profiles
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new title */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter new title name..."
            value={newTitleName}
            onChange={(e) => setNewTitleName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Titles table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {titles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No titles found. Create your first title above.
                  </TableCell>
                </TableRow>
              ) : (
                titles.map((title) => (
                  <TableRow key={title.id}>
                    <TableCell>
                      {editingId === title.id ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSave(title.id)}
                        />
                      ) : (
                        <span className="font-medium">{title.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={title.is_active ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleToggleActive(title.id, title.is_active)}
                      >
                        {title.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(title.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingId === title.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleSave(title.id)}
                              disabled={updating === title.id}
                            >
                              {updating === title.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                              disabled={updating === title.id}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(title)}
                              disabled={updating === title.id || deleting === title.id}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(title.id, title.name)}
                              disabled={updating === title.id || deleting === title.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {deleting === title.id ? (
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