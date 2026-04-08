export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          uid: string;
          name: string;
          email: string;
          phone: string;
          role: string;
          status: string;
          profilePicture: string | null;
          profilePictureFileKey: string | null;
          createdAt: string;
          updatedAt: string | null;
        };
        Insert: {
          id: string;
          name?: string;
          email?: string;
          phone?: string;
          role?: string;
          status?: string;
          profilePicture?: string | null;
          profilePictureFileKey?: string | null;
          createdAt?: string;
          updatedAt?: string | null;
        };
        Update: {
          name?: string;
          email?: string;
          phone?: string;
          role?: string;
          status?: string;
          profilePicture?: string | null;
          profilePictureFileKey?: string | null;
          updatedAt?: string | null;
        };
        Relationships: [];
      };
      properties: {
        Row: Record<string, Json>;
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
        Relationships: [];
      };
      savedProperties: {
        Row: {
          id: string;
          userId: string;
          propertyId: string;
          createdAt: string;
          updatedAt: string | null;
        };
        Insert: {
          id?: string;
          userId: string;
          propertyId: string;
          createdAt?: string;
          updatedAt?: string | null;
        };
        Update: {
          userId?: string;
          propertyId?: string;
          updatedAt?: string | null;
        };
        Relationships: [];
      };
      contacts: {
        Row: Record<string, Json>;
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
        Relationships: [];
      };
      blogs: {
        Row: Record<string, Json>;
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
        Relationships: [];
      };
      appointments: {
        Row: Record<string, Json>;
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
        Relationships: [];
      };
      attendance: {
        Row: Record<string, Json>;
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
        Relationships: [];
      };
      crime_stations: {
        Row: {
          id: string;
          station: string;
          district: string;
          province: string;
          safety_rating: number;
          safety_label: string;
          crime_index: number;
          total_serious_crimes_q1_2025: number;
          total_serious_crimes_q1_2024: number;
          trend: string;
          crime_breakdown: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          station: string;
          district: string;
          province: string;
          safety_rating: number;
          safety_label: string;
          crime_index: number;
          total_serious_crimes_q1_2025?: number;
          total_serious_crimes_q1_2024?: number;
          trend: string;
          crime_breakdown?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          station?: string;
          district?: string;
          province?: string;
          safety_rating?: number;
          safety_label?: string;
          crime_index?: number;
          total_serious_crimes_q1_2025?: number;
          total_serious_crimes_q1_2024?: number;
          trend?: string;
          crime_breakdown?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      price_estimates: {
        Row: {
          id: string;
          propertyId: string | null;
          country: string;
          province: string | null;
          city: string | null;
          suburb: string;
          listingType: string | null;
          propertyType: string | null;
          estimateLow: number;
          estimateMid: number;
          estimateHigh: number;
          yoyGrowthPct: number;
          demandLevel: string;
          priceTrend: Json;
          forecast6m: number | null;
          forecast12m: number | null;
          forecast36m: number | null;
          historicalPrices: Json;
          comparableCount: number;
          avgPricePerSqm: number | null;
          source: string;
          notes: string | null;
          createdAt: string;
          updatedAt: string | null;
        };
        Insert: {
          propertyId?: string | null;
          country?: string;
          province?: string | null;
          city?: string | null;
          suburb?: string;
          listingType?: string | null;
          propertyType?: string | null;
          estimateLow?: number;
          estimateMid?: number;
          estimateHigh?: number;
          yoyGrowthPct?: number;
          demandLevel?: string;
          priceTrend?: Json;
          forecast6m?: number | null;
          forecast12m?: number | null;
          forecast36m?: number | null;
          historicalPrices?: Json;
          comparableCount?: number;
          avgPricePerSqm?: number | null;
          source?: string;
          notes?: string | null;
        };
        Update: {
          propertyId?: string | null;
          country?: string;
          province?: string | null;
          city?: string | null;
          suburb?: string;
          listingType?: string | null;
          propertyType?: string | null;
          estimateLow?: number;
          estimateMid?: number;
          estimateHigh?: number;
          yoyGrowthPct?: number;
          demandLevel?: string;
          priceTrend?: Json;
          forecast6m?: number | null;
          forecast12m?: number | null;
          forecast36m?: number | null;
          historicalPrices?: Json;
          comparableCount?: number;
          avgPricePerSqm?: number | null;
          source?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
      saved_searches: {
        Row: {
          id: string;
          userId: string;
          name: string;
          filters: Json;
          notifyEmail: boolean;
          createdAt: string;
          updatedAt: string | null;
        };
        Insert: {
          userId: string;
          name?: string;
          filters: Json;
          notifyEmail?: boolean;
        };
        Update: {
          name?: string;
          filters?: Json;
          notifyEmail?: boolean;
        };
        Relationships: [];
      };
      countries: {
        Row: {
          code: string;
          name: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          code: string;
          name: string;
          active?: boolean;
        };
        Update: {
          code?: string;
          name?: string;
          active?: boolean;
        };
        Relationships: [];
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
