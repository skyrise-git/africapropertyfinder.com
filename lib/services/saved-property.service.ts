import { createClient } from "@/lib/supabase/client";
import type {
  SavedProperty,
  SavedPropertyInput,
} from "@/lib/types/saved-property.type";

class SavedPropertyService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any {
    return createClient();
  }

  async save(data: SavedPropertyInput): Promise<string> {
    const existing = await this.findByUserAndProperty(
      data.userId,
      data.propertyId
    );
    if (existing) return existing.id;

    const nowISO = new Date().toISOString();
    const { data: row, error } = await this.db
      .from("savedProperties")
      .insert({
        userId: data.userId,
        propertyId: data.propertyId,
        createdAt: nowISO,
        updatedAt: nowISO,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return row.id;
  }

  async unsave(userId: string, propertyId: string): Promise<void> {
    const { error } = await this.db
      .from("savedProperties")
      .delete()
      .eq("userId", userId)
      .eq("propertyId", propertyId);

    if (error) throw new Error(error.message);
  }

  async findByUserAndProperty(
    userId: string,
    propertyId: string
  ): Promise<SavedProperty | null> {
    const { data, error } = await this.db
      .from("savedProperties")
      .select("*")
      .eq("userId", userId)
      .eq("propertyId", propertyId)
      .single();

    if (error) return null;
    return data as unknown as SavedProperty;
  }

  async getAll(): Promise<SavedProperty[]> {
    const { data, error } = await this.db
      .from("savedProperties")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as SavedProperty[];
  }

  async getByUserId(userId: string): Promise<SavedProperty[]> {
    const { data, error } = await this.db
      .from("savedProperties")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as SavedProperty[];
  }

  async getById(id: string): Promise<SavedProperty | null> {
    const { data, error } = await this.db
      .from("savedProperties")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data as unknown as SavedProperty;
  }
}

export const savedPropertyService = new SavedPropertyService();
