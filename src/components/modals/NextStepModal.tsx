import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Target } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/constants";

// Tipe union untuk nama stage yang valid (sesuai enum Supabase)
type StageText =
  | 'Prospecting'
  | 'Qualification'
  | 'Approach/Discovery'
  | 'Presentation/POC'
  | 'Proposal/Negotiation'
  | 'Closed Won'
  | 'Closed Lost';

// Bentuk literal yang dipakai kolom DB (memakai spasi di sekitar '/')
type DbStageText =
  | 'Prospecting'
  | 'Qualification'
  | 'Approach/Discovery'
  | 'Presentation / POC'
  | 'Proposal / Negotiation'
  | 'Closed Won'
  | 'Closed Lost';

// Helper untuk normalisasi nama stage agar konsisten dengan tipe union
const normalizeStageName = (name: string): StageText => {
  const lower = (name || '').trim().toLowerCase();
  switch (lower) {
    case 'prospecting':
      return 'Prospecting';
    case 'qualification':
      return 'Qualification';
    case 'discovery':
      return 'Approach/Discovery';
    case 'approach/discovery':
      return 'Approach/Discovery';
    case 'presentation/poc':
    case 'presentation / poc':
      return 'Presentation/POC';
    case 'proposal/negotiation':
    case 'proposal / negotiation':
      return 'Proposal/Negotiation';
    case 'closed won':
      return 'Closed Won';
    case 'closed lost':
      return 'Closed Lost';
    default:
      return 'Prospecting';
  }
};

// Konversi nama kanonik ke literal DB
const toDbStageLiteral = (stage: StageText): DbStageText => {
  switch (stage) {
    case 'Presentation/POC':
      return 'Presentation / POC';
    case 'Proposal/Negotiation':
      return 'Proposal / Negotiation';
    default:
      return stage as DbStageText;
  }
};

// Urutan sederhana untuk Next Step
const STAGE_ORDER: StageText[] = ['Qualification', 'Approach/Discovery', 'Presentation/POC'];

interface NextStepModalProps {
  opportunityId: string;
  opportunityName: string;
  currentNextStep?: string | null;
  currentDueDate?: string | null;
  onSuccess: () => void;
}

interface OpportunityDetails {
  id: string;
  name: string;
  amount: number;
  currency: string;
  stage: string;
  expected_close_date: string;
  probability: number;
  customer_name?: string;
  qualification_details?: string | null;
  approach_discovery_details?: string | null;
  presentation_poc_details?: string | null;
}

