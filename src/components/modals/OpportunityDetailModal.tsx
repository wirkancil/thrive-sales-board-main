import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, User, Building, FileText, Target, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/lib/constants";
import { toast } from "sonner";

interface OpportunityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: string;
}

interface OpportunityDetails {
  id: string;
  name: string;
  description?: string;
  amount?: number;
  currency?: string;
  stage: string;
  status: string;
  probability?: number;
  expected_close_date?: string;
  created_at: string;
  updated_at: string;
  lost_reason_id?: string | null;
  customer?: {
    name: string;
    type: string;
  } | null;
  end_user?: {
    name: string;
  } | null;
  owner?: {
    full_name: string;
    email: string;
  } | null;
  qualification_details?: string;
  approach_discovery_details?: string;
  presentation_poc_details?: string;
  next_step_title?: string;
  next_step?: string;
  next_step_due_date?: string;
}

export default function OpportunityDetailModal({ isOpen, onClose, opportunityId }: OpportunityDetailModalProps) {
  const [opportunity, setOpportunity] = useState<OpportunityDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [showStageDetails, setShowStageDetails] = useState(true);
  const [lossReasons, setLossReasons] = useState<{ id: string; label: string }[]>([]);
  const [lossNote, setLossNote] = useState<string>("");

  useEffect(() => {
    if (isOpen && opportunityId) {
      fetchOpportunityDetails();
    }
  }, [isOpen, opportunityId]);

  // Untuk Closed Lost, fetch label loss_reasons dari DB (jika ada) dan ambil catatan aktivitas terbaru sebagai fallback
  useEffect(() => {
    const shouldFetch = opportunity && (opportunity.stage === 'Closed Lost' || opportunity.status === 'lost');
    if (isOpen && shouldFetch) {
      // Fetch loss reasons
      (async () => {
        try {
          const { data, error } = await supabase
            .from('loss_reasons')
            .select('id,label')
            .eq('active', true)
            .order('label');
          if (error) throw error;
          setLossReasons(data || []);
        } catch (err) {
          console.error('Error fetching loss reasons:', err);
          // Biarkan lossReasons kosong; UI akan pakai lossNote sebagai fallback
        }
      })();

      // Fetch latest loss note from activities as fallback display
      (async () => {
        try {
          const { data, error } = await supabase
            .from('activities')
            .select('description')
            .eq('opportunity_id', opportunityId)
            .ilike('subject', 'Opportunity marked as lost%')
            .order('created_at', { ascending: false })
            .limit(1);
          if (error) throw error;
          setLossNote((data && data[0]?.description) || "");
        } catch (err) {
          console.error('Error fetching loss note:', err);
        }
      })();
    }
  }, [isOpen, opportunity]);

  const fetchOpportunityDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          customer:organizations!customer_id(name, type),
          end_user:organizations!end_user_id(name)
        `)
        .eq('id', opportunityId)
        .single();

      if (error) throw error;

      // Get owner info separately
      const { data: ownerData } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', data.owner_id)
        .maybeSingle();

      // Combine the data
      const opportunityWithOwner = {
        ...data,
        owner: ownerData ? { 
          full_name: ownerData.full_name, 
          email: '' // Email not available in user_profiles
        } : null
      };

      setOpportunity(opportunityWithOwner);
    } catch (error) {
      console.error('Error fetching opportunity details:', error);
      // Log the full error details for debugging
      if (error && typeof error === 'object') {
        console.error('Full error object:', JSON.stringify(error, null, 2));
      }
    } finally {
      setLoading(false);
    }
  };

  // Reason Lost bersifat read-only pada detail; pengeditan hanya lewat Mark Lost

  if (!opportunity && !loading) return null;

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Prospecting':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Qualification':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Discovery':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Presentation/POC':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Negotiation':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Closed Won':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Closed Lost':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'won':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'lost':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detail Opportunity
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : opportunity ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Informasi Dasar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Building className="h-4 w-4" />
                      <span>Nama Opportunity</span>
                    </div>
                    <p className="font-medium">{opportunity.name}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Building className="h-4 w-4" />
                      <span>Customer</span>
                    </div>
                    <p className="font-medium">{opportunity.customer?.name || 'Tidak ditentukan'}</p>
                    {opportunity.customer?.type && (
                      <p className="text-sm text-muted-foreground">{opportunity.customer.type}</p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span>Nilai ({opportunity.currency || 'USD'})</span>
                    </div>
                    <p className="font-medium text-lg">{formatCurrency(opportunity.amount || 0, opportunity.currency)}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      <span>Target Close</span>
                    </div>
                    <p className="font-medium">{formatDate(opportunity.expected_close_date)}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <User className="h-4 w-4" />
                      <span>Owner</span>
                    </div>
                    <p className="font-medium">{opportunity.owner?.full_name || 'Tidak ditentukan'}</p>
                    {opportunity.owner?.email && (
                      <p className="text-sm text-muted-foreground">{opportunity.owner.email}</p>
                    )}
                  </div>
                  {/* Probabilitas dihilangkan sesuai permintaan */}
                </div>
              </div>

              {/* Status and Stage */}
              <div className="flex gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Stage</div>
                  <Badge className={getStageColor(opportunity.stage)}>
                    {opportunity.stage}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Status</div>
                  <Badge className={getStatusColor(opportunity.status)}>
                    {opportunity.status.charAt(0).toUpperCase() + opportunity.status.slice(1)}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              {opportunity.description && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Deskripsi</div>
                  <p className="text-sm bg-muted/50 p-3 rounded-md">{opportunity.description}</p>
                </div>
              )}

              {/* End User */}
              {opportunity.end_user && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">End User</div>
                  <p className="font-medium">{opportunity.end_user.name}</p>
                </div>
              )}
            </div>

            {/* Next Step */}
            {opportunity.next_step_title && (
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Target className="h-4 w-4" />
                  <span>Next Step</span>
                </div>
                <p className="text-sm mb-2">{opportunity.next_step_title}</p>
                {opportunity.next_step_due_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Due: {formatDate(opportunity.next_step_due_date)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Remove simple Qualification Details block; show within Stage Details section below */}

            {/* Stage Details */}
            {(opportunity.qualification_details || opportunity.approach_discovery_details || opportunity.presentation_poc_details) && (
              <div className="border rounded-lg">
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between p-4 h-auto"
                  onClick={() => setShowStageDetails(!showStageDetails)}
                >
                  <span className="font-medium">
                    {showStageDetails ? 'Sembunyikan' : 'Tampilkan'} detail stage
                  </span>
                  {showStageDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                {showStageDetails && (
                  <div className="px-4 pb-4 border-t bg-muted/20 space-y-4">
                    {opportunity.qualification_details && (
                      <div>
                        <div className="text-sm font-medium mb-1">Qualification Details</div>
                        <p className="text-sm bg-white p-3 rounded border">{opportunity.qualification_details}</p>
                      </div>
                    )}
                    {opportunity.approach_discovery_details && (
                      <div>
                        <div className="text-sm font-medium mb-1">Discovery Details</div>
                        <p className="text-sm bg-white p-3 rounded border">{opportunity.approach_discovery_details}</p>
                      </div>
                    )}
                    {opportunity.presentation_poc_details && (
                      <div>
                        <div className="text-sm font-medium mb-1">Presentation/POC Details</div>
                        <p className="text-sm bg-white p-3 rounded border">{opportunity.presentation_poc_details}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Timestamps */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <span>Dibuat: </span>
                  <span>{formatDate(opportunity.created_at)}</span>
                </div>
                <div>
                  <span>Terakhir diupdate: </span>
                  <span>{formatDate(opportunity.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* Loss Reason (for Closed Lost) */}
            {(opportunity.stage === 'Closed Lost' || opportunity.status === 'lost') && (
              <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
                <div className="text-sm font-medium">Reason Lost</div>
                <div className="text-sm text-muted-foreground">
                  Saat ini: {(() => {
                    const label = lossReasons.find(r => r.id === (opportunity.lost_reason_id || ''))?.label;
                    // Jika belum ada label terpilih, gunakan catatan aktivitas sebagai fallback
                    return label || (lossNote ? lossNote : 'Belum diisi');
                  })()}
                </div>
                {lossNote && (
                  <div className="text-sm">
                    <div className="text-sm font-medium mb-1">Catatan</div>
                    <div className="bg-white p-3 rounded border whitespace-pre-line">
                      {lossNote}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}