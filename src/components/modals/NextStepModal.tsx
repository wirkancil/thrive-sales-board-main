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
  | 'Discovery'
  | 'Presentation/POC'
  | 'Negotiation'
  | 'Closed Won'
  | 'Closed Lost';

// Bentuk literal yang dipakai kolom DB (memakai spasi di sekitar '/')
// Nilai literal yang digunakan kolom enum di DB (stage_enum)
// Per enum saat ini: menggunakan 'Approach/Discovery' dan 'Proposal/Negotiation'
type DbStageText =
  | 'Prospecting'
  | 'Qualification'
  | 'Approach/Discovery'
  | 'Presentation/POC'
  | 'Proposal/Negotiation'
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
    case 'approach/discovery':
      return 'Discovery';
    case 'presentation/poc':
    case 'presentation / poc':
      return 'Presentation/POC';
    case 'negotiation':
    case 'proposal/negotiation':
    case 'proposal / negotiation':
    case 'proposal':
      return 'Negotiation';
    case 'closed won':
    case 'won':
      return 'Closed Won';
    case 'closed lost':
    case 'lost':
      return 'Closed Lost';
    default:
      return 'Prospecting';
  }
};

// Konversi nama kanonik ke literal DB
const toDbStageLiteral = (stage: StageText): DbStageText => {
  switch (stage) {
    case 'Discovery':
      return 'Approach/Discovery';
    case 'Negotiation':
      return 'Proposal/Negotiation';
    default:
      return stage as DbStageText;
  }
};

// Urutan sederhana untuk Next Step
const STAGE_ORDER: StageText[] = ['Prospecting', 'Qualification', 'Discovery', 'Presentation/POC', 'Negotiation'];

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
  prospecting_details?: string | null;
  negotiation_details?: string | null;
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

      // Supabase generated types may not yet include newly added columns
      // like prospecting_details and negotiation_details. Use a safe cast
      // to access these optional fields without TypeScript errors.
      const row: any = data as any;

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
        presentation_poc_details: data.presentation_poc_details || null,
        prospecting_details: row?.prospecting_details ?? null,
        negotiation_details: row?.negotiation_details ?? null
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
      case 'Discovery':
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
      case 'Negotiation':
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
      case 'Discovery':
        return 'e.g., Decision process/criteria mapped; champion identified';
      case 'Presentation/POC':
        return 'e.g., Demo/POC done; success metrics agreed; readout scheduled';
      case 'Negotiation':
        return 'e.g., Proposal sent; decision date; terms discussed';
      default:
        return 'Enter stage-specific details';
    }
  };

  // Tentukan stage berikutnya untuk tampilan UI pada Next Step
