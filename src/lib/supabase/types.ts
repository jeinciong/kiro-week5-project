export type LocationType = "online" | "in_person";
export type EventStatus = "draft" | "published" | "cancelled";
export type RsvpStatus = "confirmed" | "waitlisted" | "cancelled";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          is_organizer: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_organizer?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_organizer?: boolean;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          color: string | null;
          icon: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          color?: string | null;
          icon?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          color?: string | null;
          icon?: string | null;
        };
      };
      events: {
        Row: {
          id: string;
          organizer_id: string;
          category_id: string | null;
          title: string;
          description: string | null;
          location_type: LocationType;
          location_address: string | null;
          location_url: string | null;
          starts_at: string;
          ends_at: string;
          timezone: string;
          capacity: number;
          cover_image_url: string | null;
          status: EventStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organizer_id: string;
          category_id?: string | null;
          title: string;
          description?: string | null;
          location_type: LocationType;
          location_address?: string | null;
          location_url?: string | null;
          starts_at: string;
          ends_at: string;
          timezone?: string;
          capacity: number;
          cover_image_url?: string | null;
          status?: EventStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organizer_id?: string;
          category_id?: string | null;
          title?: string;
          description?: string | null;
          location_type?: LocationType;
          location_address?: string | null;
          location_url?: string | null;
          starts_at?: string;
          ends_at?: string;
          timezone?: string;
          capacity?: number;
          cover_image_url?: string | null;
          status?: EventStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      rsvps: {
        Row: {
          id: string;
          event_id: string;
          attendee_id: string;
          status: RsvpStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          attendee_id: string;
          status?: RsvpStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          attendee_id?: string;
          status?: RsvpStatus;
          created_at?: string;
        };
      };
    };
  };
}
