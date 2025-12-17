import { getArrFromObj } from "@ashirbad/js-core";
import { mutate } from "@atechhub/firebase";
import type {
  Contact,
  ContactInput,
  ContactUpdateInput,
} from "@/lib/types/contact.type";

class ContactService {
  /**
   * Create a new contact submission
   */
  async create(data: ContactInput): Promise<string> {
    const nowISO = new Date().toISOString();

    const contactData = {
      ...data,
      status: "new" as const,
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    const id = await mutate({
      action: "createWithId",
      path: "contacts",
      data: contactData,
      actionBy: "user",
    });

    return id;
  }

  /**
   * Get all contacts
   */
  async getAll(): Promise<Contact[]> {
    const data = await mutate({
      action: "get",
      path: "contacts",
    });
    const contacts = getArrFromObj(data || {}) as unknown as Contact[];

    // Sort by createdAt (newest first)
    return contacts.sort((a, b) => {
      const aTime =
        typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() : 0;
      const bTime =
        typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  /**
   * Get contact by ID
   */
  async getById(id: string): Promise<Contact | null> {
    const data = await mutate({
      action: "get",
      path: `contacts/${id}`,
    });
    if (!data) {
      return null;
    }
    return { ...data, id } as Contact;
  }

  /**
   * Update contact
   */
  async update(id: string, data: ContactUpdateInput): Promise<void> {
    if (!id) {
      throw new Error("Contact ID is required");
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    // Update all provided fields
    Object.keys(data).forEach((key) => {
      const value = data[key as keyof ContactUpdateInput];
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    await mutate({
      action: "update",
      path: `contacts/${id}`,
      data: updateData,
      actionBy: "admin",
    });
  }

  /**
   * Delete contact
   */
  async delete(id: string): Promise<void> {
    await mutate({
      action: "delete",
      path: `contacts/${id}`,
      actionBy: "admin",
    });
  }

  /**
   * Get contacts by status
   */
  async getByStatus(status: ContactStatus): Promise<Contact[]> {
    const contacts = await this.getAll();
    return contacts.filter((contact) => contact.status === status);
  }
}

export const contactService = new ContactService();

