import { createClient } from "@/lib/supabase/client";
import type {
  Property,
  PropertyInput,
  PropertyUpdateInput,
} from "@/lib/types/property.type";

class PropertyService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any {
    return createClient();
  }

  async create(data: PropertyInput): Promise<string> {
    const nowISO = new Date().toISOString();
    const { data: row, error } = await this.db
      .from("properties")
      .insert({ ...data, createdAt: nowISO, updatedAt: nowISO })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return row.id;
  }

  async getAll(): Promise<Property[]> {
    const { data, error } = await this.db
      .from("properties")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Property[];
  }

  async getById(id: string): Promise<Property | null> {
    const { data, error } = await this.db
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data as unknown as Property;
  }

  async update(id: string, data: PropertyUpdateInput): Promise<void> {
    if (!id) throw new Error("Property ID is required");

    const { error } = await this.db
      .from("properties")
      .update({ ...data, updatedAt: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db
      .from("properties")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async getByListingType(listingType: string): Promise<Property[]> {
    const { data, error } = await this.db
      .from("properties")
      .select("*")
      .eq("listingType", listingType)
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Property[];
  }

  async search(query: string): Promise<Property[]> {
    const { data, error } = await this.db
      .from("properties")
      .select("*")
      .or(
        `title.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`
      )
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Property[];
  }

  async getByUserId(userId: string): Promise<Property[]> {
    const { data, error } = await this.db
      .from("properties")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Property[];
  }
}

export const propertyService = new PropertyService();
