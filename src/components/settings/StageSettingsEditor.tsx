import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface StageSetting {
  id: string;
  stage_key: string;
  default_due_days: number;
  points: number;
}

const STAGE_LABELS: Record<string, string> = {
  prospecting: "Prospecting",
  qualification: "Qualification",
  discovery: "Discovery",
  presentation: "Presentation",
  proposal: "Proposal",
  closed: "Closed",
};

export const StageSettingsEditor = () => {
  const [settings, setSettings] = useState<StageSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("stage_settings")
        .select("*")
        .is("org_id", null)
        .order("stage_key");

      if (error) throw error;
      setSettings(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (id: string, field: "default_due_days" | "points", value: number) => {
    setSettings(settings.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = settings.map(setting => ({
        id: setting.id,
        default_due_days: setting.default_due_days,
        points: setting.points,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("stage_settings")
          .update(update)
          .eq("id", update.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Stage settings updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stage Settings</CardTitle>
        <CardDescription>
          Configure default SLA days and points for each stage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {settings.map((setting) => (
          <div key={setting.id} className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
            <div className="col-span-3">
              <h3 className="font-semibold">{STAGE_LABELS[setting.stage_key] || setting.stage_key}</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`days-${setting.id}`}>Default Days</Label>
              <Input
                id={`days-${setting.id}`}
                type="number"
                min="0"
                value={setting.default_due_days}
                onChange={(e) => handleUpdate(setting.id, "default_due_days", parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`points-${setting.id}`}>Points</Label>
              <Input
                id={`points-${setting.id}`}
                type="number"
                min="0"
                value={setting.points}
                onChange={(e) => handleUpdate(setting.id, "points", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        ))}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
