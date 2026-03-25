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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string | null
          date: string
          fee: number | null
          id: string
          lawyer_id: string
          notes: string | null
          status: string | null
          time_slot: string
          victim_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          fee?: number | null
          id?: string
          lawyer_id: string
          notes?: string | null
          status?: string | null
          time_slot: string
          victim_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          fee?: number | null
          id?: string
          lawyer_id?: string
          notes?: string | null
          status?: string | null
          time_slot?: string
          victim_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_victim_id_fkey"
            columns: ["victim_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          badge_category: string | null
          badge_name: string
          earned_at: string | null
          id: string
          lawyer_id: string
        }
        Insert: {
          badge_category?: string | null
          badge_name: string
          earned_at?: string | null
          id?: string
          lawyer_id: string
        }
        Update: {
          badge_category?: string | null
          badge_name?: string
          earned_at?: string | null
          id?: string
          lawyer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badges_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      case_ratings: {
        Row: {
          case_id: string
          created_at: string | null
          id: string
          lawyer_id: string
          rating: number | null
          review: string | null
          victim_id: string
        }
        Insert: {
          case_id: string
          created_at?: string | null
          id?: string
          lawyer_id: string
          rating?: number | null
          review?: string | null
          victim_id: string
        }
        Update: {
          case_id?: string
          created_at?: string | null
          id?: string
          lawyer_id?: string
          rating?: number | null
          review?: string | null
          victim_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_ratings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: true
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_ratings_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_ratings_victim_id_fkey"
            columns: ["victim_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          ai_summary: string | null
          assigned_lawyer_id: string | null
          case_strength: number | null
          category: string
          created_at: string | null
          deadlines: Json | null
          description: string | null
          evidence_gaps: string[] | null
          fee_charged: number | null
          fir_number: string | null
          fir_verified: boolean | null
          id: string
          is_anonymous: boolean | null
          outcome: string | null
          resolved_at: string | null
          status: string | null
          title: string
          victim_id: string
        }
        Insert: {
          ai_summary?: string | null
          assigned_lawyer_id?: string | null
          case_strength?: number | null
          category: string
          created_at?: string | null
          deadlines?: Json | null
          description?: string | null
          evidence_gaps?: string[] | null
          fee_charged?: number | null
          fir_number?: string | null
          fir_verified?: boolean | null
          id?: string
          is_anonymous?: boolean | null
          outcome?: string | null
          resolved_at?: string | null
          status?: string | null
          title: string
          victim_id: string
        }
        Update: {
          ai_summary?: string | null
          assigned_lawyer_id?: string | null
          case_strength?: number | null
          category?: string
          created_at?: string | null
          deadlines?: Json | null
          description?: string | null
          evidence_gaps?: string[] | null
          fee_charged?: number | null
          fir_number?: string | null
          fir_verified?: boolean | null
          id?: string
          is_anonymous?: boolean | null
          outcome?: string | null
          resolved_at?: string | null
          status?: string | null
          title?: string
          victim_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_assigned_lawyer_id_fkey"
            columns: ["assigned_lawyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_victim_id_fkey"
            columns: ["victim_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_notifications: {
        Row: {
          created_at: string | null
          from_user_id: string | null
          from_user_name: string | null
          id: string
          post_id: string | null
          read: boolean | null
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          from_user_id?: string | null
          from_user_name?: string | null
          id?: string
          post_id?: string | null
          read?: boolean | null
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          from_user_id?: string | null
          from_user_name?: string | null
          id?: string
          post_id?: string | null
          read?: boolean | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          case_title: string | null
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          post_type: string | null
        }
        Insert: {
          author_id: string
          case_title?: string | null
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          post_type?: string | null
        }
        Update: {
          author_id?: string
          case_title?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          post_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deadlines: {
        Row: {
          case_id: string | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          source: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          source?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          case_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          source?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadlines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_analysis: Json | null
          case_id: string | null
          created_at: string | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          uploader_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          case_id?: string | null
          created_at?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          uploader_id: string
        }
        Update: {
          ai_analysis?: Json | null
          case_id?: string | null
          created_at?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      internships: {
        Row: {
          availability: string | null
          created_at: string | null
          end_date: string | null
          id: string
          lawyer_id: string
          motivation_letter: string | null
          skills: string[] | null
          skills_demonstrated: string[] | null
          start_date: string | null
          status: string | null
          student_id: string
          supervisor_rating: number | null
          supervisor_review: string | null
          tasks: Json | null
        }
        Insert: {
          availability?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          lawyer_id: string
          motivation_letter?: string | null
          skills?: string[] | null
          skills_demonstrated?: string[] | null
          start_date?: string | null
          status?: string | null
          student_id: string
          supervisor_rating?: number | null
          supervisor_review?: string | null
          tasks?: Json | null
        }
        Update: {
          availability?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          lawyer_id?: string
          motivation_letter?: string | null
          skills?: string[] | null
          skills_demonstrated?: string[] | null
          start_date?: string | null
          status?: string | null
          student_id?: string
          supervisor_rating?: number | null
          supervisor_review?: string | null
          tasks?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "internships_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internships_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_connections: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string
          requester_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          requester_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          requester_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_connections_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_scores: {
        Row: {
          anonymous_cases_count: number | null
          avg_rating: number | null
          avg_resolution_days: number | null
          cases_accepted: number | null
          cases_resolved: number | null
          cases_won: number | null
          current_streak: number | null
          fast_resolutions: number | null
          generosity_points: number | null
          id: string
          lawyer_id: string
          pro_bono_count: number | null
          rating_sum: number | null
          total_score: number | null
          total_ratings: number | null
          updated_at: string | null
        }
        Insert: {
          anonymous_cases_count?: number | null
          avg_rating?: number | null
          avg_resolution_days?: number | null
          cases_accepted?: number | null
          cases_resolved?: number | null
          cases_won?: number | null
          current_streak?: number | null
          fast_resolutions?: number | null
          generosity_points?: number | null
          id?: string
          lawyer_id: string
          pro_bono_count?: number | null
          rating_sum?: number | null
          total_score?: number | null
          total_ratings?: number | null
          updated_at?: string | null
        }
        Update: {
          anonymous_cases_count?: number | null
          avg_rating?: number | null
          avg_resolution_days?: number | null
          cases_accepted?: number | null
          cases_resolved?: number | null
          cases_won?: number | null
          current_streak?: number | null
          fast_resolutions?: number | null
          generosity_points?: number | null
          id?: string
          lawyer_id?: string
          pro_bono_count?: number | null
          rating_sum?: number | null
          total_score?: number | null
          total_ratings?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_scores_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_applications: {
        Row: {
          created_at: string | null
          id: string
          intern_bar_number: string | null
          intern_city: string | null
          intern_email: string
          intern_id: string
          intern_name: string
          intern_phone: string
          intern_specialization: string | null
          lawyer_id: string
          message: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          intern_bar_number?: string | null
          intern_city?: string | null
          intern_email: string
          intern_id: string
          intern_name: string
          intern_phone: string
          intern_specialization?: string | null
          lawyer_id: string
          message?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          intern_bar_number?: string | null
          intern_city?: string | null
          intern_email?: string
          intern_id?: string
          intern_name?: string
          intern_phone?: string
          intern_specialization?: string | null
          lawyer_id?: string
          message?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_applications_intern_id_fkey"
            columns: ["intern_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_applications_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          case_id: string
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          case_id: string
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          case_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_heroes: {
        Row: {
          category: string
          created_at: string | null
          id: string
          key_stat: string | null
          lawyer_id: string
          month: number
          year: number
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          key_stat?: string | null
          lawyer_id: string
          month: number
          year: number
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          key_stat?: string | null
          lawyer_id?: string
          month?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_heroes_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_read: boolean | null
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          author_name: string | null
          content: string
          created_at: string | null
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          author_name?: string | null
          content: string
          created_at?: string | null
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          author_name?: string | null
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sahaay_conversations: {
        Row: {
          created_at: string | null
          id: string
          language: string | null
          messages: Json | null
          session_title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          language?: string | null
          messages?: Json | null
          session_title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          language?: string | null
          messages?: Json | null
          session_title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sahaay_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_connections: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string
          requester_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          requester_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          requester_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_connections_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_notifications: {
        Row: {
          created_at: string | null
          from_user_college: string | null
          from_user_id: string | null
          from_user_name: string | null
          id: string
          message: string | null
          post_id: string | null
          read: boolean | null
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          from_user_college?: string | null
          from_user_id?: string | null
          from_user_name?: string | null
          id?: string
          message?: string | null
          post_id?: string | null
          read?: boolean | null
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          from_user_college?: string | null
          from_user_id?: string | null
          from_user_name?: string | null
          id?: string
          message?: string | null
          post_id?: string | null
          read?: boolean | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_post_comments: {
        Row: {
          author_college: string | null
          author_id: string
          author_name: string | null
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          post_id: string
        }
        Insert: {
          author_college?: string | null
          author_id: string
          author_name?: string | null
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          post_id: string
        }
        Update: {
          author_college?: string | null
          author_id?: string
          author_name?: string | null
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "student_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      student_post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "student_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_posts: {
        Row: {
          author_id: string
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          post_type: string | null
          reposts_count: number | null
          tags: string[] | null
          title: string | null
        }
        Insert: {
          author_id: string
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          post_type?: string | null
          reposts_count?: number | null
          tags?: string[] | null
          title?: string | null
        }
        Update: {
          author_id?: string
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          post_type?: string | null
          reposts_count?: number | null
          tags?: string[] | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_key: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_key: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          accepting_interns: boolean | null
          age: number | null
          avatar_url: string | null
          bar_council_number: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          email: string
          fee_range_max: number | null
          fee_range_min: number | null
          full_name: string
          gender: string | null
          headline: string | null
          id: string
          languages_spoken: string[] | null
          phone: string | null
          preferred_language: string | null
          role: string
          specialization: string[] | null
          state: string | null
          university: string | null
          year_of_study: number | null
        }
        Insert: {
          accepting_interns?: boolean | null
          age?: number | null
          avatar_url?: string | null
          bar_council_number?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          fee_range_max?: number | null
          fee_range_min?: number | null
          full_name: string
          gender?: string | null
          headline?: string | null
          id: string
          languages_spoken?: string[] | null
          phone?: string | null
          preferred_language?: string | null
          role: string
          specialization?: string[] | null
          state?: string | null
          university?: string | null
          year_of_study?: number | null
        }
        Update: {
          accepting_interns?: boolean | null
          age?: number | null
          avatar_url?: string | null
          bar_council_number?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          fee_range_max?: number | null
          fee_range_min?: number | null
          full_name?: string
          gender?: string | null
          headline?: string | null
          id?: string
          languages_spoken?: string[] | null
          phone?: string | null
          preferred_language?: string | null
          role?: string
          specialization?: string[] | null
          state?: string | null
          university?: string | null
          year_of_study?: number | null
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
