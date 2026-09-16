export type Json =
  | string
  | number
  | boolean
  | null
  | {[key: string]: Json | undefined}
  | Json[];

export interface Database {
  public: {
    Tables: {
      artistes: {
        Row: {
          albums: Json | null;
          created_at: string;
          id: string;
          name: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          albums?: Json | null;
          created_at?: string;
          id?: string;
          name?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Update: {
          albums?: Json | null;
          created_at?: string;
          id?: string;
          name?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'artistes_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
