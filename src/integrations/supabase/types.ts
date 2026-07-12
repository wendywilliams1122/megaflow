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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      advertisements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          placement: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          placement?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          placement?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      automod_rules: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          hits: number
          id: string
          is_enabled: boolean
          is_regex: boolean
          name: string
          pattern: string
          target_scope: string
          updated_at: string
        }
        Insert: {
          action?: string
          created_at?: string
          created_by?: string | null
          hits?: number
          id?: string
          is_enabled?: boolean
          is_regex?: boolean
          name: string
          pattern: string
          target_scope?: string
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          hits?: number
          id?: string
          is_enabled?: boolean
          is_regex?: boolean
          name?: string
          pattern?: string
          target_scope?: string
          updated_at?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string
          criteria: Json
          description: string
          icon: string
          id: string
          name: string
          tier: string
        }
        Insert: {
          created_at?: string
          criteria?: Json
          description: string
          icon?: string
          id: string
          name: string
          tier?: string
        }
        Update: {
          created_at?: string
          criteria?: Json
          description?: string
          icon?: string
          id?: string
          name?: string
          tier?: string
        }
        Relationships: []
      }
      blocked_email_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          note: string | null
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      conversations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          last_message_at: string | null
          status: string
          status_changed_by: string | null
          status_note: string | null
          updated_at: string
          user_max: string
          user_min: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
          status_changed_by?: string | null
          status_note?: string | null
          updated_at?: string
          user_max: string
          user_min: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
          status_changed_by?: string | null
          status_note?: string | null
          updated_at?: string
          user_max?: string
          user_min?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          starts_at: string | null
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          starts_at?: string | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          starts_at?: string | null
          updated_at?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string | null
          created_at: string
          id: string
          is_staff_intervention: boolean
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_staff_intervention?: boolean
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_staff_intervention?: boolean
          read_at?: string | null
          recipient_id?: string
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
      mod_actions: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          reason: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          reason?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          reason?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          metadata: Json
          post_id: string | null
          thread_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json
          post_id?: string | null
          thread_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json
          post_id?: string | null
          thread_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_contact: string
          buyer_id: string | null
          buyer_name: string
          created_at: string
          currency: string
          id: string
          method: string
          note: string | null
          product_id: string | null
          product_slug: string | null
          product_title: string
          quantity: number
          status: string
          unit_price_cents: number
          updated_at: string
        }
        Insert: {
          buyer_contact: string
          buyer_id?: string | null
          buyer_name: string
          created_at?: string
          currency?: string
          id?: string
          method?: string
          note?: string | null
          product_id?: string | null
          product_slug?: string | null
          product_title: string
          quantity?: number
          status?: string
          unit_price_cents?: number
          updated_at?: string
        }
        Update: {
          buyer_contact?: string
          buyer_id?: string | null
          buyer_name?: string
          created_at?: string
          currency?: string
          id?: string
          method?: string
          note?: string | null
          product_id?: string | null
          product_slug?: string | null
          product_title?: string
          quantity?: number
          status?: string
          unit_price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string
          body_public: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deleted_reason: string | null
          id: string
          is_deleted: boolean
          reaction_counts: Json
          thread_id: string
          updated_at: string
          vote_score: number
        }
        Insert: {
          author_id: string
          body: string
          body_public?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          id?: string
          is_deleted?: boolean
          reaction_counts?: Json
          thread_id: string
          updated_at?: string
          vote_score?: number
        }
        Update: {
          author_id?: string
          body?: string
          body_public?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          id?: string
          is_deleted?: boolean
          reaction_counts?: Json
          thread_id?: string
          updated_at?: string
          vote_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_profile_fk"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          featured: boolean
          id: string
          image_url: string | null
          price_cents: number
          slug: string
          status: string
          stock: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          price_cents?: number
          slug: string
          status?: string
          stock?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          price_cents?: number
          slug?: string
          status?: string
          stock?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profile_ips: {
        Row: {
          last_ip: string | null
          last_seen_at: string
          last_user_agent: string | null
          signup_ip: string | null
          signup_user_agent: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          last_ip?: string | null
          last_seen_at?: string
          last_user_agent?: string | null
          signup_ip?: string | null
          signup_user_agent?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          last_ip?: string | null
          last_seen_at?: string
          last_user_agent?: string | null
          signup_ip?: string | null
          signup_user_agent?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_moderation: {
        Row: {
          ban_reason: string | null
          updated_at: string
          user_id: string
          warnings: number
        }
        Insert: {
          ban_reason?: string | null
          updated_at?: string
          user_id: string
          warnings?: number
        }
        Update: {
          ban_reason?: string | null
          updated_at?: string
          user_id?: string
          warnings?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned_until: string | null
          bio: string | null
          cover_url: string | null
          created_at: string
          display_name: string | null
          force_reauth_at: string | null
          headline: string | null
          id: string
          is_banned: boolean
          is_shadow_banned: boolean
          location: string | null
          points: number
          referral_code: string
          referred_by: string | null
          reputation: number
          social_github: string | null
          social_linkedin: string | null
          social_twitter: string | null
          staff_badge: string | null
          totp_enabled: boolean
          trust_score: number
          updated_at: string
          username: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          banned_until?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          force_reauth_at?: string | null
          headline?: string | null
          id: string
          is_banned?: boolean
          is_shadow_banned?: boolean
          location?: string | null
          points?: number
          referral_code: string
          referred_by?: string | null
          reputation?: number
          social_github?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          staff_badge?: string | null
          totp_enabled?: boolean
          trust_score?: number
          updated_at?: string
          username: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          banned_until?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          force_reauth_at?: string | null
          headline?: string | null
          id?: string
          is_banned?: boolean
          is_shadow_banned?: boolean
          location?: string | null
          points?: number
          referral_code?: string
          referred_by?: string | null
          reputation?: number
          social_github?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          staff_badge?: string | null
          totp_enabled?: boolean
          trust_score?: number
          updated_at?: string
          username?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          created_at: string
          id: string
          reaction: Database["public"]["Enums"]["reaction_type"]
          target_id: string
          target_type: Database["public"]["Enums"]["reaction_target"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction: Database["public"]["Enums"]["reaction_type"]
          target_id: string
          target_type: Database["public"]["Enums"]["reaction_target"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction?: Database["public"]["Enums"]["reaction_type"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["reaction_target"]
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          category: Database["public"]["Enums"]["report_category"]
          created_at: string
          id: string
          link_url: string | null
          reason: string
          reporter_id: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["report_category"]
          created_at?: string
          id?: string
          link_url?: string | null
          reason: string
          reporter_id: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["report_category"]
          created_at?: string
          id?: string
          link_url?: string | null
          reason?: string
          reporter_id?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target"]
          updated_at?: string
        }
        Relationships: []
      }
      scheduled_broadcasts: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          link: string
          recipients: number | null
          scheduled_for: string
          sent_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string
          recipients?: number | null
          scheduled_for: string
          sent_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string
          recipients?: number | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_broadcasts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          announcement: string | null
          announcement_active: boolean
          brand_name: string
          contact_email: string | null
          downloads_min_points: number
          id: boolean
          maintenance_message: string | null
          maintenance_mode: boolean
          max_comments_per_day: number
          max_threads_per_day: number
          points_comment: number
          points_referral: number
          points_thread: number
          points_upvote: number
          updated_at: string
          warnings_before_ban: number
          whatsapp_number: string | null
        }
        Insert: {
          announcement?: string | null
          announcement_active?: boolean
          brand_name?: string
          contact_email?: string | null
          downloads_min_points?: number
          id?: boolean
          maintenance_message?: string | null
          maintenance_mode?: boolean
          max_comments_per_day?: number
          max_threads_per_day?: number
          points_comment?: number
          points_referral?: number
          points_thread?: number
          points_upvote?: number
          updated_at?: string
          warnings_before_ban?: number
          whatsapp_number?: string | null
        }
        Update: {
          announcement?: string | null
          announcement_active?: boolean
          brand_name?: string
          contact_email?: string | null
          downloads_min_points?: number
          id?: boolean
          maintenance_message?: string | null
          maintenance_mode?: boolean
          max_comments_per_day?: number
          max_threads_per_day?: number
          points_comment?: number
          points_referral?: number
          points_thread?: number
          points_upvote?: number
          updated_at?: string
          warnings_before_ban?: number
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      thread_tags: {
        Row: {
          tag_id: string
          thread_id: string
        }
        Insert: {
          tag_id: string
          thread_id: string
        }
        Update: {
          tag_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_tags_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          author_id: string
          body: string
          body_public: string | null
          category_id: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deleted_reason: string | null
          id: string
          is_deleted: boolean
          is_locked: boolean
          is_pinned: boolean
          last_activity_at: string
          original_category_id: string | null
          reaction_counts: Json
          reply_count: number
          slug: string
          title: string
          updated_at: string
          view_count: number
          vote_score: number
        }
        Insert: {
          author_id: string
          body: string
          body_public?: string | null
          category_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          id?: string
          is_deleted?: boolean
          is_locked?: boolean
          is_pinned?: boolean
          last_activity_at?: string
          original_category_id?: string | null
          reaction_counts?: Json
          reply_count?: number
          slug: string
          title: string
          updated_at?: string
          view_count?: number
          vote_score?: number
        }
        Update: {
          author_id?: string
          body?: string
          body_public?: string | null
          category_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          id?: string
          is_deleted?: boolean
          is_locked?: boolean
          is_pinned?: boolean
          last_activity_at?: string
          original_category_id?: string | null
          reaction_counts?: Json
          reply_count?: number
          slug?: string
          title?: string
          updated_at?: string
          view_count?: number
          vote_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "threads_author_profile_fk"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_original_category_id_fkey"
            columns: ["original_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string
          badge_id: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
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
      user_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          pinned: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          pinned?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          pinned?: boolean
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
      votes: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_award_badge: {
        Args: { _badge_id: string; _user_id: string }
        Returns: undefined
      }
      admin_broadcast: {
        Args: { _body: string; _link: string; _title: string }
        Returns: number
      }
      admin_export_user_data: { Args: { _user_id: string }; Returns: Json }
      admin_force_signout: { Args: { _user_id: string }; Returns: undefined }
      admin_log_impersonate: {
        Args: { _reason?: string; _user_id: string }
        Returns: undefined
      }
      admin_log_mod_action: {
        Args: {
          _action: string
          _metadata?: Json
          _reason?: string
          _target_id: string
          _target_type: string
        }
        Returns: string
      }
      admin_merge_tags: {
        Args: { _from: string; _to: string }
        Returns: undefined
      }
      admin_purge_thread: { Args: { _thread_id: string }; Returns: undefined }
      admin_restore_thread: { Args: { _thread_id: string }; Returns: undefined }
      admin_revoke_badge: {
        Args: { _badge_id: string; _user_id: string }
        Returns: undefined
      }
      admin_shadow_ban: {
        Args: { _enabled: boolean; _reason?: string; _user_id: string }
        Returns: undefined
      }
      admin_soft_delete_thread: {
        Args: { _reason?: string; _thread_id: string }
        Returns: undefined
      }
      admin_temp_ban: {
        Args: { _reason?: string; _until: string; _user_id: string }
        Returns: undefined
      }
      admin_unban: {
        Args: { _reason?: string; _user_id: string }
        Returns: undefined
      }
      can_view_downloads: { Args: { _user_id: string }; Returns: boolean }
      can_view_spoiler: { Args: { _user_id: string }; Returns: boolean }
      check_and_award_badges: { Args: { _user_id: string }; Returns: undefined }
      create_notification: {
        Args: {
          _actor_id: string
          _body: string
          _link: string
          _metadata?: Json
          _post_id: string
          _thread_id: string
          _title: string
          _type: Database["public"]["Enums"]["notification_type"]
          _user_id: string
        }
        Returns: string
      }
      expire_temp_bans: { Args: never; Returns: number }
      get_full_body: {
        Args: { _target_id: string; _target_type: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_email_domain_blocked: { Args: { _email: string }; Returns: boolean }
      level_for_points: { Args: { _pts: number }; Returns: number }
      log_session_device: {
        Args: { _ip: string; _user_agent: string }
        Returns: undefined
      }
      run_due_broadcasts: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      notification_type:
        | "reply"
        | "mention"
        | "reaction"
        | "bookmark"
        | "badge"
        | "system"
        | "moderation"
      reaction_target: "thread" | "post"
      reaction_type: "like" | "love" | "haha" | "insightful" | "thanks"
      report_category:
        | "spam"
        | "harassment"
        | "broken_link"
        | "inappropriate"
        | "misinformation"
        | "copyright"
        | "other"
      report_status: "open" | "resolved" | "dismissed"
      report_target: "thread" | "post" | "user"
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
      app_role: ["admin", "moderator", "user"],
      notification_type: [
        "reply",
        "mention",
        "reaction",
        "bookmark",
        "badge",
        "system",
        "moderation",
      ],
      reaction_target: ["thread", "post"],
      reaction_type: ["like", "love", "haha", "insightful", "thanks"],
      report_category: [
        "spam",
        "harassment",
        "broken_link",
        "inappropriate",
        "misinformation",
        "copyright",
        "other",
      ],
      report_status: ["open", "resolved", "dismissed"],
      report_target: ["thread", "post", "user"],
    },
  },
} as const
