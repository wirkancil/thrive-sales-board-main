export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          due_at: string | null
          ends_at: string | null
          id: string
          location: string | null
          meet_link: string | null
          opportunity_id: string | null
          starts_at: string | null
          status: string | null
          subject: string
          type: string | null
          updated_at: string | null
          wa_link: string | null
          with_contact_id: string | null
          with_customer_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          due_at?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          meet_link?: string | null
          opportunity_id?: string | null
          starts_at?: string | null
          status?: string | null
          subject: string
          type?: string | null
          updated_at?: string | null
          wa_link?: string | null
          with_contact_id?: string | null
          with_customer_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_at?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          meet_link?: string | null
          opportunity_id?: string | null
          starts_at?: string | null
          status?: string | null
          subject?: string
          type?: string | null
          updated_at?: string | null
          wa_link?: string | null
          with_contact_id?: string | null
          with_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "manager_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_stage_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "v_opportunities_open"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "v_pipeline_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_with_contact_id_fkey"
            columns: ["with_contact_id"]
            isOneToOne: false
            referencedRelation: "organization_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_with_customer_id_fkey"
            columns: ["with_customer_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_with_customer_id_fkey"
            columns: ["with_customer_id"]
            isOneToOne: false
            referencedRelation: "v_master_customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_with_customer_id_fkey"
            columns: ["with_customer_id"]
            isOneToOne: false
            referencedRelation: "v_master_end_user"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_attachments: {
        Row: {
          activity_id: string
          byte_size: number | null
          created_at: string | null
          created_by: string
          file_name: string
          id: string
          mime_type: string | null
          storage_path: string
        }
        Insert: {
          activity_id: string
          byte_size?: number | null
          created_at?: string | null
          created_by: string
          file_name: string
          id?: string
          mime_type?: string | null
          storage_path: string
        }
        Update: {
          activity_id?: string
          byte_size?: number | null
          created_at?: string | null
          created_by?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_attachments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "sales_activity_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics: {
        Row: {
          created_at: string | null
          date: string | null
          id: string
          metric: string | null
          user_id: string | null
          value: number | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          id?: string
          metric?: string | null
          user_id?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          id?: string
          metric?: string | null
          user_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
        ]
      }
      audit_log: {
        Row: {
          actor_id: string | null
          after_values: Json | null
          before_values: Json | null
          created_at: string
          event_type: Database["public"]["Enums"]["audit_event_type"]
          id: string
          ip_address: unknown | null
          metadata: Json | null
          object_id: string
          object_type: Database["public"]["Enums"]["audit_object_type"]
          reason: string | null
          retention_until: string | null
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          actor_id?: string | null
          after_values?: Json | null
          before_values?: Json | null
          created_at?: string
          event_type: Database["public"]["Enums"]["audit_event_type"]
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          object_id: string
          object_type: Database["public"]["Enums"]["audit_object_type"]
          reason?: string | null
          retention_until?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          actor_id?: string | null
          after_values?: Json | null
          before_values?: Json | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["audit_event_type"]
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          object_id?: string
          object_type?: Database["public"]["Enums"]["audit_object_type"]
          reason?: string | null
          retention_until?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
        ]
      }
      audit_log_v2: {
        Row: {
          action_type: string
          created_at: string
          entity_id: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          session_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          entity_id?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          session_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          entity_id?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          session_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_v2_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_v2_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
        ]
      }
      companies: {
        Row: {
          approval_note: string | null
          approval_status:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at: string | null
          approved_by: string | null
          billing_address: Json | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          industry: string | null
          is_active: boolean
          legal_name: string | null
          name: string
          notes: string | null
          org_id: string | null
          parent_company_id: string | null
          phone: string | null
          shipping_address: Json | null
          tax_id: string | null
          type: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          approval_note?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          billing_address?: Json | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          legal_name?: string | null
          name: string
          notes?: string | null
          org_id?: string | null
          parent_company_id?: string | null
          phone?: string | null
          shipping_address?: Json | null
          tax_id?: string | null
          type: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          approval_note?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          billing_address?: Json | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          legal_name?: string | null
          name?: string
          notes?: string | null
          org_id?: string | null
          parent_company_id?: string | null
          phone?: string | null
          shipping_address?: Json | null
          tax_id?: string | null
          type?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_parent_company_id_fkey"
            columns: ["parent_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          id: string
          is_deleted: boolean | null
          name: string
          notes: string | null
          owner_id: string | null
          phone: string | null
          user_id: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          is_deleted?: boolean | null
          name: string
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          is_deleted?: boolean | null
          name?: string
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contacts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
        ]
      }
      customer_contacts: {
        Row: {
          approval_note: string | null
          approval_status:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          org_unit_id: string | null
          phone: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          approval_note?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          org_unit_id?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          approval_note?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          org_unit_id?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_contacts_org_unit_id_fkey"
            columns: ["org_unit_id"]
            isOneToOne: false
            referencedRelation: "customer_org_units"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_org_units: {
        Row: {
          approval_note: string | null
          approval_status:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          description: string | null
          id: string
          is_active: boolean | null
          level: number
          name: string
          parent_unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          approval_note?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          level: number
          name: string
          parent_unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          approval_note?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          name?: string
          parent_unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_org_units_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_org_units_parent_unit_id_fkey"
            columns: ["parent_unit_id"]
            isOneToOne: false
            referencedRelation: "customer_org_units"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          company_name: string
          contact_email: string | null
          contact_person: string | null
          created_at: string | null
          deal_value: number
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean | null
          notes: string | null
          stage: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_name: string
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string | null
          deal_value: number
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          stage?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_name?: string
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string | null
          deal_value?: number
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          stage?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "deals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
        ]
      }
      department_targets: {
        Row: {
          amount: number
          amount_home: number | null
          amount_local: number | null
          approval_note: string | null
          approval_status: Database["public"]["Enums"]["approval_status_enum"]
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          currency: string
          currency_local: string | null
          department_id: string
          division_id: string | null
          fx_rate: number | null
          fx_rate_date: string | null
          id: string
          measure: string
          notes: string | null
          period_end: string
          period_start: string
          updated_at: string
        }
        Insert: {
          amount?: number
          amount_home?: number | null
          amount_local?: number | null
          approval_note?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status_enum"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          currency?: string
          currency_local?: string | null
          department_id: string
          division_id?: string | null
          fx_rate?: number | null
          fx_rate_date?: string | null
          id?: string
          measure?: string
          notes?: string | null
          period_end: string
          period_start: string
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_home?: number | null
          amount_local?: number | null
          approval_note?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status_enum"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          currency_local?: string | null
          department_id?: string
          division_id?: string | null
          fx_rate?: number | null
          fx_rate_date?: string | null
          id?: string
          measure?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_targets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "manager_team_members"
            referencedColumns: ["account_manager_id"]
          },
          {
            foreignKeyName: "department_targets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "manager_team_members"
            referencedColumns: ["manager_id"]
          },
          {
            foreignKeyName: "department_targets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_targets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "manager_team_members"
            referencedColumns: ["account_manager_id"]
          },
          {
            foreignKeyName: "department_targets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "manager_team_members"
            referencedColumns: ["manager_id"]
          },
          {
            foreignKeyName: "department_targets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_targets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_targets_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          division_id: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          division_id?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          division_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_division_fk"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_divisions_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_divisions_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_master_customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_divisions_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_master_end_user"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          code: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
        ]
      }
      fiscal_calendars: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          region_code: string
          start_month: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          region_code: string
          start_month: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          region_code?: string
          start_month?: number
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_calendars_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
        ]
      }
      fx_rates: {
        Row: {
          created_at: string
          created_by: string | null
          from_currency: string
          id: string
          is_active: boolean
          rate: number
          rate_date: string
          to_currency: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_currency: string
          id?: string
          is_active?: boolean
          rate: number
          rate_date: string
          to_currency: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_currency?: string
          id?: string
          is_active?: boolean
          rate?: number
          rate_date?: string
          to_currency?: string
        }
        Relationships: [
          {
            foreignKeyName: "fx_rates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
        ]
      }
      loss_reasons: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          label: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          label: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          label?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          due_in_days: number | null
          id: string
          is_read: boolean | null
          message: string
          pipeline_item_id: string | null
          severity: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          due_in_days?: number | null
          id?: string
          is_read?: boolean | null
          message: string
          pipeline_item_id?: string | null
          severity: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          due_in_days?: number | null
          id?: string
          is_read?: boolean | null
          message?: string
          pipeline_item_id?: string | null
          severity?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_pipeline_item_id_fkey"
            columns: ["pipeline_item_id"]
            isOneToOne: false
            referencedRelation: "pipeline_items"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          amount: number | null
          amount_home: number | null
          amount_local: number | null
          approach_discovery_details: string | null
          approval_note: string | null
          approval_status:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at: string | null
          approved_by: string | null
          close_date: string | null
          created_at: string
          created_by: string
          created_from_activity_id: string | null
          currency: string
          currency_local: string | null
          customer_id: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          end_user_id: string
          end_user_mode: string | null
          expected_close_date: string | null
          forecast_category: Database["public"]["Enums"]["forecast_enum"]
          fx_rate: number | null
          fx_rate_date: string | null
          id: string
          is_active: boolean | null
          is_closed: boolean | null
          is_deleted: boolean | null
          is_won: boolean | null
          last_activity_at: string | null
          lost_reason_id: string | null
          name: string
          next_step_due_date: string | null
          next_step_title: string | null
          opp_stage: Database["public"]["Enums"]["opp_stage_enum"] | null
          org_id: string | null
          overridden_due_days: number | null
          owner_id: string
          pipeline_id: string
          presentation_poc_details: string | null
          probability: number
          product: string | null
          qualification_details: string | null
          source: string | null
          stage: Database["public"]["Enums"]["stage_enum"]
          stage_completed_at: string | null
          stage_entered_at: string | null
          stage_id: string
          status: Database["public"]["Enums"]["opportunity_status"]
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          amount_home?: number | null
          amount_local?: number | null
          approach_discovery_details?: string | null
          approval_note?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          close_date?: string | null
          created_at?: string
          created_by: string
          created_from_activity_id?: string | null
          currency?: string
          currency_local?: string | null
          customer_id: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          end_user_id: string
          end_user_mode?: string | null
          expected_close_date?: string | null
          forecast_category?: Database["public"]["Enums"]["forecast_enum"]
          fx_rate?: number | null
          fx_rate_date?: string | null
          id?: string
          is_active?: boolean | null
          is_closed?: boolean | null
          is_deleted?: boolean | null
          is_won?: boolean | null
          last_activity_at?: string | null
          lost_reason_id?: string | null
          name: string
          next_step_due_date?: string | null
          next_step_title?: string | null
          opp_stage?: Database["public"]["Enums"]["opp_stage_enum"] | null
          org_id?: string | null
          overridden_due_days?: number | null
          owner_id: string
          pipeline_id: string
          presentation_poc_details?: string | null
          probability?: number
          product?: string | null
          qualification_details?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["stage_enum"]
          stage_completed_at?: string | null
          stage_entered_at?: string | null
          stage_id: string
          status?: Database["public"]["Enums"]["opportunity_status"]
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          amount_home?: number | null
          amount_local?: number | null
          approach_discovery_details?: string | null
          approval_note?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          close_date?: string | null
          created_at?: string
          created_by?: string
          created_from_activity_id?: string | null
          currency?: string
          currency_local?: string | null
          customer_id?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          end_user_id?: string
          end_user_mode?: string | null
          expected_close_date?: string | null
          forecast_category?: Database["public"]["Enums"]["forecast_enum"]
          fx_rate?: number | null
          fx_rate_date?: string | null
          id?: string
          is_active?: boolean | null
          is_closed?: boolean | null
          is_deleted?: boolean | null
          is_won?: boolean | null
          last_activity_at?: string | null
          lost_reason_id?: string | null
          name?: string
          next_step_due_date?: string | null
          next_step_title?: string | null
          opp_stage?: Database["public"]["Enums"]["opp_stage_enum"] | null
          org_id?: string | null
          overridden_due_days?: number | null
          owner_id?: string
          pipeline_id?: string
          presentation_poc_details?: string | null
          probability?: number
          product?: string | null
          qualification_details?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["stage_enum"]
          stage_completed_at?: string | null
          stage_entered_at?: string | null
          stage_id?: string
          status?: Database["public"]["Enums"]["opportunity_status"]
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_opportunities_activity"
            columns: ["created_from_activity_id"]
            isOneToOne: false
            referencedRelation: "sales_activity_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_master_customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_master_end_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "opportunities_end_user_id_fkey"
            columns: ["end_user_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_end_user_id_fkey"
            columns: ["end_user_id"]
            isOneToOne: false
            referencedRelation: "v_master_customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_end_user_id_fkey"
            columns: ["end_user_id"]
            isOneToOne: false
            referencedRelation: "v_master_end_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_lost_reason_id_fkey"
            columns: ["lost_reason_id"]
            isOneToOne: false
            referencedRelation: "loss_reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "v_master_pipeline"
            referencedColumns: ["pipeline_id"]
          },
          {
            foreignKeyName: "opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_stage_history: {
        Row: {
          changed_at: string
          changed_by: string
          from_stage_id: string | null
          id: string
          note: string | null
          opportunity_id: string
          to_stage_id: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          from_stage_id?: string | null
          id?: string
          note?: string | null
          opportunity_id: string
          to_stage_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          from_stage_id?: string | null
          id?: string
          note?: string | null
          opportunity_id?: string
          to_stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_stage_history_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_stage_history_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "manager_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_stage_history_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_stage_history_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_stage_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_stage_history_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "v_opportunities_open"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_stage_history_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "v_pipeline_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_stage_history_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_stage_history_crm: {
        Row: {
          changed_at: string | null
          changed_by: string
          from_stage: Database["public"]["Enums"]["opp_stage_enum"] | null
          id: string
          note: string | null
          opportunity_id: string
          to_stage: Database["public"]["Enums"]["opp_stage_enum"]
        }
        Insert: {
          changed_at?: string | null
          changed_by: string
          from_stage?: Database["public"]["Enums"]["opp_stage_enum"] | null
          id?: string
          note?: string | null
          opportunity_id: string
          to_stage: Database["public"]["Enums"]["opp_stage_enum"]
        }
        Update: {
          changed_at?: string | null
          changed_by?: string
          from_stage?: Database["public"]["Enums"]["opp_stage_enum"] | null
          id?: string
          note?: string | null
          opportunity_id?: string
          to_stage?: Database["public"]["Enums"]["opp_stage_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_stage_history_crm_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "manager_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_stage_history_crm_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_stage_history_crm_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_stage_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_stage_history_crm_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "v_opportunities_open"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_stage_history_crm_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "v_pipeline_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_contacts: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          id_number: string | null
          is_active: boolean
          is_primary: boolean
          mobile: string | null
          organization_id: string
          phone: string | null
          title: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          id_number?: string | null
          is_active?: boolean
          is_primary?: boolean
          mobile?: string | null
          organization_id: string
          phone?: string | null
          title?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          id_number?: string | null
          is_active?: boolean
          is_primary?: boolean
          mobile?: string | null
          organization_id?: string
          phone?: string | null
          title?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_master_customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_master_end_user"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          addresses: Json | null
          approval_note: string | null
          approval_status: Database["public"]["Enums"]["approval_status_enum"]
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          id: string
          id_number: string | null
          industry: string | null
          is_active: boolean
          is_deleted: boolean | null
          market_size: string | null
          name: string
          org_id: string | null
          phone: string | null
          tax_id: string | null
          type: string
          updated_at: string
          website: string | null
          whatsapp_number: string | null
        }
        Insert: {
          addresses?: Json | null
          approval_note?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status_enum"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          id_number?: string | null
          industry?: string | null
          is_active?: boolean
          is_deleted?: boolean | null
          market_size?: string | null
          name: string
          org_id?: string | null
          phone?: string | null
          tax_id?: string | null
          type: string
          updated_at?: string
          website?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          addresses?: Json | null
          approval_note?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status_enum"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          id_number?: string | null
          industry?: string | null
          is_active?: boolean
          is_deleted?: boolean | null
          market_size?: string | null
          name?: string
          org_id?: string | null
          phone?: string | null
          tax_id?: string | null
          type?: string
          updated_at?: string
          website?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pipeline_item_history: {
        Row: {
          changed_at: string | null
          changed_by: string
          from_status: Database["public"]["Enums"]["deal_status_enum"] | null
          id: string
          note: string | null
          pipeline_item_id: string
          to_status: Database["public"]["Enums"]["deal_status_enum"]
        }
        Insert: {
          changed_at?: string | null
          changed_by: string
          from_status?: Database["public"]["Enums"]["deal_status_enum"] | null
          id?: string
          note?: string | null
          pipeline_item_id: string
          to_status: Database["public"]["Enums"]["deal_status_enum"]
        }
        Update: {
          changed_at?: string | null
          changed_by?: string
          from_status?: Database["public"]["Enums"]["deal_status_enum"] | null
          id?: string
          note?: string | null
          pipeline_item_id?: string
          to_status?: Database["public"]["Enums"]["deal_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_item_history_pipeline_item_id_fkey"
            columns: ["pipeline_item_id"]
            isOneToOne: false
            referencedRelation: "pipeline_items"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_items: {
        Row: {
          amount: number
          amount_home: number | null
          amount_local: number | null
          approval_note: string | null
          approval_status:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at: string | null
          approved_by: string | null
          cost_of_goods: number | null
          created_at: string | null
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_enum"] | null
          currency_local: string | null
          expected_close_date: string
          fx_rate: number | null
          fx_rate_date: string | null
          id: string
          loss_reason: string | null
          notes: string | null
          opportunity_id: string
          other_expenses: number | null
          pipeline_id: string
          probability: number | null
          quotation_no: string | null
          service_costs: number | null
          status: Database["public"]["Enums"]["deal_status_enum"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          amount_home?: number | null
          amount_local?: number | null
          approval_note?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          cost_of_goods?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_enum"] | null
          currency_local?: string | null
          expected_close_date: string
          fx_rate?: number | null
          fx_rate_date?: string | null
          id?: string
          loss_reason?: string | null
          notes?: string | null
          opportunity_id: string
          other_expenses?: number | null
          pipeline_id: string
          probability?: number | null
          quotation_no?: string | null
          service_costs?: number | null
          status?: Database["public"]["Enums"]["deal_status_enum"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          amount_home?: number | null
          amount_local?: number | null
          approval_note?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          cost_of_goods?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_enum"] | null
          currency_local?: string | null
          expected_close_date?: string
          fx_rate?: number | null
          fx_rate_date?: string | null
          id?: string
          loss_reason?: string | null
          notes?: string | null
          opportunity_id?: string
          other_expenses?: number | null
          pipeline_id?: string
          probability?: number | null
          quotation_no?: string | null
          service_costs?: number | null
          status?: Database["public"]["Enums"]["deal_status_enum"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_items_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "manager_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_items_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_items_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_stage_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_items_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "v_opportunities_open"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_items_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "v_pipeline_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_items_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_items_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "v_master_pipeline"
            referencedColumns: ["pipeline_id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          created_at: string
          default_probability: number
          id: string
          is_active: boolean
          is_lost: boolean
          is_won: boolean
          name: string
          pipeline_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_probability?: number
          id?: string
          is_active?: boolean
          is_lost?: boolean
          is_won?: boolean
          name: string
          pipeline_id: string
          sort_order: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_probability?: number
          id?: string
          is_active?: boolean
          is_lost?: boolean
          is_won?: boolean
          name?: string
          pipeline_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "v_master_pipeline"
            referencedColumns: ["pipeline_id"]
          },
        ]
      }
      pipelines: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          cbd_due_date: string | null
          cbd_percentage: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          id: string
          installments: Json | null
          name: string
          notes: string | null
          opportunity_id: string | null
          payment_type: string | null
          po_amount: number | null
          po_date: string | null
          po_number: string | null
          status: string | null
          top_days: number | null
          top_due_date: string | null
          updated_at: string | null
        }
        Insert: {
          cbd_due_date?: string | null
          cbd_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          installments?: Json | null
          name: string
          notes?: string | null
          opportunity_id?: string | null
          payment_type?: string | null
          po_amount?: number | null
          po_date?: string | null
          po_number?: string | null
          status?: string | null
          top_days?: number | null
          top_due_date?: string | null
          updated_at?: string | null
        }
        Update: {
          cbd_due_date?: string | null
          cbd_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          installments?: Json | null
          name?: string
          notes?: string | null
          opportunity_id?: string | null
          payment_type?: string | null
          po_amount?: number | null
          po_date?: string | null
          po_number?: string | null
          status?: string | null
          top_days?: number | null
          top_due_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "projects_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: true
            referencedRelation: "manager_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: true
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: true
            referencedRelation: "opportunity_stage_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: true
            referencedRelation: "v_opportunities_open"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: true
            referencedRelation: "v_pipeline_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      rbac_audit_log: {
        Row: {
          action: string
          changed_by: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          changed_by: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          changed_by?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rbac_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "rbac_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
        ]
      }
      regions: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reports: {
        Row: {
          generated_at: string | null
          id: string
          period_end: string | null
          period_start: string | null
          summary: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          generated_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          summary?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          generated_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          summary?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sales_activity: {
        Row: {
          activity_time: string
          activity_type: string
          created_at: string | null
          customer_name: string
          id: string
          notes: string | null
          user_id: string | null
        }
        Insert: {
          activity_time: string
          activity_type: string
          created_at?: string | null
          customer_name: string
          id?: string
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          activity_time?: string
          activity_type?: string
          created_at?: string | null
          customer_name?: string
          id?: string
          notes?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sales_activity_v2: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string | null
          created_by: string
          customer_id: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean | null
          mom_added_at: string | null
          mom_text: string | null
          new_opportunity_name: string | null
          notes: string | null
          opportunity_id: string | null
          pic_id: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["activity_status"]
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string | null
          created_by: string
          customer_id: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          mom_added_at?: string | null
          mom_text?: string | null
          new_opportunity_name?: string | null
          notes?: string | null
          opportunity_id?: string | null
          pic_id?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["activity_status"]
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string | null
          created_by?: string
          customer_id?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          mom_added_at?: string | null
          mom_text?: string | null
          new_opportunity_name?: string | null
          notes?: string | null
          opportunity_id?: string | null
          pic_id?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["activity_status"]
        }
        Relationships: [
          {
            foreignKeyName: "sales_activity_v2_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_activity_v2_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_master_customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_activity_v2_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_master_end_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_activity_v2_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "sales_activity_v2_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "manager_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_activity_v2_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_activity_v2_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunity_stage_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_activity_v2_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "v_opportunities_open"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_activity_v2_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "v_pipeline_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_activity_v2_pic_id_fkey"
            columns: ["pic_id"]
            isOneToOne: false
            referencedRelation: "organization_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_targets: {
        Row: {
          amount: number
          amount_home: number | null
          amount_local: number | null
          assigned_to: string
          created_at: string | null
          created_by: string
          currency_local: string | null
          department_id: string | null
          division_id: string | null
          fx_rate: number | null
          fx_rate_date: string | null
          id: string
          measure: string
          period_end: string
          period_start: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          amount_home?: number | null
          amount_local?: number | null
          assigned_to: string
          created_at?: string | null
          created_by: string
          currency_local?: string | null
          department_id?: string | null
          division_id?: string | null
          fx_rate?: number | null
          fx_rate_date?: string | null
          id?: string
          measure: string
          period_end: string
          period_start: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          amount_home?: number | null
          amount_local?: number | null
          assigned_to?: string
          created_at?: string | null
          created_by?: string
          currency_local?: string | null
          department_id?: string | null
          division_id?: string | null
          fx_rate?: number | null
          fx_rate_date?: string | null
          id?: string
          measure?: string
          period_end?: string
          period_start?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sales_targets_assigned_to_user_profiles"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "manager_team_members"
            referencedColumns: ["account_manager_id"]
          },
          {
            foreignKeyName: "fk_sales_targets_assigned_to_user_profiles"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "manager_team_members"
            referencedColumns: ["manager_id"]
          },
          {
            foreignKeyName: "fk_sales_targets_assigned_to_user_profiles"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sales_targets_created_by_user_profiles"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "manager_team_members"
            referencedColumns: ["account_manager_id"]
          },
          {
            foreignKeyName: "fk_sales_targets_created_by_user_profiles"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "manager_team_members"
            referencedColumns: ["manager_id"]
          },
          {
            foreignKeyName: "fk_sales_targets_created_by_user_profiles"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_targets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "sales_targets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
        ]
      }
      stage_settings: {
        Row: {
          created_at: string | null
          created_by: string | null
          default_due_days: number
          id: string
          is_active: boolean | null
          org_id: string | null
          points: number
          stage_key: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          default_due_days?: number
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          points?: number
          stage_key: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          default_due_days?: number
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          points?: number
          stage_key?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stage_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "stage_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
        ]
      }
      target_cascades: {
        Row: {
          cascade_amount: number
          cascade_percentage: number | null
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          notes: string | null
          period_end: string
          period_start: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          cascade_amount?: number
          cascade_percentage?: number | null
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          notes?: string | null
          period_end: string
          period_start: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          cascade_amount?: number
          cascade_percentage?: number | null
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          period_end?: string
          period_start?: string
          source_id?: string
          source_type?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_cascades_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "manager_team_members"
            referencedColumns: ["account_manager_id"]
          },
          {
            foreignKeyName: "target_cascades_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "manager_team_members"
            referencedColumns: ["manager_id"]
          },
          {
            foreignKeyName: "target_cascades_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          department_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      titles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "titles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_notification_prefs: {
        Row: {
          created_at: string | null
          id: string
          prefs: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          prefs?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          prefs?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_prefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          currency_code: string | null
          deleted_at: string | null
          deleted_by: string | null
          department: string | null
          department_id: string | null
          division_id: string | null
          entity_id: string | null
          external_id: string | null
          fiscal_calendar_id: string | null
          full_name: string
          head_id: string | null
          id: string
          is_active: boolean
          is_deleted: boolean | null
          is_read_only: boolean | null
          locale: string | null
          new_role: string | null
          preferences: Json | null
          region_code: string | null
          region_id: string | null
          role: Database["public"]["Enums"]["role_enum"]
          team_id: string | null
          tenant_id: string | null
          timezone: string | null
          title_id: string | null
          updated_at: string | null
          user_status: Database["public"]["Enums"]["user_status_enum"] | null
        }
        Insert: {
          created_at?: string | null
          currency_code?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          department?: string | null
          department_id?: string | null
          division_id?: string | null
          entity_id?: string | null
          external_id?: string | null
          fiscal_calendar_id?: string | null
          full_name: string
          head_id?: string | null
          id: string
          is_active?: boolean
          is_deleted?: boolean | null
          is_read_only?: boolean | null
          locale?: string | null
          new_role?: string | null
          preferences?: Json | null
          region_code?: string | null
          region_id?: string | null
          role?: Database["public"]["Enums"]["role_enum"]
          team_id?: string | null
          tenant_id?: string | null
          timezone?: string | null
          title_id?: string | null
          updated_at?: string | null
          user_status?: Database["public"]["Enums"]["user_status_enum"] | null
        }
        Update: {
          created_at?: string | null
          currency_code?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          department?: string | null
          department_id?: string | null
          division_id?: string | null
          entity_id?: string | null
          external_id?: string | null
          fiscal_calendar_id?: string | null
          full_name?: string
          head_id?: string | null
          id?: string
          is_active?: boolean
          is_deleted?: boolean | null
          is_read_only?: boolean | null
          locale?: string | null
          new_role?: string | null
          preferences?: Json | null
          region_code?: string | null
          region_id?: string | null
          role?: Database["public"]["Enums"]["role_enum"]
          team_id?: string | null
          tenant_id?: string | null
          timezone?: string | null
          title_id?: string | null
          updated_at?: string | null
          user_status?: Database["public"]["Enums"]["user_status_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profiles_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_profiles_division"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_profiles_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_fiscal_calendar_id_fkey"
            columns: ["fiscal_calendar_id"]
            isOneToOne: false
            referencedRelation: "fiscal_calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "manager_team_members"
            referencedColumns: ["account_manager_id"]
          },
          {
            foreignKeyName: "user_profiles_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "manager_team_members"
            referencedColumns: ["manager_id"]
          },
          {
            foreignKeyName: "user_profiles_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_profiles_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      global_search_index: {
        Row: {
          account_manager_id: string | null
          body: string | null
          created_at: string | null
          owner_name: string | null
          rid: string | null
          rtype: string | null
          search_vector: unknown | null
          title: string | null
        }
        Relationships: []
      }
      manager_global_search: {
        Row: {
          account_manager_id: string | null
          body: string | null
          created_at: string | null
          owner_name: string | null
          rid: string | null
          rtype: string | null
          search_vector: unknown | null
          title: string | null
        }
        Relationships: []
      }
      manager_opportunities: {
        Row: {
          amount: number | null
          amount_home: number | null
          amount_local: number | null
          approach_discovery_details: string | null
          approval_note: string | null
          approval_status:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at: string | null
          approved_by: string | null
          close_date: string | null
          created_at: string | null
          created_by: string | null
          created_from_activity_id: string | null
          currency: string | null
          currency_local: string | null
          customer_id: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          end_user_id: string | null
          end_user_mode: string | null
          expected_close_date: string | null
          forecast_category: Database["public"]["Enums"]["forecast_enum"] | null
          fx_rate: number | null
          fx_rate_date: string | null
          id: string | null
          is_active: boolean | null
          is_closed: boolean | null
          is_deleted: boolean | null
          is_won: boolean | null
          last_activity_at: string | null
          lost_reason_id: string | null
          name: string | null
          next_step_due_date: string | null
          next_step_title: string | null
          opp_stage: Database["public"]["Enums"]["opp_stage_enum"] | null
          org_id: string | null
          owner_id: string | null
          pipeline_id: string | null
          presentation_poc_details: string | null
          probability: number | null
          product: string | null
          qualification_details: string | null
          source: string | null
          stage: Database["public"]["Enums"]["stage_enum"] | null
          stage_id: string | null
          status: Database["public"]["Enums"]["opportunity_status"] | null
          tags: string[] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_opportunities_activity"
            columns: ["created_from_activity_id"]
            isOneToOne: false
            referencedRelation: "sales_activity_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_master_customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_master_end_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "opportunities_end_user_id_fkey"
            columns: ["end_user_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_end_user_id_fkey"
            columns: ["end_user_id"]
            isOneToOne: false
            referencedRelation: "v_master_customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_end_user_id_fkey"
            columns: ["end_user_id"]
            isOneToOne: false
            referencedRelation: "v_master_end_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_lost_reason_id_fkey"
            columns: ["lost_reason_id"]
            isOneToOne: false
            referencedRelation: "loss_reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "v_master_pipeline"
            referencedColumns: ["pipeline_id"]
          },
          {
            foreignKeyName: "opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_team_members: {
        Row: {
          account_manager_id: string | null
          full_name: string | null
          manager_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["manager_id"]
            isOneToOne: true
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["account_manager_id"]
            isOneToOne: true
            referencedRelation: "v_user_role"
            referencedColumns: ["user_id"]
          },
        ]
      }
      opportunity_stage_metrics: {
        Row: {
          days_in_stage: number | null
          default_due_days: number | null
          effective_due_days: number | null
          id: string | null
          is_overdue: boolean | null
          owner_id: string | null
          owner_name: string | null
          points: number | null
          stage: Database["public"]["Enums"]["stage_enum"] | null
          stage_completed_at: string | null
          stage_entered_at: string | null
        }
        Relationships: []
      }
      v_master_customer: {
        Row: {
          addresses: Json | null
          contacts: Json[] | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string | null
          industry: string | null
          is_active: boolean | null
          name: string | null
          org_id: string | null
          phone: string | null
          tax_id: string | null
          type: string | null
          updated_at: string | null
          website: string | null
        }
        Relationships: []
      }
      v_master_end_user: {
        Row: {
          addresses: Json | null
          contacts: Json[] | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string | null
          industry: string | null
          is_active: boolean | null
          name: string | null
          org_id: string | null
          phone: string | null
          tax_id: string | null
          type: string | null
          updated_at: string | null
          website: string | null
        }
        Relationships: []
      }
      v_master_pipeline: {
        Row: {
          org_id: string | null
          pipeline_active: boolean | null
          pipeline_created_at: string | null
          pipeline_description: string | null
          pipeline_id: string | null
          pipeline_name: string | null
          stages: Json[] | null
        }
        Relationships: []
      }
      v_opportunities_open: {
        Row: {
          amount: number | null
          approval_note: string | null
          approval_status:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          created_from_activity_id: string | null
          currency: string | null
          customer_id: string | null
          description: string | null
          end_user_id: string | null
          end_user_mode: string | null
          expected_close_date: string | null
          forecast_category: Database["public"]["Enums"]["forecast_enum"] | null
          id: string | null
          is_active: boolean | null
          is_closed: boolean | null
          is_won: boolean | null
          name: string | null
          next_step_due_date: string | null
          next_step_title: string | null
          opp_stage: Database["public"]["Enums"]["opp_stage_enum"] | null
          org_id: string | null
          owner_id: string | null
          pipeline_id: string | null
          probability: number | null
          product: string | null
          source: string | null
          stage: Database["public"]["Enums"]["stage_enum"] | null
          stage_id: string | null
          status: Database["public"]["Enums"]["opportunity_status"] | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approval_note?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          created_from_activity_id?: string | null
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          end_user_id?: string | null
          end_user_mode?: string | null
          expected_close_date?: string | null
          forecast_category?:
            | Database["public"]["Enums"]["forecast_enum"]
            | null
          id?: string | null
          is_active?: boolean | null
          is_closed?: boolean | null
          is_won?: boolean | null
          name?: string | null
          next_step_due_date?: string | null
          next_step_title?: string | null
          opp_stage?: Database["public"]["Enums"]["opp_stage_enum"] | null
          org_id?: string | null
          owner_id?: string | null
          pipeline_id?: string | null
          probability?: number | null
          product?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["stage_enum"] | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approval_note?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          created_from_activity_id?: string | null
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          end_user_id?: string | null
          end_user_mode?: string | null
          expected_close_date?: string | null
          forecast_category?:
            | Database["public"]["Enums"]["forecast_enum"]
            | null
          id?: string | null
          is_active?: boolean | null
          is_closed?: boolean | null
          is_won?: boolean | null
          name?: string | null
          next_step_due_date?: string | null
          next_step_title?: string | null
          opp_stage?: Database["public"]["Enums"]["opp_stage_enum"] | null
          org_id?: string | null
          owner_id?: string | null
          pipeline_id?: string | null
          probability?: number | null
          product?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["stage_enum"] | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_opportunities_activity"
            columns: ["created_from_activity_id"]
            isOneToOne: false
            referencedRelation: "sales_activity_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_master_customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_master_end_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_end_user_id_fkey"
            columns: ["end_user_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_end_user_id_fkey"
            columns: ["end_user_id"]
            isOneToOne: false
            referencedRelation: "v_master_customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_end_user_id_fkey"
            columns: ["end_user_id"]
            isOneToOne: false
            referencedRelation: "v_master_end_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "v_master_pipeline"
            referencedColumns: ["pipeline_id"]
          },
          {
            foreignKeyName: "opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      v_pipeline_progress: {
        Row: {
          amount: number | null
          approval_note: string | null
          approval_status:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at: string | null
          approved_by: string | null
          board_bucket: string | null
          created_at: string | null
          created_by: string | null
          created_from_activity_id: string | null
          currency: string | null
          customer_id: string | null
          description: string | null
          end_user_id: string | null
          end_user_mode: string | null
          expected_close_date: string | null
          forecast_category: Database["public"]["Enums"]["forecast_enum"] | null
          id: string | null
          is_active: boolean | null
          is_closed: boolean | null
          is_won: boolean | null
          name: string | null
          next_step_due_date: string | null
          next_step_title: string | null
          opp_stage: Database["public"]["Enums"]["opp_stage_enum"] | null
          org_id: string | null
          owner_id: string | null
          pipeline_id: string | null
          probability: number | null
          product: string | null
          source: string | null
          stage: Database["public"]["Enums"]["stage_enum"] | null
          stage_id: string | null
          status: Database["public"]["Enums"]["opportunity_status"] | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approval_note?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          board_bucket?: never
          created_at?: string | null
          created_by?: string | null
          created_from_activity_id?: string | null
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          end_user_id?: string | null
          end_user_mode?: string | null
          expected_close_date?: string | null
          forecast_category?:
            | Database["public"]["Enums"]["forecast_enum"]
            | null
          id?: string | null
          is_active?: boolean | null
          is_closed?: boolean | null
          is_won?: boolean | null
          name?: string | null
          next_step_due_date?: string | null
          next_step_title?: string | null
          opp_stage?: Database["public"]["Enums"]["opp_stage_enum"] | null
          org_id?: string | null
          owner_id?: string | null
          pipeline_id?: string | null
          probability?: number | null
          product?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["stage_enum"] | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approval_note?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          board_bucket?: never
          created_at?: string | null
          created_by?: string | null
          created_from_activity_id?: string | null
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          end_user_id?: string | null
          end_user_mode?: string | null
          expected_close_date?: string | null
          forecast_category?:
            | Database["public"]["Enums"]["forecast_enum"]
            | null
          id?: string | null
          is_active?: boolean | null
          is_closed?: boolean | null
          is_won?: boolean | null
          name?: string | null
          next_step_due_date?: string | null
          next_step_title?: string | null
          opp_stage?: Database["public"]["Enums"]["opp_stage_enum"] | null
          org_id?: string | null
          owner_id?: string | null
          pipeline_id?: string | null
          probability?: number | null
          product?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["stage_enum"] | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_opportunities_activity"
            columns: ["created_from_activity_id"]
            isOneToOne: false
            referencedRelation: "sales_activity_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_master_customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_master_end_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_end_user_id_fkey"
            columns: ["end_user_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_end_user_id_fkey"
            columns: ["end_user_id"]
            isOneToOne: false
            referencedRelation: "v_master_customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_end_user_id_fkey"
            columns: ["end_user_id"]
            isOneToOne: false
            referencedRelation: "v_master_end_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "v_master_pipeline"
            referencedColumns: ["pipeline_id"]
          },
          {
            foreignKeyName: "opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      v_user_role: {
        Row: {
          head_id: string | null
          manager_id: string | null
          org_role: Database["public"]["Enums"]["role_enum"] | null
          region_id: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profiles_department"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "manager_team_members"
            referencedColumns: ["account_manager_id"]
          },
          {
            foreignKeyName: "user_profiles_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "manager_team_members"
            referencedColumns: ["manager_id"]
          },
          {
            foreignKeyName: "user_profiles_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_update_profile: {
        Args: {
          p_department?: string
          p_division?: string
          p_id: string
          p_role: string
          p_team?: string
        }
        Returns: undefined
      }
      advance_opportunity_stage: {
        Args: { opportunity_id: string }
        Returns: boolean
      }
      can_access_contact: {
        Args: { contact_user_id: string }
        Returns: boolean
      }
      check_is_admin: {
        Args: { u?: string }
        Returns: boolean
      }
      convert_currency: {
        Args: {
          amount: number
          from_curr: string
          rate_date?: string
          to_curr: string
        }
        Returns: number
      }
      create_deal_from_activity: {
        Args: {
          p_activity_id: string
          p_opportunity_id?: string
          p_status?: string
          p_value_idr: number
        }
        Returns: string
      }
      current_user_department_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_user_division_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_user_new_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      dept_head_can_update_profile: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      fetch_notifications_dropdown: {
        Args: { limit_n?: number }
        Returns: {
          created_at: string | null
          due_in_days: number | null
          id: string
          is_read: boolean | null
          message: string
          pipeline_item_id: string | null
          severity: string
          type: string
          user_id: string
        }[]
      }
      get_account_managers_by_division: {
        Args: { division_uuid: string }
        Returns: {
          full_name: string
          id: string
        }[]
      }
      get_activity_icon: {
        Args: { activity_type: string }
        Returns: string
      }
      get_admin_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          department_id: string
          division_id: string
          email: string
          full_name: string
          id: string
          role: string
        }[]
      }
      get_current_user_role_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          department_id: string
          division_id: string
          user_role: string
        }[]
      }
      get_entity_scoped_opportunities: {
        Args: { p_user_id?: string }
        Returns: {
          amount: number
          created_at: string
          customer_id: string
          id: string
          name: string
          owner_id: string
          stage: string
        }[]
      }
      get_entity_scoped_targets: {
        Args: { p_user_id?: string }
        Returns: {
          amount: number
          assigned_to: string
          id: string
          measure: string
          period_end: string
          period_start: string
        }[]
      }
      get_fx_rate: {
        Args: { from_curr: string; rate_date?: string; to_curr: string }
        Returns: number
      }
      get_next_stage: {
        Args: { current_stage_id: string }
        Returns: string
      }
      get_users_with_profiles: {
        Args: { p_query?: string; p_role?: string }
        Returns: {
          department_id: string
          division_id: string
          email: string
          full_name: string
          id: string
          region_id: string
          role: Database["public"]["Enums"]["role_enum"]
          team_id: string
          title_id: string
        }[]
      }
      ensure_admin_profile: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_admin_new: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_or_dept_head: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_department_head: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_department_manager: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_division_head: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_head_or_above: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_manager_or_above: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_read_only: {
        Args: { user_id?: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action_type: string
          p_metadata?: Json
          p_new_values?: Json
          p_old_values?: Json
          p_record_id?: string
          p_table_name: string
        }
        Returns: string
      }
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      mark_notification_read: {
        Args: { p_id: string }
        Returns: undefined
      }
      promote_to_admin: {
        Args: { p_email: string }
        Returns: undefined
      }
      refresh_search_index: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      role_of: {
        Args: { user_id: string }
        Returns: string
      }
      search_manager_data: {
        Args: { search_query: string }
        Returns: {
          body: string
          created_at: string
          owner_name: string
          rid: string
          rtype: string
          score: number
          title: string
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      unaccent: {
        Args: { "": string }
        Returns: string
      }
      unaccent_init: {
        Args: { "": unknown }
        Returns: unknown
      }
    }
    Enums: {
      activity_status: "scheduled" | "done" | "canceled"
      activity_type: "call" | "meeting_online" | "visit" | "go_show"
      approval_status_enum: "draft" | "submitted" | "approved" | "rejected"
      audit_event_type:
        | "create"
        | "update"
        | "delete"
        | "login"
        | "logout"
        | "export"
        | "approval"
        | "reassignment"
        | "closed_won"
        | "closed_lost"
      audit_object_type:
        | "user"
        | "customer"
        | "contact"
        | "end_user"
        | "opportunity"
        | "deal"
        | "activity"
        | "target"
        | "pipeline"
      currency_enum: "IDR" | "USD" | "JPY" | "EUR" | "SGD"
      deal_status_enum: "negotiation" | "won" | "lost"
      forecast_enum: "Pipeline" | "Best Case" | "Commit" | "Closed"
      opp_stage_enum: "contacted" | "visit" | "presentation" | "poc"
      opportunity_status: "open" | "won" | "lost" | "on_hold" | "archived"
      role_enum: "admin" | "head" | "manager" | "account_manager"
      simplified_role: "admin" | "head" | "manager" | "account_manager"
      stage_enum:
        | "Prospecting"
        | "Qualification"
        | "Approach/Discovery"
        | "Presentation/POC"
        | "Proposal/Negotiation"
        | "Closed Won"
        | "Closed Lost"
      user_status_enum:
        | "active"
        | "inactive"
        | "resigned"
        | "terminated"
        | "leave"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_status: ["scheduled", "done", "canceled"],
      activity_type: ["call", "meeting_online", "visit", "go_show"],
      approval_status_enum: ["draft", "submitted", "approved", "rejected"],
      audit_event_type: [
        "create",
        "update",
        "delete",
        "login",
        "logout",
        "export",
        "approval",
        "reassignment",
        "closed_won",
        "closed_lost",
      ],
      audit_object_type: [
        "user",
        "customer",
        "contact",
        "end_user",
        "opportunity",
        "deal",
        "activity",
        "target",
        "pipeline",
      ],
      currency_enum: ["IDR", "USD", "JPY", "EUR", "SGD"],
      deal_status_enum: ["negotiation", "won", "lost"],
      forecast_enum: ["Pipeline", "Best Case", "Commit", "Closed"],
      opp_stage_enum: ["contacted", "visit", "presentation", "poc"],
      opportunity_status: ["open", "won", "lost", "on_hold", "archived"],
      role_enum: ["admin", "head", "manager", "account_manager"],
      simplified_role: ["admin", "head", "manager", "account_manager"],
      stage_enum: [
        "Prospecting",
        "Qualification",
        "Approach/Discovery",
        "Presentation/POC",
        "Proposal/Negotiation",
        "Closed Won",
        "Closed Lost",
      ],
      user_status_enum: [
        "active",
        "inactive",
        "resigned",
        "terminated",
        "leave",
      ],
    },
  },
} as const