const getNextStageForUI = (current: StageText): StageText => {
  // Khusus: dari Presentation/POC lanjut ke Negotiation
  if (current === 'Presentation/POC') return 'Negotiation';
  // Di Negotiation tidak ada next stage; tetap tampilkan placeholder Negotiation
  if (current === 'Negotiation') return 'Negotiation';
  const idx = STAGE_ORDER.indexOf(current);
  return idx >= 0 && idx < STAGE_ORDER.length - 1
    ? STAGE_ORDER[idx + 1]
    : 'Qualification';
};

  // Bangun label tampilan untuk stage berikutnya (gunakan "Discovery" untuk Approach/Discovery)
  const getDisplayLabelForNextStage = (next: StageText): string => {
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
      try {
        const activityPayload: any = {
          activity_type: 'next_step', // Required field - set default value
          opportunity_id: opportunityId,
          subject: `Next Step: ${nextStepTitle || opportunityDetails?.stage || 'Stage'}`,
          description: detailsToSave,
          status: 'open',
          created_by: (await supabase.auth.getUser()).data.user?.id
        };
        if (dueDateISO) {
          activityPayload.due_at = dueDateISO;
        }

        // Coba insert dengan due_at jika tersedia; jika kolom due_at belum ada, fallback ke scheduled_at
        let { error: activityError } = await (supabase as any)
          .from('sales_activities')
          .insert(activityPayload);

        if (activityError) {
          const msg = (activityError as any)?.message || '';
          const code = (activityError as any)?.code || '';
          // Jika PostgREST mengeluh kolom due_at tidak ditemukan, ulangi tanpa due_at dan gunakan scheduled_at
          if (code === 'PGRST204' || msg.toLowerCase().includes('due_at') || msg.toLowerCase().includes('schema cache')) {
            try {
              if (dueDateISO) {
                // Pindahkan nilai due_at ke scheduled_at dan hapus due_at
                delete activityPayload.due_at;
                activityPayload.scheduled_at = dueDateISO;
              }
              // Ensure activity_type is still set after payload modification
              activityPayload.activity_type = 'next_step';
              const { error: retryError } = await (supabase as any)
                .from('sales_activities')
                .insert(activityPayload);
              if (retryError) {
                const retryMsg = (retryError as any)?.message || '';
                const retryCode = (retryError as any)?.code || '';
                if (retryCode === '42501' || retryMsg.toLowerCase().includes('row-level security') || retryMsg.toLowerCase().includes('policy')) {
                  console.warn('Activity insert blocked by RLS after retry, skipping activity log:', retryMsg || retryCode);
                } else {
                  console.warn('Activity insert failed after retry, skipping activity log:', retryMsg || retryCode);
                }
              }
            } catch (retryEx) {
              const retryExMsg = (retryEx as any)?.message || '';
              const retryExCode = (retryEx as any)?.code || '';
              if (retryExCode === '42501' || retryExMsg.toLowerCase().includes('row-level security') || retryExMsg.toLowerCase().includes('policy')) {
                console.warn('Activity insert blocked by RLS in retry catch, skipping activity log:', retryExMsg || retryExCode);
              } else {
                console.warn('Activity insert exception after retry, skipping activity log:', retryExMsg || retryExCode);
              }
            }
          } else if (
            code === '42501' ||
            msg.toLowerCase().includes('row-level security') ||
            msg.toLowerCase().includes('policy')
          ) {
            // RLS menolak insert ke sales_activities; lewati pencatatan activity agar Next Step tetap tersimpan
            console.warn('Activity insert blocked by RLS, skipping activity log:', msg || code);
          } else {
            // Jangan hentikan alur advance stage bila activity gagal; log lalu lanjut
            console.warn('Activity insert failed, skipping activity log:', msg || code);
          }
        }
      } catch (activityCatchError) {
        // Tangkap semua error activity dan skip jika RLS
        const catchMsg = (activityCatchError as any)?.message || '';
        const catchCode = (activityCatchError as any)?.code || '';
        if (catchCode === '42501' || catchMsg.toLowerCase().includes('row-level security') || catchMsg.toLowerCase().includes('policy')) {
          console.warn('Activity insert completely blocked by RLS, skipping activity log:', catchMsg || catchCode);
        } else {
          // Jangan hentikan alur advance stage; log lalu lanjut
          console.warn('Activity insert errored, skipping activity log:', catchMsg || catchCode);
        }
      }

      let advanced = false;
      // Stage advancement logic - move to next stage atau tutup di Negotiation
      try {
        const currentStageRaw = opportunityDetails?.stage || 'Prospecting';
        const currentStage = normalizeStageName(currentStageRaw);
        
        console.log('=== STAGE ADVANCEMENT DEBUG ===');
        console.log('Current stage raw:', currentStageRaw);
        console.log('Current stage normalized:', currentStage);
        
        // Jika sudah di Negotiation, tidak ada next step — langsung tutup ke Closed Won/Lost
          if (currentStage === 'Negotiation') {
            const finalStage: StageText = finalOutcome;
            const finalUpdatePayload: any = {
              stage: finalStage, // literal sama di DB
              status: finalStage === 'Closed Won' ? 'won' : 'lost',
              is_won: finalStage === 'Closed Won',
              is_closed: true,
              expected_close_date: new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString(),
            };

          // Hindari mengirim kolom detail stage yang mungkin tidak ada di DB (negotiation_details)

          // Default probabilitas jika tidak ada default di pipeline_stages
          const fallbackProb = finalStage === 'Closed Won' ? 100 : 0;

          try {
            let stageData: any = null;
            const { data: canonicalStage } = await supabase
              .from('pipeline_stages')
              .select('id, default_probability')
              .eq('name', finalStage)
              .maybeSingle();
            if (canonicalStage?.id) {
              stageData = canonicalStage;
            } else {
              const { data: legacyStage } = await supabase
                .from('pipeline_stages')
                .select('id, default_probability')
                .eq('name', toDbStageLiteral(finalStage))
                .maybeSingle();
              if (legacyStage?.id) stageData = legacyStage;
            }
            if (stageData?.id) {
              finalUpdatePayload.stage_id = stageData.id;
              if (stageData.default_probability !== null && stageData.default_probability !== undefined) {
                finalUpdatePayload.probability = stageData.default_probability;
              } else {
                finalUpdatePayload.probability = fallbackProb;
              }
            } else {
              finalUpdatePayload.probability = fallbackProb;
            }
          } catch (finalStageIdErr) {
            console.warn('Could not fetch final stage_id:', finalStageIdErr);
            finalUpdatePayload.probability = fallbackProb;
          }

          const { error: finalErr } = await supabase
            .from('opportunities')
            .update(finalUpdatePayload)
            .eq('id', opportunityId);

          if (!finalErr) {
            advanced = true;
            console.log('Negotiation closed to', finalStage);
            // Catat activity ringan (optional). Abaikan jika RLS menolak.
            try {
              await (supabase as any)
                .from('sales_activities')
                .insert({
                  activity_type: 'closure',
                  opportunity_id: opportunityId,
                  subject: `Opportunity ${finalStage === 'Closed Won' ? 'Won' : 'Lost'}`,
                  description: `Finalized at Negotiation: ${finalStage}`,
                  status: 'done',
                  created_by: (await supabase.auth.getUser()).data.user?.id
                });
            } catch (closureActErr: any) {
              const msg = closureActErr?.message || '';
              if (msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('policy')) {
                console.warn('Closure activity blocked by RLS, skip log.');
              } else {
                console.warn('Closure activity insert failed:', msg);
              }
            }
          } else {
            console.warn('Finalization update failed:', finalErr.message);
          }
        } else {
          // Alur normal: lanjut ke stage berikutnya
          let nextStageText: StageText;
          if (currentStage === 'Presentation/POC') {
            nextStageText = 'Negotiation';
          } else {
            const idx = STAGE_ORDER.indexOf(currentStage);
            nextStageText = idx >= 0 && idx < STAGE_ORDER.length - 1
              ? STAGE_ORDER[idx + 1]
              : 'Qualification';
          }

          console.log('Next stage text:', nextStageText);
          console.log('Stage order index:', STAGE_ORDER.indexOf(currentStage));

          // Get probability for next stage
          const stageToProb: Record<StageText, number> = {
            // Selaras dengan tampilan Pipeline: 10,10,20,20,20
            'Prospecting': 10,
            'Qualification': 10,
            'Discovery': 20,
            'Presentation/POC': 20,
            'Negotiation': 20,
            'Closed Won': 100,
            'Closed Lost': 0
          };

          const updateTextPayload: any = {
            stage: toDbStageLiteral(nextStageText),
            probability: stageToProb[nextStageText] || 20,
            updated_at: new Date().toISOString()
          };

          console.log('Update payload:', updateTextPayload);

          // Note: intentionally not appending stage detail fields here to avoid
          // Bad Request errors when remote DB lacks these optional columns.

          // First try to update with stage_id lookup
          let stageUpdateSuccess = false;

          // Try to get the stage_id for proper database consistency
          try {
            // Coba cari berdasarkan nama kanonik terlebih dahulu (Discovery/Negotiation)
            let stageData: any = null;
            const { data: canonicalStage } = await supabase
              .from('pipeline_stages')
              .select('id, default_probability')
              .eq('name', nextStageText)
              .maybeSingle();

            if (canonicalStage?.id) {
              stageData = canonicalStage;
            } else {
              // Fallback: cari berdasarkan literal enum di DB (Approach/Discovery, Proposal/Negotiation)
              const { data: legacyStage } = await supabase
                .from('pipeline_stages')
                .select('id, default_probability')
                .eq('name', toDbStageLiteral(nextStageText))
                .maybeSingle();
              if (legacyStage?.id) {
                stageData = legacyStage;
              }
            }

            if (stageData?.id) {
              updateTextPayload.stage_id = stageData.id;
              if (stageData.default_probability !== null && stageData.default_probability !== undefined) {
                updateTextPayload.probability = stageData.default_probability;
              }
            }
          } catch (stageIdError) {
            console.warn('Could not fetch stage_id, proceeding with text update only:', stageIdError);
          }

          const { error: updateErr } = await supabase
            .from('opportunities')
            .update(updateTextPayload)
            .eq('id', opportunityId);

          console.log('Stage update error:', updateErr);

          if (!updateErr) {
            advanced = true;
            console.log('Stage advancement successful!');
          } else {
            console.warn('Stage update failed:', updateErr.message);
            // Try fallback approach dengan stage_id lookup
            try {
              const { data: oppInfo } = await supabase
                .from('opportunities')
                .select('stage_id, pipeline_id')
                .eq('id', opportunityId)
                .maybeSingle();

              if (oppInfo?.pipeline_id) {
                // Look for matching stage in pipeline
                const { data: nextStageRow } = await supabase
                  .from('pipeline_stages')
                  .select('id, name, default_probability')
                  .eq('pipeline_id', oppInfo.pipeline_id)
                  .eq('name', toDbStageLiteral(nextStageText))
                  .maybeSingle();

                if (nextStageRow?.id) {
                  const { error: fallbackError } = await supabase
                    .from('opportunities')
                    .update({
                      stage_id: nextStageRow.id,
                      stage: toDbStageLiteral(nextStageText),
                      probability: nextStageRow.default_probability || stageToProb[nextStageText] || 20,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', opportunityId);
                    
                  if (!fallbackError) {
                    advanced = true;
                    console.log('Fallback stage advancement successful!');
                  } else {
                    console.warn('Fallback stage update also failed:', fallbackError.message);
                  }
                }
              }
            } catch (fallbackEx: any) {
              console.warn('Fallback stage update exception:', fallbackEx?.message || fallbackEx);
            }
          }
        }
      } catch (advanceEx: any) {
        console.warn('Stage advancement exception:', advanceEx?.message || advanceEx);
      }

      // Show success message and close modal
      toast.success(advanced 
        ? "Next step saved and stage advanced successfully!"
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
        <Button variant="outline" size="sm" className="text-xs">
          <Target className="h-3 w-3 mr-1" />
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
              {(opportunityDetails.qualification_details || opportunityDetails.approach_discovery_details || opportunityDetails.presentation_poc_details || opportunityDetails.prospecting_details || opportunityDetails.negotiation_details) && (
                <div className="space-y-2">
                  <Label className="text-sm">Stage History</Label>
                  <div className="space-y-2">
                    {opportunityDetails.prospecting_details && (
                      <div className="border rounded p-2 bg-muted/20">
                        <div className="text-xs font-medium mb-1">Prospecting Details</div>
                        <div className="text-sm bg-white p-2 rounded border space-y-1">
                          {opportunityDetails.prospecting_details.split(/\r?\n/).map((item, idx) => (
                            item.trim() ? <div key={`p-${idx}`}>{item.trim()}</div> : null
                          ))}
                        </div>
                      </div>
                    )}
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
                    {opportunityDetails.negotiation_details && (
                      <div className="border rounded p-2 bg-muted/20">
                        <div className="text-xs font-medium mb-1">Negotiation Details</div>
                        <div className="text-sm bg-white p-2 rounded border space-y-1">
                          {opportunityDetails.negotiation_details.split(/\r?\n/).map((item, idx) => (
                            item.trim() ? <div key={`n-${idx}`}>{item.trim()}</div> : null
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

          {/* Final Outcome (muncul di Negotiation) */}
          {normalizeStageName(opportunityDetails?.stage || '') === 'Negotiation' && (
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