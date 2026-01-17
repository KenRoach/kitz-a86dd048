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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          created_at: string
          id: string
          message: string
          related_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          related_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          related_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      autopilot_actions: {
        Row: {
          action_type: string
          created_at: string
          description: string
          executed_at: string | null
          id: string
          metadata: Json | null
          related_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          description: string
          executed_at?: string | null
          id?: string
          metadata?: Json | null
          related_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string
          executed_at?: string | null
          id?: string
          metadata?: Json | null
          related_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      autopilot_queue: {
        Row: {
          action_type: string
          created_at: string
          id: string
          payload: Json
          priority: number
          scheduled_for: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          payload?: Json
          priority?: number
          scheduled_for?: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          payload?: Json
          priority?: number
          scheduled_for?: string
          user_id?: string
        }
        Relationships: []
      }
      autopilot_settings: {
        Row: {
          auto_create_storefronts: boolean
          auto_followup_customers: boolean
          created_at: string
          enabled: boolean
          followup_after_days: number
          id: string
          max_followups_per_day: number
          max_storefronts_per_day: number
          min_product_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_create_storefronts?: boolean
          auto_followup_customers?: boolean
          created_at?: string
          enabled?: boolean
          followup_after_days?: number
          id?: string
          max_followups_per_day?: number
          max_storefronts_per_day?: number
          min_product_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_create_storefronts?: boolean
          auto_followup_customers?: boolean
          created_at?: string
          enabled?: boolean
          followup_after_days?: number
          id?: string
          max_followups_per_day?: number
          max_storefronts_per_day?: number
          min_product_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: Database["public"]["Enums"]["badge_category"]
          created_at: string
          criteria: Json
          description: string
          description_es: string
          icon: string
          id: string
          level: number
          name: string
          name_es: string
          points_required: number
        }
        Insert: {
          category: Database["public"]["Enums"]["badge_category"]
          created_at?: string
          criteria?: Json
          description: string
          description_es: string
          icon: string
          id?: string
          level?: number
          name: string
          name_es: string
          points_required?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["badge_category"]
          created_at?: string
          criteria?: Json
          description?: string
          description_es?: string
          icon?: string
          id?: string
          level?: number
          name?: string
          name_es?: string
          points_required?: number
        }
        Relationships: []
      }
      consultant_contacts: {
        Row: {
          attendance_confirmed: boolean | null
          calendar_reminder_sent: boolean | null
          created_at: string
          email: string | null
          funnel_stage: string
          id: string
          is_high_attention: boolean | null
          last_interaction: string | null
          name: string
          notes: string | null
          paid_at: string | null
          payment_pending: boolean | null
          payment_sent_at: string | null
          phone: string | null
          source: string | null
          stage_entered_at: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attendance_confirmed?: boolean | null
          calendar_reminder_sent?: boolean | null
          created_at?: string
          email?: string | null
          funnel_stage?: string
          id?: string
          is_high_attention?: boolean | null
          last_interaction?: string | null
          name: string
          notes?: string | null
          paid_at?: string | null
          payment_pending?: boolean | null
          payment_sent_at?: string | null
          phone?: string | null
          source?: string | null
          stage_entered_at?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attendance_confirmed?: boolean | null
          calendar_reminder_sent?: boolean | null
          created_at?: string
          email?: string | null
          funnel_stage?: string
          id?: string
          is_high_attention?: boolean | null
          last_interaction?: string | null
          name?: string
          notes?: string | null
          paid_at?: string | null
          payment_pending?: boolean | null
          payment_sent_at?: string | null
          phone?: string | null
          source?: string | null
          stage_entered_at?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_calendar: {
        Row: {
          content_type: string | null
          created_at: string
          id: string
          notes: string | null
          platform: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          platform?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          platform?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_interaction: string | null
          lifecycle: string
          name: string
          order_count: number | null
          phone: string | null
          tags: string[] | null
          total_spent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          last_interaction?: string | null
          lifecycle?: string
          name: string
          order_count?: number | null
          phone?: string | null
          tags?: string[] | null
          total_spent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_interaction?: string | null
          lifecycle?: string
          name?: string
          order_count?: number | null
          phone?: string | null
          tags?: string[] | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      eisenhower_tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          quadrant: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          quadrant: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          quadrant?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habits: {
        Row: {
          completed_dates: string[]
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_dates?: string[]
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_dates?: string[]
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          price: number
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          business_name: string
          business_type: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          instagram: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          payment_cards: boolean | null
          payment_cash: boolean | null
          payment_pluxee: boolean | null
          payment_yappy: boolean | null
          phone: string | null
          photo_url: string | null
          ruc: string | null
          storefront_image_url: string | null
          updated_at: string
          user_id: string
          username: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          business_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          payment_cards?: boolean | null
          payment_cash?: boolean | null
          payment_pluxee?: boolean | null
          payment_yappy?: boolean | null
          phone?: string | null
          photo_url?: string | null
          ruc?: string | null
          storefront_image_url?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          business_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          payment_cards?: boolean | null
          payment_cash?: boolean | null
          payment_pluxee?: boolean | null
          payment_yappy?: boolean | null
          phone?: string | null
          photo_url?: string | null
          ruc?: string | null
          storefront_image_url?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      storefront_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          price: number
          quantity: number
          sort_order: number
          storefront_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price: number
          quantity?: number
          sort_order?: number
          storefront_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price?: number
          quantity?: number
          sort_order?: number
          storefront_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefront_items_storefront_id_fkey"
            columns: ["storefront_id"]
            isOneToOne: false
            referencedRelation: "public_storefronts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storefront_items_storefront_id_fkey"
            columns: ["storefront_id"]
            isOneToOne: false
            referencedRelation: "storefronts"
            referencedColumns: ["id"]
          },
        ]
      }
      storefronts: {
        Row: {
          accepted_at: string | null
          buyer_email: string | null
          buyer_name: string | null
          buyer_note: string | null
          buyer_phone: string | null
          comment: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          fulfillment_note: string | null
          fulfillment_status: string
          id: string
          image_url: string | null
          is_bundle: boolean
          mode: string
          order_key: string | null
          ordered_at: string | null
          paid_at: string | null
          payment_cards: boolean | null
          payment_cash: boolean | null
          payment_pluxee: boolean | null
          payment_proof_url: string | null
          payment_yappy: boolean | null
          price: number
          product_id: string | null
          quantity: number | null
          seller_phone: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          user_id: string
          valid_until: string | null
          version_major: number
          version_minor: number
          version_patch: number
          version_updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_note?: string | null
          buyer_phone?: string | null
          comment?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          fulfillment_note?: string | null
          fulfillment_status?: string
          id?: string
          image_url?: string | null
          is_bundle?: boolean
          mode?: string
          order_key?: string | null
          ordered_at?: string | null
          paid_at?: string | null
          payment_cards?: boolean | null
          payment_cash?: boolean | null
          payment_pluxee?: boolean | null
          payment_proof_url?: string | null
          payment_yappy?: boolean | null
          price: number
          product_id?: string | null
          quantity?: number | null
          seller_phone?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
          valid_until?: string | null
          version_major?: number
          version_minor?: number
          version_patch?: number
          version_updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_note?: string | null
          buyer_phone?: string | null
          comment?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          fulfillment_note?: string | null
          fulfillment_status?: string
          id?: string
          image_url?: string | null
          is_bundle?: boolean
          mode?: string
          order_key?: string | null
          ordered_at?: string | null
          paid_at?: string | null
          payment_cards?: boolean | null
          payment_cash?: boolean | null
          payment_pluxee?: boolean | null
          payment_proof_url?: string | null
          payment_yappy?: boolean | null
          price?: number
          product_id?: string | null
          quantity?: number | null
          seller_phone?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          valid_until?: string | null
          version_major?: number
          version_minor?: number
          version_patch?: number
          version_updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefronts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestion_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          suggestion_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          suggestion_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          suggestion_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_comments_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestion_votes: {
        Row: {
          created_at: string
          id: string
          suggestion_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          suggestion_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          suggestion_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_votes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_commitments: {
        Row: {
          commitment: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          commitment: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          week_start?: string
        }
        Update: {
          commitment?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          created_at: string
          followups_target: number
          id: string
          period_start: string
          storefronts_target: number
          updated_at: string
          user_id: string
          wig_period: string
          wig_target: number
          wig_type: string
        }
        Insert: {
          created_at?: string
          followups_target?: number
          id?: string
          period_start?: string
          storefronts_target?: number
          updated_at?: string
          user_id: string
          wig_period?: string
          wig_target?: number
          wig_type?: string
        }
        Update: {
          created_at?: string
          followups_target?: number
          id?: string
          period_start?: string
          storefronts_target?: number
          updated_at?: string
          user_id?: string
          wig_period?: string
          wig_target?: number
          wig_type?: string
        }
        Relationships: []
      }
      user_google_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string
          id: string
          last_active_date: string | null
          level: number
          profile_completeness: number
          streak_days: number
          total_customers: number
          total_orders: number
          total_products: number
          total_revenue: number
          total_storefronts: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_active_date?: string | null
          level?: number
          profile_completeness?: number
          streak_days?: number
          total_customers?: number
          total_orders?: number
          total_products?: number
          total_revenue?: number
          total_storefronts?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_active_date?: string | null
          level?: number
          profile_completeness?: number
          streak_days?: number
          total_customers?: number
          total_orders?: number
          total_products?: number
          total_revenue?: number
          total_storefronts?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          address: string | null
          business_name: string | null
          business_type: string | null
          city: string | null
          country: string | null
          id: string | null
          instagram: string | null
          logo_url: string | null
          payment_cards: boolean | null
          payment_cash: boolean | null
          payment_pluxee: boolean | null
          payment_yappy: boolean | null
          photo_url: string | null
          storefront_image_url: string | null
          user_id: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          country?: string | null
          id?: string | null
          instagram?: string | null
          logo_url?: string | null
          payment_cards?: boolean | null
          payment_cash?: boolean | null
          payment_pluxee?: boolean | null
          payment_yappy?: boolean | null
          photo_url?: string | null
          storefront_image_url?: string | null
          user_id?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          country?: string | null
          id?: string | null
          instagram?: string | null
          logo_url?: string | null
          payment_cards?: boolean | null
          payment_cash?: boolean | null
          payment_pluxee?: boolean | null
          payment_yappy?: boolean | null
          photo_url?: string | null
          storefront_image_url?: string | null
          user_id?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      public_storefronts: {
        Row: {
          accepted_at: string | null
          customer_name: string | null
          description: string | null
          fulfillment_note: string | null
          fulfillment_status: string | null
          id: string | null
          image_url: string | null
          is_bundle: boolean | null
          mode: string | null
          order_key: string | null
          ordered_at: string | null
          payment_cards: boolean | null
          payment_cash: boolean | null
          payment_pluxee: boolean | null
          payment_yappy: boolean | null
          price: number | null
          quantity: number | null
          slug: string | null
          status: string | null
          title: string | null
          user_id: string | null
          valid_until: string | null
          version_major: number | null
          version_minor: number | null
          version_patch: number | null
          version_updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          customer_name?: string | null
          description?: string | null
          fulfillment_note?: string | null
          fulfillment_status?: string | null
          id?: string | null
          image_url?: string | null
          is_bundle?: boolean | null
          mode?: string | null
          order_key?: string | null
          ordered_at?: string | null
          payment_cards?: boolean | null
          payment_cash?: boolean | null
          payment_pluxee?: boolean | null
          payment_yappy?: boolean | null
          price?: number | null
          quantity?: number | null
          slug?: string | null
          status?: string | null
          title?: string | null
          user_id?: string | null
          valid_until?: string | null
          version_major?: number | null
          version_minor?: number | null
          version_patch?: number | null
          version_updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          customer_name?: string | null
          description?: string | null
          fulfillment_note?: string | null
          fulfillment_status?: string | null
          id?: string | null
          image_url?: string | null
          is_bundle?: boolean | null
          mode?: string | null
          order_key?: string | null
          ordered_at?: string | null
          payment_cards?: boolean | null
          payment_cash?: boolean | null
          payment_pluxee?: boolean | null
          payment_yappy?: boolean | null
          price?: number | null
          quantity?: number | null
          slug?: string | null
          status?: string | null
          title?: string | null
          user_id?: string | null
          valid_until?: string | null
          version_major?: number | null
          version_minor?: number | null
          version_patch?: number | null
          version_updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_level: { Args: { xp: number }; Returns: number }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "consultant"
      badge_category: "usage" | "growth" | "consistency" | "milestone"
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
      app_role: ["admin", "moderator", "user", "consultant"],
      badge_category: ["usage", "growth", "consistency", "milestone"],
    },
  },
} as const
