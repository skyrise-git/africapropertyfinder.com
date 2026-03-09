import { createClient } from "@/lib/supabase/client";
import type {
  Contact,
  ContactInput,
  ContactUpdateInput,
  ContactStatus,
} from "@/lib/types/contact.type";

class ContactService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any {
    return createClient();
  }

  async create(data: ContactInput): Promise<string> {
    const nowISO = new Date().toISOString();
    const { data: row, error } = await this.db
      .from("contacts")
      .insert({
        ...data,
        status: "new",
        createdAt: nowISO,
        updatedAt: nowISO,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return row.id;
  }

  async getAll(): Promise<Contact[]> {
    const { data, error } = await this.db
      .from("contacts")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Contact[];
  }

  async getById(id: string): Promise<Contact | null> {
    const { data, error } = await this.db
      .from("contacts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data as unknown as Contact;
  }

  async update(id: string, data: ContactUpdateInput): Promise<void> {
    if (!id) throw new Error("Contact ID is required");

    const { error } = await this.db
      .from("contacts")
      .update({ ...data, updatedAt: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db
      .from("contacts")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async getByStatus(status: ContactStatus): Promise<Contact[]> {
    const { data, error } = await this.db
      .from("contacts")
      .select("*")
      .eq("status", status)
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Contact[];
  }
}

export const contactService = new ContactService();
