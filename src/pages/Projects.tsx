import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CRMLayout } from "@/components/layout/CRMLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/useProjects";
import { formatCurrency, formatDate } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, FileText, Calendar, DollarSign } from "lucide-react";

export default function Projects() {
  const navigate = useNavigate();
  const { projects, isLoading } = useProjects();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'CBD': return 'Cash Before Delivery';
      case 'TOP': return 'Terms of Payment';
      case 'Installments': return 'Installments';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <CRMLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Projects</h1>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </CRMLayout>
    );
  }

  return (
    <CRMLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Projects</h1>
        </div>

        {!projects || projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground mb-2">No projects yet</p>
              <p className="text-sm text-muted-foreground">
                Convert won opportunities to projects to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: any) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge variant={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                  {project.opportunities?.organizations && (
                    <p className="text-sm text-muted-foreground">
                      {project.opportunities.organizations.name}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.po_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">PO:</span>
                      <span className="font-medium">{project.po_number}</span>
                    </div>
                  )}
                  
                  {project.po_amount && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium">
                        {formatCurrency(project.po_amount, project.currency)}
                      </span>
                    </div>
                  )}

                  {project.payment_type && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Payment:</span>
                      <Badge variant="outline" className="text-xs">
                        {getPaymentTypeLabel(project.payment_type)}
                      </Badge>
                    </div>
                  )}

                  {project.po_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">PO Date:</span>
                      <span>{formatDate(project.po_date)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CRMLayout>
  );
}
