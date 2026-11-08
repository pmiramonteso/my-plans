
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "categories": {
                  Row: {
                    "color": string,"icon": string,"id": number,"is_summit": boolean,"slug": string,"sort_order": number,"stat_key": string
                  }
                  ComputedFields: never
                  Insert: {
                    "color": string,"icon": string,"id": number,"is_summit"?: boolean,"slug": string,"sort_order"?: number,"stat_key": string
                  }
                  Update: {
                    "color"?: string,"icon"?: string,"id"?: number,"is_summit"?: boolean,"slug"?: string,"sort_order"?: number,"stat_key"?: string
                  }
                  Relationships: [
                    
                  ]
                },"event_participants": {
                  Row: {
                    "attended": boolean | null,"created_at": string,"event_id": string,"invited_by": string | null,"responded_at": string | null,"role": Database["public"]['Enums']["member_role"],"rsvp": Database["public"]['Enums']["rsvp_status"],"source": Database["public"]['Enums']["participant_source"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attended"?: boolean | null,"created_at"?: string,"event_id": string,"invited_by"?: string | null,"responded_at"?: string | null,"role"?: Database["public"]['Enums']["member_role"],"rsvp"?: Database["public"]['Enums']["rsvp_status"],"source"?: Database["public"]['Enums']["participant_source"],"user_id": string
                  }
                  Update: {
                    "attended"?: boolean | null,"created_at"?: string,"event_id"?: string,"invited_by"?: string | null,"responded_at"?: string | null,"role"?: Database["public"]['Enums']["member_role"],"rsvp"?: Database["public"]['Enums']["rsvp_status"],"source"?: Database["public"]['Enums']["participant_source"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_participants_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "completed_participations"
      referencedColumns: ["event_id"]
    },{
      foreignKeyName: "event_participants_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_participants_invited_by_fkey"
      columns: ["invited_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_participants_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"event_peaks": {
                  Row: {
                    "difficulty": number | null,"distance_km": number | null,"duration_min": number | null,"elevation_gain_m": number | null,"event_id": string,"peak_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "difficulty"?: number | null,"distance_km"?: number | null,"duration_min"?: number | null,"elevation_gain_m"?: number | null,"event_id": string,"peak_id": string
                  }
                  Update: {
                    "difficulty"?: number | null,"distance_km"?: number | null,"duration_min"?: number | null,"elevation_gain_m"?: number | null,"event_id"?: string,"peak_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_peaks_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "completed_participations"
      referencedColumns: ["event_id"]
    },{
      foreignKeyName: "event_peaks_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_peaks_peak_id_fkey"
      columns: ["peak_id"]
isOneToOne: false
      referencedRelation: "peaks"
      referencedColumns: ["id"]
    }
                  ]
                },"event_photos": {
                  Row: {
                    "caption": string | null,"created_at": string,"event_id": string,"height": number,"id": string,"size_bytes": number,"storage_path": string,"thumb_path": string,"uploader_id": string,"width": number
                  }
                  ComputedFields: never
                  Insert: {
                    "caption"?: string | null,"created_at"?: string,"event_id": string,"height": number,"id"?: string,"size_bytes": number,"storage_path": string,"thumb_path": string,"uploader_id": string,"width": number
                  }
                  Update: {
                    "caption"?: string | null,"created_at"?: string,"event_id"?: string,"height"?: number,"id"?: string,"size_bytes"?: number,"storage_path"?: string,"thumb_path"?: string,"uploader_id"?: string,"width"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_photos_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "completed_participations"
      referencedColumns: ["event_id"]
    },{
      foreignKeyName: "event_photos_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_photos_uploader_id_fkey"
      columns: ["uploader_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"events": {
                  Row: {
                    "address": string | null,"all_day": boolean,"cancelled_at": string | null,"category_id": number,"completed_at": string | null,"cover_path": string | null,"created_at": string,"creator_id": string,"deleted_at": string | null,"description": string | null,"ends_at": string | null,"external_url": string | null,"extra_info": string | null,"google_place_id": string | null,"id": string,"lat": number | null,"lng": number | null,"location_name": string | null,"plan_id": string | null,"starts_at": string,"status": Database["public"]['Enums']["event_status"],"timezone": string,"title": string,"updated_at": string,"visibility": Database["public"]['Enums']["visibility"]
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"all_day"?: boolean,"cancelled_at"?: string | null,"category_id": number,"completed_at"?: string | null,"cover_path"?: string | null,"created_at"?: string,"creator_id": string,"deleted_at"?: string | null,"description"?: string | null,"ends_at"?: string | null,"external_url"?: string | null,"extra_info"?: string | null,"google_place_id"?: string | null,"id"?: string,"lat"?: number | null,"lng"?: number | null,"location_name"?: string | null,"plan_id"?: string | null,"starts_at": string,"status"?: Database["public"]['Enums']["event_status"],"timezone"?: string,"title": string,"updated_at"?: string,"visibility"?: Database["public"]['Enums']["visibility"]
                  }
                  Update: {
                    "address"?: string | null,"all_day"?: boolean,"cancelled_at"?: string | null,"category_id"?: number,"completed_at"?: string | null,"cover_path"?: string | null,"created_at"?: string,"creator_id"?: string,"deleted_at"?: string | null,"description"?: string | null,"ends_at"?: string | null,"external_url"?: string | null,"extra_info"?: string | null,"google_place_id"?: string | null,"id"?: string,"lat"?: number | null,"lng"?: number | null,"location_name"?: string | null,"plan_id"?: string | null,"starts_at"?: string,"status"?: Database["public"]['Enums']["event_status"],"timezone"?: string,"title"?: string,"updated_at"?: string,"visibility"?: Database["public"]['Enums']["visibility"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "events_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "events_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    }
                  ]
                },"friendships": {
                  Row: {
                    "accepted_at": string | null,"created_at": string,"requested_by": string,"status": Database["public"]['Enums']["friendship_status"],"user_a": string,"user_b": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"created_at"?: string,"requested_by": string,"status"?: Database["public"]['Enums']["friendship_status"],"user_a": string,"user_b": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"created_at"?: string,"requested_by"?: string,"status"?: Database["public"]['Enums']["friendship_status"],"user_a"?: string,"user_b"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "friendships_requested_by_fkey"
      columns: ["requested_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "friendships_user_a_fkey"
      columns: ["user_a"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "friendships_user_b_fkey"
      columns: ["user_b"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"data": NonNullable<Json>,"entity_id": string,"entity_type": string,"id": string,"read_at": string | null,"recipient_id": string,"type": Database["public"]['Enums']["notification_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"data"?: NonNullable<Json>,"entity_id": string,"entity_type": string,"id"?: string,"read_at"?: string | null,"recipient_id": string,"type": Database["public"]['Enums']["notification_type"]
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"data"?: NonNullable<Json>,"entity_id"?: string,"entity_type"?: string,"id"?: string,"read_at"?: string | null,"recipient_id"?: string,"type"?: Database["public"]['Enums']["notification_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"peaks": {
                  Row: {
                    "altitude_m": number,"country": string | null,"created_at": string,"created_by": string | null,"id": string,"lat": number | null,"lng": number | null,"name": string,"range_name": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "altitude_m": number,"country"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"lat"?: number | null,"lng"?: number | null,"name": string,"range_name"?: string | null
                  }
                  Update: {
                    "altitude_m"?: number,"country"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"lat"?: number | null,"lng"?: number | null,"name"?: string,"range_name"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "peaks_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_invitations": {
                  Row: {
                    "created_at": string,"interest": Database["public"]['Enums']["plan_interest"],"invited_by": string | null,"plan_id": string,"responded_at": string | null,"role": Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"interest"?: Database["public"]['Enums']["plan_interest"],"invited_by"?: string | null,"plan_id": string,"responded_at"?: string | null,"role"?: Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"interest"?: Database["public"]['Enums']["plan_interest"],"invited_by"?: string | null,"plan_id"?: string,"responded_at"?: string | null,"role"?: Database["public"]['Enums']["member_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_invitations_invited_by_fkey"
      columns: ["invited_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plan_invitations_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plan_invitations_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_peaks": {
                  Row: {
                    "peak_id": string,"plan_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "peak_id": string,"plan_id": string
                  }
                  Update: {
                    "peak_id"?: string,"plan_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_peaks_peak_id_fkey"
      columns: ["peak_id"]
isOneToOne: false
      referencedRelation: "peaks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plan_peaks_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    }
                  ]
                },"plans": {
                  Row: {
                    "address": string | null,"category_id": number,"cover_path": string | null,"created_at": string,"creator_id": string,"deleted_at": string | null,"description": string | null,"difficulty": number | null,"external_url": string | null,"google_place_id": string | null,"id": string,"lat": number | null,"lng": number | null,"location_name": string | null,"status": Database["public"]['Enums']["plan_status"],"title": string,"updated_at": string,"visibility": Database["public"]['Enums']["visibility"]
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"category_id": number,"cover_path"?: string | null,"created_at"?: string,"creator_id": string,"deleted_at"?: string | null,"description"?: string | null,"difficulty"?: number | null,"external_url"?: string | null,"google_place_id"?: string | null,"id"?: string,"lat"?: number | null,"lng"?: number | null,"location_name"?: string | null,"status"?: Database["public"]['Enums']["plan_status"],"title": string,"updated_at"?: string,"visibility"?: Database["public"]['Enums']["visibility"]
                  }
                  Update: {
                    "address"?: string | null,"category_id"?: number,"cover_path"?: string | null,"created_at"?: string,"creator_id"?: string,"deleted_at"?: string | null,"description"?: string | null,"difficulty"?: number | null,"external_url"?: string | null,"google_place_id"?: string | null,"id"?: string,"lat"?: number | null,"lng"?: number | null,"location_name"?: string | null,"status"?: Database["public"]['Enums']["plan_status"],"title"?: string,"updated_at"?: string,"visibility"?: Database["public"]['Enums']["visibility"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "plans_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plans_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"bio": string | null,"created_at": string,"display_name": string,"id": string,"locale": Database["public"]['Enums']["app_locale"],"onboarded_at": string | null,"timezone": string,"updated_at": string,"username": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"display_name": string,"id": string,"locale"?: Database["public"]['Enums']["app_locale"],"onboarded_at"?: string | null,"timezone"?: string,"updated_at"?: string,"username"?: string | null
                  }
                  Update: {
                    "avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"display_name"?: string,"id"?: string,"locale"?: Database["public"]['Enums']["app_locale"],"onboarded_at"?: string | null,"timezone"?: string,"updated_at"?: string,"username"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "completed_participations": {
                  Row: {
                    "address": string | null,"category_id": number,"completed_at": string | null,"cover_path": string | null,"description": string | null,"event_id": string,"google_place_id": string | null,"lat": number | null,"lng": number | null,"location_name": string | null,"plan_id": string | null,"starts_at": string,"timezone": string,"title": string,"user_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "event_participants_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "events_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "events_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "cancel_event":
{ Args: { "p_event": string }; Returns: undefined
                           },
"complete_event":
{ Args: { "p_attendees": (string)[],"p_event": string }; Returns: undefined
                           },
"create_event":
{ Args: { "p_address"?: string,"p_all_day"?: boolean,"p_category_id": number,"p_cover_path"?: string,"p_description"?: string,"p_ends_at"?: string,"p_external_url"?: string,"p_extra_info"?: string,"p_google_place_id"?: string,"p_lat"?: number,"p_lng"?: number,"p_location_name"?: string,"p_participant_ids"?: (string)[],"p_plan_id"?: string,"p_starts_at": string,"p_timezone"?: string,"p_title": string,"p_visibility"?: Database["public"]['Enums']["visibility"] }; Returns: string
                           },
"delete_event":
{ Args: { "p_event": string }; Returns: undefined
                           },
"delete_plan":
{ Args: { "p_plan": string }; Returns: undefined
                           },
"get_friend_feed":
{ Args: { "p_before"?: string,"p_limit"?: number }; Returns: {
              "actor_id": string,"category_id": number,"cover_path": string,"data": Json,"entity_id": string,"kind": string,"occurred_at": string,"title": string
            }[]
                           },
"get_friends_shared_counts":
{ Args: Record<PropertyKey, never>; Returns: {
              "friend_id": string,"last_at": string,"shared_count": number
            }[]
                           },
"get_shared_stats":
{ Args: { "p_friend": string,"p_year"?: number }; Returns: Json
                           },
"get_user_stats":
{ Args: { "p_user"?: string,"p_year"?: number }; Returns: Json
                           },
"mark_all_notifications_read":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"remove_friend":
{ Args: { "p_user": string }; Returns: undefined
                           },
"respond_friend_request":
{ Args: { "p_accept": boolean,"p_user": string }; Returns: undefined
                           },
"search_profiles":
{ Args: { "p_limit"?: number,"p_query": string }; Returns: {
              "avatar_url": string,"display_name": string,"friendship": Database["public"]['Enums']["friendship_status"],"id": string,"requested_by_me": boolean,"username": string
            }[]
                           },
"send_friend_request":
{ Args: { "p_user": string }; Returns: Database["public"]['Enums']["friendship_status"]
                           },
"set_plan_archived":
{ Args: { "p_archived": boolean,"p_plan": string }; Returns: undefined
                           },
"set_plan_interest":
{ Args: { "p_interest": Database["public"]['Enums']["plan_interest"],"p_plan": string }; Returns: undefined
                           }
          }
          Enums: {
            "app_locale": "es"|"en"|"ca","event_status": "scheduled"|"completed"|"cancelled","friendship_status": "pending"|"accepted","member_role": "host"|"cohost"|"guest","notification_type": "friend_request"|"friend_accepted"|"plan_invite"|"plan_interest"|"event_invite"|"event_rsvp"|"event_updated"|"event_cancelled"|"event_completed"|"photos_added","participant_source": "direct"|"plan","plan_interest": "pending"|"interested"|"not_interested","plan_status": "open"|"scheduled"|"done"|"archived","rsvp_status": "pending"|"going"|"not_going","visibility": "private"|"invited"|"friends"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "app_locale": ["es", "en", "ca"],"event_status": ["scheduled", "completed", "cancelled"],"friendship_status": ["pending", "accepted"],"member_role": ["host", "cohost", "guest"],"notification_type": ["friend_request", "friend_accepted", "plan_invite", "plan_interest", "event_invite", "event_rsvp", "event_updated", "event_cancelled", "event_completed", "photos_added"],"participant_source": ["direct", "plan"],"plan_interest": ["pending", "interested", "not_interested"],"plan_status": ["open", "scheduled", "done", "archived"],"rsvp_status": ["pending", "going", "not_going"],"visibility": ["private", "invited", "friends"]
          }
        }
} as const
