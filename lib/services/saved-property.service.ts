import { getArrFromObj } from "@ashirbad/js-core";
import { mutate } from "@atechhub/firebase";
import type {
  SavedProperty,
  SavedPropertyInput,
} from "@/lib/types/saved-property.type";

class SavedPropertyService {
  /**
   * Save a property for a user
   */
  async save(data: SavedPropertyInput): Promise<string> {
    // Check if already saved
    const existing = await this.findByUserAndProperty(
      data.userId,
      data.propertyId
    );
    if (existing) {
      return existing.id;
    }

    const nowISO = new Date().toISOString();

    const savedPropertyData = {
      userId: data.userId,
      propertyId: data.propertyId,
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    const id = await mutate({
      action: "createWithId",
      path: "savedProperties",
      data: savedPropertyData,
      actionBy: data.userId,
    });

    return id;
  }

  /**
   * Unsave a property (delete saved property)
   */
  async unsave(userId: string, propertyId: string): Promise<void> {
    const saved = await this.findByUserAndProperty(userId, propertyId);
    if (!saved) {
      throw new Error("Property is not saved");
    }

    await mutate({
      action: "delete",
      path: `savedProperties/${saved.id}`,
      actionBy: userId,
    });
  }

  /**
   * Find saved property by user and property ID
   */
  async findByUserAndProperty(
    userId: string,
    propertyId: string
  ): Promise<SavedProperty | null> {
    const allSaved = await this.getAll();
    const found = allSaved.find(
      (sp) => sp.userId === userId && sp.propertyId === propertyId
    );
    return found || null;
  }

  /**
   * Get all saved properties
   */
  async getAll(): Promise<SavedProperty[]> {
    const data = await mutate({
      action: "get",
      path: "savedProperties",
    });
    const savedProperties = getArrFromObj(data || {}) as unknown as SavedProperty[];

    // Sort by createdAt (newest first)
    return savedProperties.sort((a, b) => {
      const aTime =
        typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() : 0;
      const bTime =
        typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  /**
   * Get saved properties by user ID
   */
  async getByUserId(userId: string): Promise<SavedProperty[]> {
    const allSaved = await this.getAll();
    return allSaved.filter((sp) => sp.userId === userId);
  }

  /**
   * Get saved property by ID
   */
  async getById(id: string): Promise<SavedProperty | null> {
    const data = await mutate({
      action: "get",
      path: `savedProperties/${id}`,
    });
    if (!data) {
      return null;
    }
    return { ...data, id } as SavedProperty;
  }
}

export const savedPropertyService = new SavedPropertyService();

