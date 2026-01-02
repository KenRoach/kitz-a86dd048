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
          website?: string | null
        }
        Relationships: []
      }
      storefronts: {
        Row: {
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
          id: string
          image_url: string | null
          ordered_at: string | null
          payment_cards: boolean | null
          payment_cash: boolean | null
          payment_pluxee: boolean | null
          payment_yappy: boolean | null
          price: number
          quantity: number | null
          seller_phone: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
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
          id?: string
          image_url?: string | null
          ordered_at?: string | null
          payment_cards?: boolean | null
          payment_cash?: boolean | null
          payment_pluxee?: boolean | null
          payment_yappy?: boolean | null
          price: number
          quantity?: number | null
          seller_phone?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
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
          id?: string
          image_url?: string | null
          ordered_at?: string | null
          payment_cards?: boolean | null
          payment_cash?: boolean | null
          payment_pluxee?: boolean | null
          payment_yappy?: boolean | null
          price?: number
          quantity?: number | null
          seller_phone?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
