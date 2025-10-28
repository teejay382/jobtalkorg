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
      jobs: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          category: string | null
          created_at: string
          deadline: string | null
          description: string
          employer_id: string
          id: string
          job_type: string | null
          location: string | null
          requirements: string[] | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          category?: string | null
          created_at?: string
          deadline?: string | null
          description: string
          employer_id: string
          id?: string
          job_type?: string | null
          location?: string | null
          requirements?: string[] | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          category?: string | null
          created_at?: string
          deadline?: string | null
          description?: string
          employer_id?: string
          id?: string
          job_type?: string | null
          location?: string | null
          requirements?: string[] | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
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
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"] | null
          role: string | null
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          skills: string[] | null
          updated_at: string
          user_id: string
          username: string | null
          service_type: 'remote' | 'local' | null
          location_city: string | null
          latitude: number | null
          longitude: number | null
          service_categories: string[] | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          role?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          skills?: string[] | null
          updated_at?: string
          user_id: string
          username?: string | null
          service_type?: 'remote' | 'local' | null
          location_city?: string | null
          latitude?: number | null
          longitude?: number | null
          service_categories?: string[] | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          role?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
          username?: string | null
          service_type?: 'remote' | 'local' | null
          location_city?: string | null
          latitude?: number | null
          longitude?: number | null
          service_categories?: string[] | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          id: string
          employer_id: string
          title: string
          description: string
          job_type: 'remote' | 'local' | 'hybrid'
          required_skills: string[]
          optional_skills: string[] | null
          experience_level: 'entry' | 'intermediate' | 'expert' | 'any' | null
          location_city: string | null
          latitude: number | null
          longitude: number | null
          max_distance_km: number | null
          pay_rate_min: number | null
          pay_rate_max: number | null
          pay_rate_currency: string
          pay_rate_type: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'fixed' | 'negotiable' | null
          duration_type: 'one-time' | 'short-term' | 'long-term' | 'permanent' | null
          urgency_level: 'low' | 'medium' | 'high' | 'urgent' | null
          service_categories: string[] | null
          status: 'draft' | 'open' | 'in_progress' | 'filled' | 'closed' | 'cancelled'
          applications_count: number
          views_count: number
          created_at: string
          updated_at: string
          expires_at: string | null
          filled_at: string | null
        }
        Insert: {
          id?: string
          employer_id: string
          title: string
          description: string
          job_type: 'remote' | 'local' | 'hybrid'
          required_skills: string[]
          optional_skills?: string[] | null
          experience_level?: 'entry' | 'intermediate' | 'expert' | 'any' | null
          location_city?: string | null
          latitude?: number | null
          longitude?: number | null
          max_distance_km?: number | null
          pay_rate_min?: number | null
          pay_rate_max?: number | null
          pay_rate_currency?: string
          pay_rate_type?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'fixed' | 'negotiable' | null
          duration_type?: 'one-time' | 'short-term' | 'long-term' | 'permanent' | null
          urgency_level?: 'low' | 'medium' | 'high' | 'urgent' | null
          service_categories?: string[] | null
          status?: 'draft' | 'open' | 'in_progress' | 'filled' | 'closed' | 'cancelled'
          applications_count?: number
          views_count?: number
          created_at?: string
          updated_at?: string
          expires_at?: string | null
          filled_at?: string | null
        }
        Update: {
          id?: string
          employer_id?: string
          title?: string
          description?: string
          job_type?: 'remote' | 'local' | 'hybrid'
          required_skills?: string[]
          optional_skills?: string[] | null
          experience_level?: 'entry' | 'intermediate' | 'expert' | 'any' | null
          location_city?: string | null
          latitude?: number | null
          longitude?: number | null
          max_distance_km?: number | null
          pay_rate_min?: number | null
          pay_rate_max?: number | null
          pay_rate_currency?: string
          pay_rate_type?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'fixed' | 'negotiable' | null
          duration_type?: 'one-time' | 'short-term' | 'long-term' | 'permanent' | null
          urgency_level?: 'low' | 'medium' | 'high' | 'urgent' | null
          service_categories?: string[] | null
          status?: 'draft' | 'open' | 'in_progress' | 'filled' | 'closed' | 'cancelled'
          applications_count?: number
          views_count?: number
          created_at?: string
          updated_at?: string
          expires_at?: string | null
          filled_at?: string | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          id: string
          job_id: string
          applicant_id: string
          cover_letter: string | null
          proposed_rate: number | null
          status: 'pending' | 'reviewed' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          applicant_id: string
          cover_letter?: string | null
          proposed_rate?: number | null
          status?: 'pending' | 'reviewed' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          applicant_id?: string
          cover_letter?: string | null
          proposed_rate?: number | null
          status?: 'pending' | 'reviewed' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          id: string
          user_id: string
          target_type: 'job' | 'profile' | 'video'
          target_id: string
          interaction_type: 'view' | 'click' | 'apply' | 'save' | 'contact' | 'hire' | 'accept'
          source: string | null
          metadata: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_type: 'job' | 'profile' | 'video'
          target_id: string
          interaction_type: 'view' | 'click' | 'apply' | 'save' | 'contact' | 'hire' | 'accept'
          source?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_type?: 'job' | 'profile' | 'video'
          target_id?: string
          interaction_type?: 'view' | 'click' | 'apply' | 'save' | 'contact' | 'hire' | 'accept'
          source?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          id: string
          job_id: string | null
          rated_user_id: string
          rater_user_id: string
          rating: number
          review_text: string | null
          communication_rating: number | null
          quality_rating: number | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id?: string | null
          rated_user_id: string
          rater_user_id: string
          rating: number
          review_text?: string | null
          communication_rating?: number | null
          quality_rating?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string | null
          rated_user_id?: string
          rater_user_id?: string
          rating?: number
          review_text?: string | null
          communication_rating?: number | null
          quality_rating?: number | null
          created_at?: string
        }
        Relationships: []
      }
      user_statistics: {
        Row: {
          user_id: string
          profile_completeness_score: number
          total_jobs_completed: number
          total_applications_sent: number
          response_rate: number
          avg_rating: number
          total_ratings: number
          trust_score: number
          last_active_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          profile_completeness_score?: number
          total_jobs_completed?: number
          total_applications_sent?: number
          response_rate?: number
          avg_rating?: number
          total_ratings?: number
          trust_score?: number
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          profile_completeness_score?: number
          total_jobs_completed?: number
          total_applications_sent?: number
          response_rate?: number
          avg_rating?: number
          total_ratings?: number
          trust_score?: number
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
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
      hires: {
        Row: {
          id: string
          employer_id: string
          freelancer_id: string
          status: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          employer_id: string
          freelancer_id: string
          status?: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          employer_id?: string
          freelancer_id?: string
          status?: string
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hires_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "hires_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_sensitive_profile_data: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      find_nearby_providers: {
        Args: {
          user_lat: number
          user_lon: number
          max_distance?: number
          service_category?: string | null
        }
        Returns: {
          user_id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          service_categories: string[] | null
          location_city: string | null
          latitude: number
          longitude: number
          distance: number
        }[]
      }
      find_matches_for_job: {
        Args: {
          p_job_id: string
          p_limit?: number
        }
        Returns: {
          user_id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          skills: string[] | null
          location_city: string | null
          avg_rating: number
          skill_score: number
          location_score: number
          reputation_score: number
          total_score: number
        }[]
      }
      find_matches_for_user: {
        Args: {
          p_user_id: string
          p_limit?: number
        }
        Returns: {
          job_id: string
          title: string
          description: string
          job_type: string
          required_skills: string[]
          location_city: string | null
          pay_rate_min: number | null
          pay_rate_max: number | null
          urgency_level: string | null
          employer_name: string | null
          created_at: string
          skill_score: number
          location_score: number
          total_score: number
        }[]
      }
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
