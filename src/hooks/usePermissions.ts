import { useProfile } from './useProfile';

export interface PermissionSet {
  // Module access
  canAccessUserManagement: boolean;
  canAccessAllReports: boolean;
  canAccessAnalytics: boolean;
  
  // Data operations
  canDeleteRecords: boolean;
  canCreateOrganizations: boolean;
  canApproveOrganizations: boolean;
  
  // Deal approvals
  canApproveDealsOver1B: boolean;
  canApproveDeals500MTo1B: boolean;
  canApproveAllDeals: boolean;
  
  // Target management
  canSetManagerTargets: boolean;
  canSetAccountManagerTargets: boolean;
  canViewAllManagerReports: boolean;
  canViewAllAccountManagerReports: boolean;
  
  // Reassignments
  canProposeReassignments: boolean;
  canApproveReassignments: boolean;
  
  // CRUD operations
  canCrudCustomers: boolean;
  canCrudDeals: boolean;
  canCrudActivities: boolean;
}

export const usePermissions = (): PermissionSet => {
  const { profile } = useProfile();

  if (!profile) {
    // No permissions if no profile
    return {
      canAccessUserManagement: false,
      canAccessAllReports: false,
      canAccessAnalytics: false,
      canDeleteRecords: false,
      canCreateOrganizations: false,
      canApproveOrganizations: false,
      canApproveDealsOver1B: false,
      canApproveDeals500MTo1B: false,
      canApproveAllDeals: false,
      canSetManagerTargets: false,
      canSetAccountManagerTargets: false,
      canViewAllManagerReports: false,
      canViewAllAccountManagerReports: false,
      canProposeReassignments: false,
      canApproveReassignments: false,
      canCrudCustomers: false,
      canCrudDeals: false,
      canCrudActivities: false,
    };
  }

  const basePermissions = {
    canCrudCustomers: true,
    canCrudDeals: true,
    canCrudActivities: true,
    canCreateOrganizations: true,
  };

  switch (profile.role) {
    case 'admin':
      return {
        ...basePermissions,
        // Admin: all modules, user management, delete rights
        canAccessUserManagement: true,
        canAccessAllReports: true,
        canAccessAnalytics: true,
        canDeleteRecords: true,
        canApproveOrganizations: true,
        canApproveDealsOver1B: true,
        canApproveDeals500MTo1B: true,
        canApproveAllDeals: true,
        canSetManagerTargets: true,
        canSetAccountManagerTargets: true,
        canViewAllManagerReports: true,
        canViewAllAccountManagerReports: true,
        canProposeReassignments: true,
        canApproveReassignments: true,
      };

    case 'head':
      return {
        ...basePermissions,
        // Head: set/edit Manager targets, approve deals > IDR 1B, see all Manager reports
        canAccessAllReports: true,
        canAccessAnalytics: true,
        canApproveDealsOver1B: true,
        canSetManagerTargets: true,
        canViewAllManagerReports: true,
        canApproveReassignments: true,
        canAccessUserManagement: false,
        canDeleteRecords: false,
        canApproveOrganizations: false,
        canApproveDeals500MTo1B: false,
        canApproveAllDeals: false,
        canSetAccountManagerTargets: false,
        canViewAllAccountManagerReports: false,
        canProposeReassignments: false,
      };

    case 'manager':
      return {
        ...basePermissions,
        // Manager: set/edit AM targets, approve deals 500M–1B, see all AM reports, propose reassignments
        canAccessAnalytics: true,
        canApproveDeals500MTo1B: true,
        canSetAccountManagerTargets: true,
        canViewAllAccountManagerReports: true,
        canProposeReassignments: true,
        canAccessUserManagement: false,
        canAccessAllReports: false,
        canDeleteRecords: false,
        canApproveOrganizations: false,
        canApproveDealsOver1B: false,
        canApproveAllDeals: false,
        canSetManagerTargets: false,
        canViewAllManagerReports: false,
        canApproveReassignments: false,
      };

    case 'account_manager':
      return {
        ...basePermissions,
        // Account Manager: full CRUD on Customers, Deals, Activities, but targets only assigned by Manager
        canAccessUserManagement: false,
        canAccessAllReports: false,
        canAccessAnalytics: false,
        canDeleteRecords: false,
        canApproveOrganizations: false,
        canApproveDealsOver1B: false,
        canApproveDeals500MTo1B: false,
        canApproveAllDeals: false,
        canSetManagerTargets: false,
        canSetAccountManagerTargets: false,
        canViewAllManagerReports: false,
        canViewAllAccountManagerReports: false,
        canProposeReassignments: false,
        canApproveReassignments: false,
      };

    default:
      return {
        canAccessUserManagement: false,
        canAccessAllReports: false,
        canAccessAnalytics: false,
        canDeleteRecords: false,
        canCreateOrganizations: false,
        canApproveOrganizations: false,
        canApproveDealsOver1B: false,
        canApproveDeals500MTo1B: false,
        canApproveAllDeals: false,
        canSetManagerTargets: false,
        canSetAccountManagerTargets: false,
        canViewAllManagerReports: false,
        canViewAllAccountManagerReports: false,
        canProposeReassignments: false,
        canApproveReassignments: false,
        canCrudCustomers: false,
        canCrudDeals: false,
        canCrudActivities: false,
      };
  }
};