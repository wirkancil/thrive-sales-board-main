import { useParams, useNavigate } from "react-router-dom";
import { CRMLayout } from "@/components/layout/CRMLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProject, useProjects } from "@/hooks/useProjects";
import { formatCurrency, formatDate } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FileText, Calendar, DollarSign, User, Package } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id!);
  const { updateProject } = useProjects();

  if (isLoading) {
    return (
      <CRMLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96" />
        </div>
      </CRMLayout>
    );
  }

  if (!project) {
    return (
      <CRMLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">Project not found</p>
          <Button onClick={() => navigate('/projects')} className="mt-4">
            Back to Projects
          </Button>
        </div>
      </CRMLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const renderPaymentDetails = () => {
    if (project.payment_type === 'CBD') {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Cash Before Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Percentage:</span>
              <span className="font-medium">{project.cbd_percentage}%</span>
            </div>
            {project.cbd_due_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date:</span>
                <span>{formatDate(project.cbd_due_date)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    if (project.payment_type === 'TOP') {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Terms of Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Terms:</span>
              <span className="font-medium">{project.top_days} days</span>
            </div>
            {project.top_due_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date:</span>
                <span>{formatDate(project.top_due_date)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    if (project.payment_type === 'Installments' && project.installments) {
      const installments = Array.isArray(project.installments) ? project.installments : [];
      const paidInstallments = installments.filter((i: any) => i.status === 'paid').length;
      const progress = (paidInstallments / installments.length) * 100;

      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Installment Schedule</span>
              <span className="text-sm font-normal text-muted-foreground">
                {paidInstallments} of {installments.length} paid
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} />
            <div className="space-y-3">
              {installments.map((inst: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Installment {idx + 1}</div>
                    <div className="text-sm text-muted-foreground">
                      {inst.percentage}% - {formatCurrency(inst.amount, project.currency)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{formatDate(inst.due_date)}</div>
                    <Badge variant={inst.status === 'paid' ? 'secondary' : 'outline'} className="mt-1">
                      {inst.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <CRMLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {project.opportunities?.organizations && (
              <p className="text-muted-foreground">
                {project.opportunities.organizations.name}
              </p>
            )}
          </div>
          <Badge variant={getStatusColor(project.status)} className="text-sm">
            {project.status}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.po_number && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">PO Number:</span>
                  <span className="font-medium">{project.po_number}</span>
                </div>
              )}

              {project.po_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">PO Date:</span>
                  <span>{formatDate(project.po_date)}</span>
                </div>
              )}

              {project.po_amount && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">PO Amount:</span>
                  <span className="font-medium">
                    {formatCurrency(project.po_amount, project.currency)}
                  </span>
                </div>
              )}

              {(project.opportunities as any)?.owner && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Owner:</span>
                  <span>{(project.opportunities as any).owner.full_name}</span>
                </div>
              )}

              <div className="pt-4 border-t">
                <span className="text-muted-foreground">Created:</span>
                <span className="ml-2">{formatDate(project.created_at)}</span>
              </div>
            </CardContent>
          </Card>

          {renderPaymentDetails()}

          {project.notes && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{project.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </CRMLayout>
  );
}