export function NextStepModal({ 
  opportunityId, 
  opportunityName, 
  currentNextStep, 
  currentDueDate,
  onSuccess 
}: NextStepModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nextStepTitle, setNextStepTitle] = useState(currentNextStep || "");
  const [stageDetails, setStageDetails] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    currentDueDate ? new Date(currentDueDate) : undefined
  );
  const [opportunityDetails, setOpportunityDetails] = useState<OpportunityDetails | null>(null);
  const [finalOutcome, setFinalOutcome] = useState<'Closed Won' | 'Closed Lost'>('Closed Won');

  useEffect(() => {
    if (open) {
      fetchOpportunityDetails();
    }
  }, [open]);

  const fetchOpportunityDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          customer:organizations!customer_id(name)
        `)
        .eq('id', opportunityId)
        .single();

      if (error) throw error;

      setOpportunityDetails({
        id: data.id,
        name: data.name,
        amount: data.amount || 0,
        currency: data.currency || 'USD',
        stage: data.stage || '',
        expected_close_date: data.expected_close_date || '',
        probability: data.probability || 0,
        customer_name: data.customer?.name,
        qualification_details: data.qualification_details || null,
        approach_discovery_details: data.approach_discovery_details || null,
        presentation_poc_details: data.presentation_poc_details || null
      });
    } catch (error) {
      console.error('Error fetching opportunity details:', error);
    }
  };

  const getStageSuggestions = (stage: StageText) => {
    switch (stage) {
      case 'Prospecting':
        return [
          'Need',
          'Budget/Timeline',
          'Buying Roles Known'
        ];
      case 'Qualification':
        return [
          'Confirm need',
          'Budget & timeline confirmed',
          'Buying roles identified'
        ];
      case 'Approach/Discovery':
        return [
          'Decision process mapped',
          'Decision criteria set',
          'Champion identified'
        ];
      case 'Presentation/POC':
        return [
          'Demo/POC done',
          'Success metrics agreed',
          'Readout scheduled'
        ];
      case 'Proposal/Negotiation':
        return [
          'Proposal sent',
          'Confirm decision date',
          'Negotiate terms'
        ];
      default:
        return [];
    }
  };

  const getStageDetailsPlaceholder = (stage: StageText) => {
    switch (stage) {
      case 'Prospecting':
        return 'e.g., Need; Budget/Timeline; Buying Roles Known';
      case 'Qualification':
        return 'e.g., Confirm need; budget & timeline; buying roles known';
      case 'Approach/Discovery':
        return 'e.g., Decision process/criteria mapped; champion identified';
      case 'Presentation/POC':
        return 'e.g., Demo/POC done; success metrics agreed; readout scheduled';
      case 'Proposal/Negotiation':
        return 'e.g., Proposal sent; decision date; terms discussed';
      default:
        return 'Enter stage-specific details';
    }
  };

  // Tentukan stage berikutnya untuk tampilan UI pada Next Step
  const getNextStageForUI = (current: StageText): StageText => {
    if (current === 'Presentation/POC') {
      return 'Proposal/Negotiation';
    }
    const idx = STAGE_ORDER.indexOf(current);
    return idx >= 0 && idx < STAGE_ORDER.length - 1
      ? STAGE_ORDER[idx + 1]
      : 'Qualification';
  };

  // Bangun label tampilan untuk stage berikutnya (gunakan "Discovery" untuk Approach/Discovery)
  const getDisplayLabelForNextStage = (next: StageText): string => {
    if (next === 'Approach/Discovery') return 'Discovery Details';
    return `${next} Details`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Sederhanakan: hilangkan validasi wajib. Gunakan default aman.
    const detailsToSave = (stageDetails.trim() || nextStepTitle.trim() || 'Next step planned');
    // Jangan default ke hari ini jika user tidak memilih due date.
    // Hanya kirim next_step_due_date bila dueDate dipilih.
    const dueDateISO = dueDate ? dueDate.toISOString() : undefined;
    const dueDateDateOnly = dueDateISO ? dueDateISO.split('T')[0] : undefined;

    setLoading(true);
    try {
      // Update opportunity with next step
      // Bangun payload update secara kondisional agar tidak menimpa due date jika tidak dipilih
      const updatePayload: any = {
        next_step_title: nextStepTitle.trim() || stageDetails.trim() || 'Next step planned',
        updated_at: new Date().toISOString()
      };
      if (dueDateDateOnly) {
        updatePayload.next_step_due_date = dueDateDateOnly;
      }

      const { error: oppError } = await supabase
        .from('opportunities')
        .update(updatePayload)
        .eq('id', opportunityId);

      if (oppError) throw oppError;

      // Create activity record
      // Buat activity dengan due_at hanya bila due date dipilih
      const activityPayload: any = {
        opportunity_id: opportunityId,
        subject: `Next Step: ${nextStepTitle || opportunityDetails?.stage || 'Stage'}`,
        description: detailsToSave,
        status: 'open',
        created_by: (await supabase.auth.getUser()).data.user?.id
      };
      if (dueDateISO) {
        activityPayload.due_at = dueDateISO;
      }

      const { error: activityError } = await supabase
        .from('activities')
        .insert(activityPayload);

      if (activityError) throw activityError;

      let advanced = false;
      // Sederhanakan: langsung update kolom teks stage berdasarkan urutan tetap
      try {
        const currentStageRaw = opportunityDetails?.stage || 'Qualification';
        const currentStage = normalizeStageName(currentStageRaw);
        let nextStageText: StageText;
        if (currentStage === 'Presentation/POC') {
          // Advance sederhana: dari POC ke Proposal/Negotiation
          nextStageText = 'Proposal/Negotiation';
        } else {
          const idx = STAGE_ORDER.indexOf(currentStage);
          nextStageText = idx >= 0 && idx < STAGE_ORDER.length - 1
            ? STAGE_ORDER[idx + 1]
            : 'Qualification';
        }

        const updateTextPayload: any = {
          stage: toDbStageLiteral(nextStageText),
          updated_at: new Date().toISOString()
        };
        // Gabungkan detail baru ke detail yang sudah ada agar tidak menimpa
        const appendDetailsText = (existing: string | null | undefined, incoming: string) => {
          const cleanIncoming = incoming.trim();
          const base = (existing || '').trim();
          if (!cleanIncoming) return base;
          if (!base) return cleanIncoming;
          // Hindari duplikasi sederhana
          if (base.includes(cleanIncoming)) return base;
          return `${base}\n${cleanIncoming}`;
        };

        if (nextStageText === 'Qualification') {
          updateTextPayload.qualification_details = appendDetailsText(opportunityDetails?.qualification_details, detailsToSave);
        } else if (nextStageText === 'Approach/Discovery') {
          updateTextPayload.approach_discovery_details = appendDetailsText(opportunityDetails?.approach_discovery_details, detailsToSave);
        } else if (nextStageText === 'Presentation/POC') {
          updateTextPayload.presentation_poc_details = appendDetailsText(opportunityDetails?.presentation_poc_details, detailsToSave);
        }

        const { error: updateErr } = await supabase
          .from('opportunities')
          .update(updateTextPayload)
          .eq('id', opportunityId);

        if (!updateErr) {
          advanced = true;
        } else {
          console.warn('Simple text stage update error:', updateErr.message);
          // Fallback minimal: coba update stage_id ke next stage berdasarkan pipeline
          try {
            const { data: oppInfo } = await supabase
              .from('opportunities')
              .select('stage_id, pipeline_id')
              .eq('id', opportunityId)
              .maybeSingle();

            if (oppInfo?.pipeline_id) {
              // Kandidat nama stage (gunakan literal DB agar cocok dengan tipe Supabase)
              const namesForMatch: string[] = (() => {
                switch (nextStageText) {
                  case 'Approach/Discovery':
                    return ['Approach/Discovery', 'Discovery'];
                  case 'Presentation/POC':
                    return ['Presentation / POC'];
                  case 'Proposal/Negotiation':
                    return ['Proposal / Negotiation'];
                  default:
                    return [toDbStageLiteral(nextStageText)];
                }
              })();

              const { data: nextStageRow } = await supabase
                .from('pipeline_stages')
                .select('id, name, default_probability')
                .eq('pipeline_id', oppInfo.pipeline_id)
                .in('name', namesForMatch)
                .order('sort_order')
                .maybeSingle();

              if (nextStageRow?.id) {
                const { error: upd2 } = await supabase
                  .from('opportunities')
                  .update({
                    stage_id: nextStageRow.id,
                    stage: toDbStageLiteral(normalizeStageName(nextStageRow.name)),
                    probability: nextStageRow.default_probability,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', opportunityId);
                if (!upd2) {
                  advanced = true;
                } else {
                  console.warn('Fallback stage_id update error:', upd2.message);
                }
              }
            }
          } catch (fbEx: any) {
            console.warn('Fallback minimal exception:', fbEx?.message || fbEx);
          }
        }
      } catch (advanceEx: any) {
        console.warn('Simple stage advance exception:', advanceEx?.message || advanceEx);
      }

      toast.success(advanced 
        ? "Next step saved — stage advanced"
        : "Next step saved");
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating next step:', error);
      toast.error("Failed to update next step");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNextStepTitle(currentNextStep || "");
    setStageDetails("");
    setDueDate(currentDueDate ? new Date(currentDueDate) : undefined);
    setOpen(false);
  };

  // Tambahkan saran sebagai item baru per baris (akumulatif)
  const insertSuggestion = (suggestion: string) => {
    const normalized = suggestion.trim();
    const lines = stageDetails.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (lines.includes(normalized)) {
      return; // Jangan duplikasi
    }
    const prefix = stageDetails.trim().length > 0 ? "\n" : "";
    setStageDetails((stageDetails.trim() + prefix + normalized).trim());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs">
          <Target className="w-3 h-3 mr-1" />
          Next Step
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Set Next Step</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Opportunity Details */}
          {opportunityDetails && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Opportunity</h3>
                <Badge variant="secondary">
                  {Math.round(opportunityDetails.probability * 100)}%
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <div className="font-medium">{opportunityDetails.customer_name || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <div className="font-medium">{formatCurrency(opportunityDetails.amount, opportunityDetails.currency)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Expected Close:</span>
                  <div className="font-medium">
                    {opportunityDetails.expected_close_date ? 
                      new Date(opportunityDetails.expected_close_date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Stage:</span>
                  <div className="font-medium">{opportunityDetails.stage}</div>
                </div>
              </div>
            </div>
          )}

          {/* Stage Details */}
          {/* Stage History - tampilkan akumulasi detail dari stage sebelumnya */}
          {opportunityDetails && (
            <div className="space-y-3">
              {(opportunityDetails.qualification_details || opportunityDetails.approach_discovery_details || opportunityDetails.presentation_poc_details) && (
                <div className="space-y-2">
                  <Label className="text-sm">Stage History</Label>
                  <div className="space-y-2">
                    {opportunityDetails.qualification_details && (
                      <div className="border rounded p-2 bg-muted/20">
                        <div className="text-xs font-medium mb-1">Qualification Details</div>
                        <div className="text-sm bg-white p-2 rounded border space-y-1">
                          {opportunityDetails.qualification_details.split(/\r?\n/).map((item, idx) => (
                            item.trim() ? <div key={`q-${idx}`}>{item.trim()}</div> : null
                          ))}
                        </div>
                      </div>
                    )}
                    {opportunityDetails.approach_discovery_details && (
                      <div className="border rounded p-2 bg-muted/20">
                        <div className="text-xs font-medium mb-1">Discovery Details</div>
                        <div className="text-sm bg-white p-2 rounded border space-y-1">
                          {opportunityDetails.approach_discovery_details.split(/\r?\n/).map((item, idx) => (
                            item.trim() ? <div key={`ad-${idx}`}>{item.trim()}</div> : null
                          ))}
                        </div>
                      </div>
                    )}
                    {opportunityDetails.presentation_poc_details && (
                      <div className="border rounded p-2 bg-muted/20">
                        <div className="text-xs font-medium mb-1">Presentation/POC Details</div>
                        <div className="text-sm bg-white p-2 rounded border space-y-1">
                          {opportunityDetails.presentation_poc_details.split(/\r?\n/).map((item, idx) => (
                            item.trim() ? <div key={`pp-${idx}`}>{item.trim()}</div> : null
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="stageDetails">
              {opportunityDetails
                ? getDisplayLabelForNextStage(getNextStageForUI(normalizeStageName(opportunityDetails.stage)))
                : 'Stage Details'}
            </Label>
          <Textarea
            id="stageDetails"
            value={stageDetails}
            onChange={(e) => setStageDetails(e.target.value)}
            placeholder={opportunityDetails
                ? getStageDetailsPlaceholder(getNextStageForUI(normalizeStageName(opportunityDetails.stage))) + ' — add multiple items on separate lines (optional)'
                : 'Enter stage-specific details — multiple items per line (optional)'}
            rows={4}
          />
          </div>

          {/* Final Outcome (muncul hanya di Presentation/POC) */}
          {normalizeStageName(opportunityDetails?.stage || '') === 'Presentation/POC' && (
            <div className="space-y-2">
              <Label className="text-sm">Final Result</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={finalOutcome === 'Closed Won' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFinalOutcome('Closed Won')}
                >
                  Closed Won
                </Button>
                <Button
                  type="button"
                  variant={finalOutcome === 'Closed Lost' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setFinalOutcome('Closed Lost')}
                >
                  Closed Lost
                </Button>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {opportunityDetails && getStageSuggestions(
            getNextStageForUI(normalizeStageName(opportunityDetails.stage))
          ).length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Suggestions (tap to insert):</Label>
              <div className="flex flex-wrap gap-2">
                {getStageSuggestions(
                  getNextStageForUI(normalizeStageName(opportunityDetails.stage))
                ).map((suggestion, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => insertSuggestion(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Saving..." : "Save Next Step"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}