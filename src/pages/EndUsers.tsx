import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search, Plus, Phone, Mail } from "lucide-react";
import AddEndUserModal from "@/components/modals/AddEndUserModal";
import { toast } from "@/hooks/use-toast";

const EndUsers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: endUsers, isLoading, refetch } = useQuery({
    queryKey: ["end-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("type", "end_user")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredEndUsers = endUsers?.filter((endUser) =>
    endUser.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    endUser.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">End Users</h1>
          <p className="text-muted-foreground">Manage your end user accounts</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add End User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search end users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredEndUsers && filteredEndUsers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEndUsers.map((endUser) => (
                <Card key={endUser.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <UserPlus className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{endUser.name}</h3>
                        {endUser.industry && (
                          <Badge variant="secondary" className="mt-1">
                            {endUser.industry}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      {endUser.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{endUser.phone}</span>
                        </div>
                      )}
                      {endUser.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{endUser.email}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No end users found" : "No end users yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AddEndUserModal
        isOpen={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={() => {
          refetch();
          toast({
            title: "Success",
            description: "End user created successfully",
          });
        }}
      />
    </div>
  );
};

export default EndUsers;
