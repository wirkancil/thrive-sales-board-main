import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface RoleBasedFiltersProps {
  userRole: 'account_manager' | 'head' | 'manager' | 'admin';
  availableHeads?: {
    id: string;
    name: string;
  }[];
  availableManagers?: {
    id: string;
    name: string;
  }[];
  availableReps: {
    id: string;
    name: string;
  }[];
  selectedRep?: string;
  selectedHead?: string;
  selectedManager?: string;
  onRepChange: (repId: string) => void;
  onHeadChange?: (headId: string) => void;
  onManagerChange?: (managerId: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export const RoleBasedFilters = ({
  userRole,
  availableReps,
  availableHeads,
  availableManagers,
  selectedRep,
  selectedHead,
  selectedManager,
  onRepChange,
  onHeadChange,
  onManagerChange,
  onRefresh,
  loading = false
}: RoleBasedFiltersProps) => {
  // Field Sales Staff don't need filters - they only see their own data
  if (userRole === 'account_manager') {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Rep filter for operational and strategic leaders */}
            {availableReps.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Field Sales Staff</label>
                <Select value={selectedRep || "all"} onValueChange={onRepChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Field Sales Staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Field Sales Staff</SelectItem>
                    {availableReps.filter(rep => rep.id && rep.id.trim() !== '').map(rep => (
                      <SelectItem key={rep.id} value={rep.id}>
                        {rep.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Head filter for heads */}
            {userRole === 'head' && availableHeads && availableHeads.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Level Head</label>
                <Select value={selectedHead || "all"} onValueChange={onHeadChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Level Heads" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Level Heads</SelectItem>
                    {availableHeads.filter(head => head.id && head.id.trim() !== '').map(head => (
                      <SelectItem key={head.id} value={head.id}>
                        {head.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Manager filter for managers */}
            {userRole === 'manager' && availableManagers && availableManagers.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Level Manager</label>
                <Select value={selectedManager || "all"} onValueChange={onManagerChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Level Managers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Level Managers</SelectItem>
                    {availableManagers.filter(manager => manager.id && manager.id.trim() !== '').map(manager => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};