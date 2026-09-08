export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      items: {
        Row: {
          attachment_url: string | null
          category: string | null
          completed: boolean
          created_at: string
          entities: string[]
          extracted_text: string | null
          id: string
          image_url: string | null
          item_date: string | null
          item_time: string | null
          location: string | null
          notes: string | null
          original_text: string | null
          raw_input: string | null
          reminder_at: string | null
          saved: boolean
          source_app: string | null
          source_type: string
          tags: string[]
          title: string
          type: string
          updated_at: string
          url: string | null
          user_context: string | null
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          category?: string | null
          completed?: boolean
          created_at?: string
          entities?: string[]
          extracted_text?: string | null
          id: string
          image_url?: string | null
          item_date?: string | null
          item_time?: string | null
          location?: string | null
          notes?: string | null
          original_text?: string | null
          raw_input?: string | null
          reminder_at?: string | null
          saved?: boolean
          source_app?: string | null
          source_type: string
          tags?: string[]
          title: string
          type: string
          updated_at?: string
          url?: string | null
          user_context?: string | null
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          category?: string | null
          completed?: boolean
          created_at?: string
          entities?: string[]
          extracted_text?: string | null
          id?: string
          image_url?: string | null
          item_date?: string | null
          item_time?: string | null
          location?: string | null
          notes?: string | null
          original_text?: string | null
          raw_input?: string | null
          reminder_at?: string | null
          saved?: boolean
          source_app?: string | null
          source_type?: string
          tags?: string[]
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
          user_context?: string | null
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
