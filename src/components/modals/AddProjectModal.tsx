import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Json } from "@/integrations/supabase/types";
import { formatCurrency } from "@/lib/constants";

interface InstallmentPayment {
  id: string;
  percentage: number;
  dueDate: Date | undefined;
  amount: number;
  status: "pending" | "paid";
}

interface WonOpportunity {
  id: string;
  name: string;
  customer_id?: string;
  pipeline_id?: string;
}

interface AddProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddProjectModal = ({
  open,
  onOpenChange,
}: AddProjectModalProps) => {
  const [formData, setFormData] = useState({
    opportunity_id: "",
    pipeline_id: "",

    projectName: "",
    poNumber: "",
    poDate: undefined as Date | undefined,
    poAmount: "",
    paymentType: "",
    paymentDate: undefined as Date | undefined,

    topDays: "",
    topDueDate: undefined as Date | undefined,

    cost_of_goods: 0,
    service_costs: 0,
    other_expenses: 0,
  });

  const [installments, setInstallments] = useState<InstallmentPayment[]>([
    {
      id: "1",
      percentage: 0,
      dueDate: undefined,
      amount: 0,
      status: "pending",
    },
  ]);

  const [wonOpportunities, setWonOpportunities] = useState<WonOpportunity[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [margin, setMargin] = useState(0);
  const { user } = useAuth();

  // Fetch won opportunities when modal opens
  useEffect(() => {
    if (open) {
      fetchWonOpportunities();
    }
  }, [open]);

  const fetchWonOpportunities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pipeline_items")
        .select(
          `
          id,
          opportunity_id,
          opportunities (
            id,
            name,
            customer_id,
            pipeline_id
          )
        `
        )
        .eq("status", "won")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to match the expected WonOpportunity interface
      const wonOpportunities =
        data
          ?.map((item) => ({
            id: item.opportunities?.id || "",
            name: item.opportunities?.name || "",
            customer_id: item.opportunities?.customer_id,
            pipeline_id: item.opportunities?.pipeline_id,
          }))
          .filter((opp) => opp.id) || [];

      console.log("wonOpportunities: ", wonOpportunities);

      setWonOpportunities(wonOpportunities);
    } catch (error) {
      console.error("Error fetching won opportunities:", error);
    } finally {
      setLoading(false);
    }
  };

  const addInstallment = () => {
    const newId = (installments.length + 1).toString();
    setInstallments([
      ...installments,
      {
        id: newId,
        percentage: 0,
        dueDate: undefined,
        amount: 0,
        status: "pending",
      },
    ]);
  };

  const removeInstallment = (id: string) => {
    if (installments.length > 1) {
      setInstallments(installments.filter((inst) => inst.id !== id));
    }
  };

  const updateInstallment = (
    id: string,
    field: keyof InstallmentPayment,
    value: number | Date | undefined | string
  ) => {
    setInstallments(
      installments.map((inst) =>
        inst.id === id ? { ...inst, [field]: value } : inst
      )
    );
  };

  const calculateInstallmentAmounts = () => {
    const poAmount = parseFloat(formData.poAmount) || 0;
    const updatedInstallments = installments.map((inst) => ({
      ...inst,
      amount: (inst.percentage / 100) * poAmount,
    }));
    setInstallments(updatedInstallments);
  };

  const getTotalPercentage = () => {
    return installments.reduce((sum, inst) => sum + inst.percentage, 0);
  };

  const isFormValid = () => {
    const basicFields =
      formData.projectName &&
      formData.poNumber &&
      formData.poDate &&
      formData.poAmount &&
      formData.paymentType;

    if (!basicFields) return false;

    if (formData.paymentType === "installment") {
      return (
        getTotalPercentage() === 100 &&
        installments.every((inst) => inst.dueDate)
      );
    }

    if (formData.paymentType === "top") {
      return formData.topDays && formData.topDueDate;
    }

    if (formData.paymentType === "cbd") {
      return formData.paymentDate;
    }

    return false;
  };

  const handleSubmit = async () => {
    if (isFormValid()) {
      try {
        const paymentTypes = {
          cbd: "CBD",
          top: "TOP",
          installment: "Installments",
        };
        const dataProject = {
          name: formData.projectName,
          opportunity_id: formData.opportunity_id,
          po_number: formData.poNumber,
          po_date:
            formData.poDate instanceof Date
              ? formData.poDate.toISOString()
              : new Date(formData.poDate).toISOString(),
          po_amount: Number(formData.poAmount) || 0,
          payment_type: paymentTypes[formData.paymentType],
          created_by: user.id,
          currency: "IDR",
          top_days: null,
          top_due_date: null,
          installments: null,
        };

        if (formData.paymentType === "installment") {
          dataProject.installments = installments;
        }

        if (formData.paymentType === "top") {
          dataProject.top_days = parseInt(formData.topDays) || 0;
          dataProject.top_due_date =
            formData.topDueDate instanceof Date
              ? formData.topDueDate.toISOString()
              : new Date(formData.topDueDate).toISOString();
        }

        // Insert ke projects
        const { error: errorCreateProject } = await supabase
          .from("projects")
          .insert([dataProject]);

        if (errorCreateProject) throw errorCreateProject;

        // Update pipeline_items
        const costOfGoods = Number(formData.cost_of_goods) || 0;
        const serviceCosts = Number(formData.service_costs) || 0;
        const otherExpenses = Number(formData.other_expenses) || 0;

        const { error: errorUpdatePipelineItem } = await supabase
          .from("pipeline_items")
          .update({
            cost_of_goods: costOfGoods,
            service_costs: serviceCosts,
            other_expenses: otherExpenses,
          })
          .eq("opportunity_id", formData.opportunity_id)
          .eq("pipeline_id", formData.pipeline_id);

        if (errorUpdatePipelineItem) throw errorUpdatePipelineItem;

        toast.success("Project and pipeline item updated successfully");
      } catch (error) {
        console.error("Error creating project:", error);
        toast.error("Failed to create project");
      } finally {
        onOpenChange(false);
        // Reset form
        setFormData({
          opportunity_id: "",
          pipeline_id: "",
          projectName: "",
          poNumber: "",
          poDate: undefined,
          poAmount: "",
          paymentType: "",
          paymentDate: undefined,
          topDays: "",
          topDueDate: undefined,
          cost_of_goods: 0,
          service_costs: 0,
          other_expenses: 0,
        });
        setInstallments([
          {
            id: "1",
            percentage: 0,
            dueDate: undefined,
            amount: 0,
            status: "pending",
          },
        ]);
      }
    }
  };

  React.useEffect(() => {
    if (formData.paymentType === "installment" && formData.poAmount) {
      calculateInstallmentAmounts();
    }
  }, [
    formData.poAmount,
    installments.map((inst) => inst.percentage).join(","),
  ]);

  React.useEffect(() => {
    const poAmount = Number(formData.poAmount) || 0;
    const costOfGoods = Number(formData.cost_of_goods) || 0;
    const serviceCosts = Number(formData.service_costs) || 0;
    const otherExpenses = Number(formData.other_expenses) || 0;

    setMargin(poAmount - (costOfGoods + serviceCosts + otherExpenses));
  }, [
    formData.poAmount,
    formData.cost_of_goods,
    formData.service_costs,
    formData.other_expenses,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Select
              value={formData.opportunity_id}
              onValueChange={(id) => {
                const selected = wonOpportunities.find((o) => o.id === id);
                if (!selected) return;

                setFormData({
                  ...formData,
                  opportunity_id: selected.id,
                  projectName: selected.name,
                  pipeline_id: selected.pipeline_id,
                });
              }}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loading
                      ? "Loading won opportunities..."
                      : "Select won opportunity"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {wonOpportunities.map((opportunity) => (
                  <SelectItem key={opportunity.id} value={opportunity.id}>
                    {opportunity.name}
                  </SelectItem>
                ))}
                {wonOpportunities.length === 0 && !loading && (
                  <SelectItem value="Choose an option">
                    No won opportunities available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* PO Number */}
          <div className="space-y-2">
            <Label htmlFor="poNumber">PO Number</Label>
            <Input
              id="poNumber"
              value={formData.poNumber}
              onChange={(e) =>
                setFormData({ ...formData, poNumber: e.target.value })
              }
              placeholder="Enter PO number from customer"
            />
          </div>

          {/* PO Date */}
          <div className="space-y-2">
            <Label>PO Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.poDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.poDate
                    ? format(formData.poDate, "PPP")
                    : "Select PO date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.poDate}
                  onSelect={(date) =>
                    setFormData({ ...formData, poDate: date })
                  }
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* PO Amount */}
          <div className="space-y-2">
            <Label htmlFor="poAmount">PO Amount (IDR)</Label>
            <Input
              id="poAmount"
              type="number"
              value={formData.poAmount}
              onChange={(e) =>
                setFormData({ ...formData, poAmount: e.target.value })
              }
              placeholder="Enter PO amount from customer"
            />
          </div>

          {/* Payment Type */}
          <div className="space-y-2">
            <Label>Payment Type</Label>
            <Select
              value={formData.paymentType}
              onValueChange={(value) =>
                setFormData({ ...formData, paymentType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cbd">CBD (Cash Before Delivery)</SelectItem>
                <SelectItem value="top">TOP (Terms of Payment)</SelectItem>
                <SelectItem value="installment">Installment Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* CBD Payment Date */}
          {formData.paymentType === "cbd" && (
            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.paymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.paymentDate
                      ? format(formData.paymentDate, "PPP")
                      : "Select payment date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.paymentDate}
                    onSelect={(date) =>
                      setFormData({ ...formData, paymentDate: date })
                    }
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* TOP Payment */}
          {formData.paymentType === "top" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Terms of Payment</Label>
                <Select
                  value={formData.topDays}
                  onValueChange={(value) =>
                    setFormData({ ...formData, topDays: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="45">45 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.topDueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.topDueDate
                        ? format(formData.topDueDate, "PPP")
                        : "Select due date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.topDueDate}
                      onSelect={(date) =>
                        setFormData({ ...formData, topDueDate: date })
                      }
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Installment Payment */}
          {formData.paymentType === "installment" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Installment Schedule</Label>
                <Button type="button" size="sm" onClick={addInstallment}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Installment
                </Button>
              </div>

              <div className="space-y-3">
                {installments.map((installment, index) => (
                  <div
                    key={installment.id}
                    className="grid grid-cols-5 gap-3 items-end p-3 border rounded-lg"
                  >
                    <div>
                      <Label className="text-xs">Installment {index + 1}</Label>
                      <Input
                        type="number"
                        placeholder="%"
                        value={installment.percentage || ""}
                        onChange={(e) =>
                          updateInstallment(
                            installment.id,
                            "percentage",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        max="100"
                        min="0"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Amount (IDR)</Label>
                      <Input
                        type="number"
                        value={installment.amount}
                        readOnly
                        className="bg-muted"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !installment.dueDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-1 h-3 w-3" />
                            {installment.dueDate
                              ? format(installment.dueDate, "dd/MM")
                              : "Date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={installment.dueDate}
                            onSelect={(date) =>
                              updateInstallment(installment.id, "dueDate", date)
                            }
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label className="text-xs">Status</Label>
                      <Select
                        value={installment.status}
                        onValueChange={(value) =>
                          updateInstallment(installment.id, "status", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      {installments.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeInstallment(installment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-right">
                <span
                  className={cn(
                    "text-sm font-medium",
                    getTotalPercentage() === 100
                      ? "text-green-600"
                      : "text-orange-600"
                  )}
                >
                  Total: {getTotalPercentage()}%
                </span>
              </div>
            </div>
          )}

          {/* COGS */}
          <p className="font-semibold my-3">COGS</p>
          {/* Cost of Goods */}
          <div className="space-y-2">
            <Label htmlFor="cost_of_goods">Cost of Goods</Label>
            <Input
              id="cost_of_goods"
              type="number"
              value={formData.cost_of_goods}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cost_of_goods: parseInt(e.target.value),
                })
              }
              placeholder="Enter cost of goods"
              min={0}
            />
          </div>

          {/* Service Costs */}
          <div className="space-y-2">
            <Label htmlFor="costs_of_goods">Service Cost</Label>
            <Input
              id="service_costs"
              type="number"
              value={formData.service_costs}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  service_costs: parseInt(e.target.value),
                })
              }
              placeholder="Enter service costs"
              min={0}
            />
          </div>

          {/* Other Expenses */}
          <div className="space-y-2">
            <Label htmlFor="costs_of_goods">Other Expenses</Label>
            <Input
              id="other_expenses"
              type="number"
              value={formData.other_expenses}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  other_expenses: parseInt(e.target.value),
                })
              }
              placeholder="Enter other expenses"
              min={0}
            />
          </div>

          <div className="space-y-2">
            <p className="font-semibold my-3">Margin</p>
            <p>{formatCurrency(margin, "IDR")}</p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isFormValid()}>
              Add Project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
