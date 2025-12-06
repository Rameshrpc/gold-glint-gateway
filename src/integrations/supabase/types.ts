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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      branches: {
        Row: {
          address: string | null
          branch_code: string
          branch_name: string
          branch_type: Database["public"]["Enums"]["branch_type"]
          client_id: string
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          parent_branch_id: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          branch_code: string
          branch_name: string
          branch_type?: Database["public"]["Enums"]["branch_type"]
          client_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          parent_branch_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          branch_code?: string
          branch_name?: string
          branch_type?: Database["public"]["Enums"]["branch_type"]
          client_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          parent_branch_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_parent_branch_id_fkey"
            columns: ["parent_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      client_modules: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          is_enabled: boolean | null
          module_key: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          module_key: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          module_key?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_modules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          client_code: string
          company_name: string
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          max_branches: number | null
          max_users: number | null
          phone: string | null
          plan_name: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          client_code: string
          company_name: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_branches?: number | null
          max_users?: number | null
          phone?: string | null
          plan_name?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          client_code?: string
          company_name?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_branches?: number | null
          max_users?: number | null
          phone?: string | null
          plan_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_code_sequences: {
        Row: {
          client_id: string
          last_sequence: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          last_sequence?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          last_sequence?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_code_sequences_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          aadhaar_back_url: string | null
          aadhaar_front_url: string | null
          address: string | null
          alternate_phone: string | null
          branch_id: string
          city: string | null
          client_id: string
          created_at: string | null
          created_by: string | null
          customer_code: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          is_active: boolean | null
          monthly_income: number | null
          nominee_name: string | null
          nominee_relation:
            | Database["public"]["Enums"]["nominee_relation_type"]
            | null
          occupation: string | null
          pan_card_url: string | null
          phone: string
          photo_url: string | null
          pincode: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          aadhaar_back_url?: string | null
          aadhaar_front_url?: string | null
          address?: string | null
          alternate_phone?: string | null
          branch_id: string
          city?: string | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          customer_code: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          is_active?: boolean | null
          monthly_income?: number | null
          nominee_name?: string | null
          nominee_relation?:
            | Database["public"]["Enums"]["nominee_relation_type"]
            | null
          occupation?: string | null
          pan_card_url?: string | null
          phone: string
          photo_url?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          aadhaar_back_url?: string | null
          aadhaar_front_url?: string | null
          address?: string | null
          alternate_phone?: string | null
          branch_id?: string
          city?: string | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          customer_code?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          is_active?: boolean | null
          monthly_income?: number | null
          nominee_name?: string | null
          nominee_relation?:
            | Database["public"]["Enums"]["nominee_relation_type"]
            | null
          occupation?: string | null
          pan_card_url?: string | null
          phone?: string
          photo_url?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gold_items: {
        Row: {
          appraised_value: number
          created_at: string | null
          description: string | null
          gross_weight_grams: number
          id: string
          image_url: string | null
          item_type: Database["public"]["Enums"]["gold_item_type"]
          loan_id: string
          market_rate_per_gram: number
          net_weight_grams: number
          purity: Database["public"]["Enums"]["gold_purity"]
          purity_percentage: number
          stone_weight_grams: number | null
        }
        Insert: {
          appraised_value: number
          created_at?: string | null
          description?: string | null
          gross_weight_grams: number
          id?: string
          image_url?: string | null
          item_type: Database["public"]["Enums"]["gold_item_type"]
          loan_id: string
          market_rate_per_gram: number
          net_weight_grams: number
          purity: Database["public"]["Enums"]["gold_purity"]
          purity_percentage: number
          stone_weight_grams?: number | null
        }
        Update: {
          appraised_value?: number
          created_at?: string | null
          description?: string | null
          gross_weight_grams?: number
          id?: string
          image_url?: string | null
          item_type?: Database["public"]["Enums"]["gold_item_type"]
          loan_id?: string
          market_rate_per_gram?: number
          net_weight_grams?: number
          purity?: Database["public"]["Enums"]["gold_purity"]
          purity_percentage?: number
          stone_weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gold_items_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      interest_payments: {
        Row: {
          actual_interest: number
          amount_paid: number
          branch_id: string
          client_id: string
          collected_by: string | null
          created_at: string
          days_covered: number
          differential_capitalized: number | null
          id: string
          loan_id: string
          overdue_days: number | null
          payment_date: string
          payment_mode: string
          penalty_amount: number | null
          period_from: string
          period_to: string
          principal_reduction: number | null
          receipt_number: string
          remarks: string | null
          shown_interest: number
          updated_at: string
        }
        Insert: {
          actual_interest: number
          amount_paid: number
          branch_id: string
          client_id: string
          collected_by?: string | null
          created_at?: string
          days_covered: number
          differential_capitalized?: number | null
          id?: string
          loan_id: string
          overdue_days?: number | null
          payment_date?: string
          payment_mode?: string
          penalty_amount?: number | null
          period_from: string
          period_to: string
          principal_reduction?: number | null
          receipt_number: string
          remarks?: string | null
          shown_interest: number
          updated_at?: string
        }
        Update: {
          actual_interest?: number
          amount_paid?: number
          branch_id?: string
          client_id?: string
          collected_by?: string | null
          created_at?: string
          days_covered?: number
          differential_capitalized?: number | null
          id?: string
          loan_id?: string
          overdue_days?: number | null
          payment_date?: string
          payment_mode?: string
          penalty_amount?: number | null
          period_from?: string
          period_to?: string
          principal_reduction?: number | null
          receipt_number?: string
          remarks?: string | null
          shown_interest?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interest_payments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interest_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interest_payments_collected_by_fkey"
            columns: ["collected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interest_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          actual_principal: number | null
          advance_interest_actual: number | null
          advance_interest_shown: number | null
          appraised_by: string | null
          appraiser_sheet_url: string | null
          approved_by: string | null
          branch_id: string
          client_id: string
          closed_date: string | null
          closure_type: Database["public"]["Enums"]["closure_type"] | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          differential_capitalized: number | null
          id: string
          interest_rate: number
          jewel_photo_url: string | null
          last_interest_paid_date: string | null
          loan_date: string
          loan_number: string
          maturity_date: string
          net_disbursed: number
          next_interest_due_date: string | null
          principal_amount: number
          processing_fee: number | null
          remarks: string | null
          scheme_id: string
          shown_principal: number | null
          status: Database["public"]["Enums"]["loan_status"]
          tenure_days: number
          total_interest_paid: number | null
          updated_at: string | null
        }
        Insert: {
          actual_principal?: number | null
          advance_interest_actual?: number | null
          advance_interest_shown?: number | null
          appraised_by?: string | null
          appraiser_sheet_url?: string | null
          approved_by?: string | null
          branch_id: string
          client_id: string
          closed_date?: string | null
          closure_type?: Database["public"]["Enums"]["closure_type"] | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          differential_capitalized?: number | null
          id?: string
          interest_rate: number
          jewel_photo_url?: string | null
          last_interest_paid_date?: string | null
          loan_date?: string
          loan_number: string
          maturity_date: string
          net_disbursed: number
          next_interest_due_date?: string | null
          principal_amount: number
          processing_fee?: number | null
          remarks?: string | null
          scheme_id: string
          shown_principal?: number | null
          status?: Database["public"]["Enums"]["loan_status"]
          tenure_days: number
          total_interest_paid?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_principal?: number | null
          advance_interest_actual?: number | null
          advance_interest_shown?: number | null
          appraised_by?: string | null
          appraiser_sheet_url?: string | null
          approved_by?: string | null
          branch_id?: string
          client_id?: string
          closed_date?: string | null
          closure_type?: Database["public"]["Enums"]["closure_type"] | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          differential_capitalized?: number | null
          id?: string
          interest_rate?: number
          jewel_photo_url?: string | null
          last_interest_paid_date?: string | null
          loan_date?: string
          loan_number?: string
          maturity_date?: string
          net_disbursed?: number
          next_interest_due_date?: string | null
          principal_amount?: number
          processing_fee?: number | null
          remarks?: string | null
          scheme_id?: string
          shown_principal?: number | null
          status?: Database["public"]["Enums"]["loan_status"]
          tenure_days?: number
          total_interest_paid?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_appraised_by_fkey"
            columns: ["appraised_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          branch_id: string | null
          client_id: string
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          branch_id?: string | null
          client_id: string
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          branch_id?: string | null
          client_id?: string
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      redemptions: {
        Row: {
          amount_received: number
          approved_by: string | null
          branch_id: string
          client_id: string
          created_at: string
          gold_released: boolean | null
          gold_released_date: string | null
          id: string
          identity_verified: boolean | null
          interest_due: number
          loan_id: string
          outstanding_principal: number
          payment_mode: string
          payment_reference: string | null
          penalty_amount: number | null
          processed_by: string | null
          rebate_amount: number | null
          redemption_date: string
          redemption_number: string
          released_by: string | null
          released_to: string | null
          remarks: string | null
          total_settlement: number
          updated_at: string
          verification_notes: string | null
        }
        Insert: {
          amount_received: number
          approved_by?: string | null
          branch_id: string
          client_id: string
          created_at?: string
          gold_released?: boolean | null
          gold_released_date?: string | null
          id?: string
          identity_verified?: boolean | null
          interest_due?: number
          loan_id: string
          outstanding_principal: number
          payment_mode?: string
          payment_reference?: string | null
          penalty_amount?: number | null
          processed_by?: string | null
          rebate_amount?: number | null
          redemption_date?: string
          redemption_number: string
          released_by?: string | null
          released_to?: string | null
          remarks?: string | null
          total_settlement: number
          updated_at?: string
          verification_notes?: string | null
        }
        Update: {
          amount_received?: number
          approved_by?: string | null
          branch_id?: string
          client_id?: string
          created_at?: string
          gold_released?: boolean | null
          gold_released_date?: string | null
          id?: string
          identity_verified?: boolean | null
          interest_due?: number
          loan_id?: string
          outstanding_principal?: number
          payment_mode?: string
          payment_reference?: string | null
          penalty_amount?: number | null
          processed_by?: string | null
          rebate_amount?: number | null
          redemption_date?: string
          redemption_number?: string
          released_by?: string | null
          released_to?: string | null
          remarks?: string | null
          total_settlement?: number
          updated_at?: string
          verification_notes?: string | null
        }
        Relationships: []
      }
      schemes: {
        Row: {
          advance_interest_months: number
          client_id: string
          created_at: string | null
          description: string | null
          effective_rate: number | null
          grace_period_days: number | null
          id: string
          interest_rate: number
          is_active: boolean | null
          ltv_percentage: number
          max_amount: number
          max_tenure_days: number
          min_amount: number
          min_tenure_days: number
          minimum_days: number
          penalty_rate: number | null
          processing_fee_percentage: number | null
          rate_18kt: number | null
          rate_22kt: number | null
          rate_per_gram: number | null
          scheme_code: string
          scheme_name: string
          shown_rate: number
          updated_at: string | null
        }
        Insert: {
          advance_interest_months?: number
          client_id: string
          created_at?: string | null
          description?: string | null
          effective_rate?: number | null
          grace_period_days?: number | null
          id?: string
          interest_rate: number
          is_active?: boolean | null
          ltv_percentage?: number
          max_amount?: number
          max_tenure_days?: number
          min_amount?: number
          min_tenure_days?: number
          minimum_days?: number
          penalty_rate?: number | null
          processing_fee_percentage?: number | null
          rate_18kt?: number | null
          rate_22kt?: number | null
          rate_per_gram?: number | null
          scheme_code: string
          scheme_name: string
          shown_rate?: number
          updated_at?: string | null
        }
        Update: {
          advance_interest_months?: number
          client_id?: string
          created_at?: string | null
          description?: string | null
          effective_rate?: number | null
          grace_period_days?: number | null
          id?: string
          interest_rate?: number
          is_active?: boolean | null
          ltv_percentage?: number
          max_amount?: number
          max_tenure_days?: number
          min_amount?: number
          min_tenure_days?: number
          minimum_days?: number
          penalty_rate?: number | null
          processing_fee_percentage?: number | null
          rate_18kt?: number | null
          rate_22kt?: number | null
          rate_per_gram?: number | null
          scheme_code?: string
          scheme_name?: string
          shown_rate?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schemes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          can_approve_high_value: boolean | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          module_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_approve_high_value?: boolean | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          module_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_approve_high_value?: boolean | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          module_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_customer_code: {
        Args: { p_branch_code: string; p_client_id: string }
        Returns: string
      }
      generate_receipt_number: {
        Args: { p_client_id: string }
        Returns: string
      }
      generate_redemption_number: {
        Args: { p_client_id: string }
        Returns: string
      }
      get_user_client_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialize_platform: {
        Args: {
          p_client_code: string
          p_company_email?: string
          p_company_name: string
          p_company_phone?: string
          p_full_name?: string
          p_user_email?: string
          p_user_id: string
        }
        Returns: Json
      }
      is_any_admin: { Args: { _user_id: string }; Returns: boolean }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      platform_initialized: { Args: never; Returns: boolean }
      user_has_branch_access: {
        Args: { _branch_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "moderator"
        | "tenant_admin"
        | "branch_manager"
        | "loan_officer"
        | "appraiser"
        | "collection_agent"
        | "auditor"
      branch_type: "main_branch" | "company_owned" | "franchise" | "tenant"
      closure_type: "redeemed" | "auctioned" | "written_off"
      gender_type: "male" | "female" | "other"
      gold_item_type:
        | "necklace"
        | "chain"
        | "bangle"
        | "ring"
        | "earring"
        | "pendant"
        | "coin"
        | "bar"
        | "other"
      gold_purity: "24k" | "22k" | "20k" | "18k" | "14k"
      id_proof_type:
        | "aadhaar"
        | "pan"
        | "voter_id"
        | "passport"
        | "driving_license"
      loan_status: "active" | "closed" | "overdue" | "auctioned"
      nominee_relation_type:
        | "father"
        | "mother"
        | "spouse"
        | "son"
        | "daughter"
        | "brother"
        | "sister"
        | "grandfather"
        | "grandmother"
        | "uncle"
        | "aunt"
        | "other"
      payment_mode:
        | "cash"
        | "upi"
        | "neft"
        | "rtgs"
        | "cheque"
        | "card"
        | "other"
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
      app_role: [
        "super_admin",
        "moderator",
        "tenant_admin",
        "branch_manager",
        "loan_officer",
        "appraiser",
        "collection_agent",
        "auditor",
      ],
      branch_type: ["main_branch", "company_owned", "franchise", "tenant"],
      closure_type: ["redeemed", "auctioned", "written_off"],
      gender_type: ["male", "female", "other"],
      gold_item_type: [
        "necklace",
        "chain",
        "bangle",
        "ring",
        "earring",
        "pendant",
        "coin",
        "bar",
        "other",
      ],
      gold_purity: ["24k", "22k", "20k", "18k", "14k"],
      id_proof_type: [
        "aadhaar",
        "pan",
        "voter_id",
        "passport",
        "driving_license",
      ],
      loan_status: ["active", "closed", "overdue", "auctioned"],
      nominee_relation_type: [
        "father",
        "mother",
        "spouse",
        "son",
        "daughter",
        "brother",
        "sister",
        "grandfather",
        "grandmother",
        "uncle",
        "aunt",
        "other",
      ],
      payment_mode: ["cash", "upi", "neft", "rtgs", "cheque", "card", "other"],
    },
  },
} as const
