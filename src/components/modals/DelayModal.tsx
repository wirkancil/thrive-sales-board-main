import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DelayModalProps {
  opportunityId: string;
  currentReason?: string | null;
  currentDueDate?: string | null;
  onSuccess: () => void;
}

export function DelayModal({ opportunityId, currentReason, currentDueDate, onSuccess }: DelayModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<string>(extractReason(currentReason || ""));
  const [dueDate, setDueDate] = useState<Date | undefined>(currentDueDate ? new Date(currentDueDate) : undefined);

  function extractReason(title: string) {
    const t = (title || "").trim();
    if (t.toLowerCase().startsWith("delay:")) {
      return t.substring(6).trim();
    }
    return "";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() && !dueDate) {
      toast.warning("Isi reason atau pilih due date");
      return;
    }

    const delayTitle = reason.trim() ? `Delay: ${reason.trim()}` : undefined;
    const dueDateISO = dueDate ? dueDate.toISOString() : undefined;
    const dueDateDateOnly = dueDateISO ? dueDateISO.split("T")[0] : undefined;

    setLoading(true);
    try {
      const updatePayload: any = { updated_at: new Date().toISOString() };
      if (delayTitle) updatePayload.next_step_title = delayTitle;
      if (dueDateDateOnly) updatePayload.next_step_due_date = dueDateDateOnly;

      const { error: oppErr } = await supabase
        .from("opportunities")
        .update(updatePayload)
        .eq("id", opportunityId);
      if (oppErr) throw oppErr;

      const activityPayload: any = {
        opportunity_id: opportunityId,
        subject: delayTitle ? delayTitle : "Delay",
        description: delayTitle || "Delay applied",
        status: "open",
        created_by: (await supabase.auth.getUser()).data.user?.id,
      };
      if (dueDateISO) activityPayload.due_at = dueDateISO;

      const { error: actErr } = await supabase.from("activities").insert(activityPayload);
      if (actErr) throw actErr;

      toast.success("Delay disimpan");
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      console.error("Error saving delay:", err?.message || err);
      toast.error("Gagal menyimpan delay");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs text-amber-700 hover:bg-amber-50 border-amber-200">
          Delay
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delay Opportunity</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Reason</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan alasan delay"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Due Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "dd MMM yyyy") : "Pilih tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              Simpan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}