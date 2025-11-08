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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_1: string
          participant_2: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1: string
          participant_2: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1?: string
          participant_2?: string
        }
        Relationships: []
      }
      engagements: {
        Row: {
          action_type: string
          created_at: string | null
          duration_seconds: number | null
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          applicant_count: number | null
          boost_until: string | null
          budget_max: number | null
          budget_min: number | null
          category: string | null
          created_at: string
          deadline: string | null
          description: string
          employer_id: string
          filled_at: string | null
          id: string
          job_type: string
          location: string | null
          requirements: string[] | null
          skill_embedding: string | null
          status: string | null
          title: string
          updated_at: string
          urgency_level: string | null
          video_url: string | null
          views_count: number | null
        }
        Insert: {
          applicant_count?: number | null
          boost_until?: string | null
          budget_max?: number | null
          budget_min?: number | null
          category?: string | null
          created_at?: string
          deadline?: string | null
          description: string
          employer_id: string
          filled_at?: string | null
          id?: string
          job_type?: string
          location?: string | null
          requirements?: string[] | null
          skill_embedding?: string | null
          status?: string | null
          title: string
          updated_at?: string
          urgency_level?: string | null
          video_url?: string | null
          views_count?: number | null
        }
        Update: {
          applicant_count?: number | null
          boost_until?: string | null
          budget_max?: number | null
          budget_min?: number | null
          category?: string | null
          created_at?: string
          deadline?: string | null
          description?: string
          employer_id?: string
          filled_at?: string | null
          id?: string
          job_type?: string
          location?: string | null
          requirements?: string[] | null
          skill_embedding?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          urgency_level?: string | null
          video_url?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string | null
          credibility_score: number | null
          engagement_score: number | null
          explanation: Json | null
          freelancer_id: string
          id: string
          job_id: string
          match_score: number
          recency_boost: number | null
          skill_match_score: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credibility_score?: number | null
          engagement_score?: number | null
          explanation?: Json | null
          freelancer_id: string
          id?: string
          job_id: string
          match_score: number
          recency_boost?: number | null
          skill_match_score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credibility_score?: number | null
          engagement_score?: number | null
          explanation?: Json | null
          freelancer_id?: string
          id?: string
          job_id?: string
          match_score?: number
          recency_boost?: number | null
          skill_match_score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"] | null
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          completion_rate: number | null
          created_at: string
          credibility_score: number | null
          email: string
          engagement_score: number | null
          full_name: string | null
          id: string
          jts_score: number | null
          last_active_at: string | null
          latitude: number | null
          location_city: string | null
          longitude: number | null
          onboarding_completed: boolean | null
          response_time_avg: number | null
          role: string | null
          service_categories: string[] | null
          service_type: string | null
          skill_embedding: string | null
          skills: string[] | null
          total_engagements: number | null
          total_views: number | null
          updated_at: string
          user_id: string
          username: string | null
          verified_at: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          completion_rate?: number | null
          created_at?: string
          credibility_score?: number | null
          email: string
          engagement_score?: number | null
          full_name?: string | null
          id?: string
          jts_score?: number | null
          last_active_at?: string | null
          latitude?: number | null
          location_city?: string | null
          longitude?: number | null
          onboarding_completed?: boolean | null
          response_time_avg?: number | null
          role?: string | null
          service_categories?: string[] | null
          service_type?: string | null
          skill_embedding?: string | null
          skills?: string[] | null
          total_engagements?: number | null
          total_views?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
          verified_at?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          completion_rate?: number | null
          created_at?: string
          credibility_score?: number | null
          email?: string
          engagement_score?: number | null
          full_name?: string | null
          id?: string
          jts_score?: number | null
          last_active_at?: string | null
          latitude?: number | null
          location_city?: string | null
          longitude?: number | null
          onboarding_completed?: boolean | null
          response_time_avg?: number | null
          role?: string | null
          service_categories?: string[] | null
          service_type?: string | null
          skill_embedding?: string | null
          skills?: string[] | null
          total_engagements?: number | null
          total_views?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      skill_taxonomy: {
        Row: {
          category: string
          created_at: string | null
          id: string
          parent_skill: string | null
          skill_embedding: string | null
          skill_name: string
          synonyms: string[] | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          parent_skill?: string | null
          skill_embedding?: string | null
          skill_name: string
          synonyms?: string[] | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          parent_skill?: string | null
          skill_embedding?: string | null
          skill_name?: string
          synonyms?: string[] | null
        }
        Relationships: []
      }
      video_likes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          comments_count: number | null
          created_at: string
          description: string | null
          id: string
          likes_count: number | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string
          views_count: number | null
        }
        Insert: {
          comments_count?: number | null
          created_at?: string
          description?: string | null
          id?: string
          likes_count?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url: string
          views_count?: number | null
        }
        Update: {
          comments_count?: number | null
          created_at?: string
          description?: string | null
          id?: string
          likes_count?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string
          views_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      calculate_skill_match_simple: {
        Args: {
          freelancer_categories: string[]
          freelancer_skills: string[]
          job_category: string
          job_requirements: string[]
        }
        Returns: number
      }
      can_access_sensitive_profile_data: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      find_nearby_providers: {
        Args: {
          max_distance?: number
          service_category?: string
          user_lat: number
          user_lon: number
        }
        Returns: {
          avatar_url: string
          bio: string
          distance: number
          full_name: string
          latitude: number
          location_city: string
          longitude: number
          service_categories: string[]
          user_id: string
          username: string
        }[]
      }
      track_engagement: {
        Args: {
          p_action_type: string
          p_duration_seconds?: number
          p_target_id: string
          p_target_type: string
          p_user_id: string
        }
        Returns: string
      }
      update_credibility_score: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      update_engagement_score: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      update_jts_score: { Args: { target_user_id: string }; Returns: undefined }
    }
    Enums: {
      account_type: "freelancer" | "employer"
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
      account_type: ["freelancer", "employer"],
    },
  },
} as const
