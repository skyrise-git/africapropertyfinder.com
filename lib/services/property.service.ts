import { getArrFromObj } from "@ashirbad/js-core";
import { mutate } from "@atechhub/firebase";
import type {
  Property,
  PropertyInput,
  PropertyUpdateInput,
} from "@/lib/types/property.type";

class PropertyService {
  /**
   * Create a new property
   */
  async create(data: PropertyInput): Promise<string> {
    const nowISO = new Date().toISOString();

    const propertyData = {
      ...data,
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    const id = await mutate({
      action: "createWithId",
      path: "properties",
      data: propertyData,
      actionBy: "admin",
    });

    return id;
  }

  /**
   * Get all properties
   */
  async getAll(): Promise<Property[]> {
    const data = await mutate({
      action: "get",
      path: "properties",
    });
    const properties = getArrFromObj(data || {}) as unknown as Property[];

    // Sort by createdAt (newest first)
    return properties.sort((a, b) => {
      const aTime =
        typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() : 0;
      const bTime =
        typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  /**
   * Get property by ID
   */
  async getById(id: string): Promise<Property | null> {
    const data = await mutate({
      action: "get",
      path: `properties/${id}`,
    });
    if (!data) {
      return null;
    }
    // Add id to the property object
    return { ...data, id } as Property;
  }

  /**
   * Update property
   */
  async update(id: string, data: PropertyUpdateInput): Promise<void> {
    if (!id) {
      throw new Error("Property ID is required");
    }

    // Try to get existing property to check if it exists
    let existingProperty: Property | null = null;
    try {
      existingProperty = await this.getById(id);
    } catch {
      // If getById fails, try getting from getAll
      const allProperties = await this.getAll();
      existingProperty = allProperties.find((p) => p.id === id) || null;
    }

    // If still not found, check if property exists in database
    if (!existingProperty) {
      const allProperties = await this.getAll();
      const propertyExists = allProperties.find((p) => p.id === id);
      if (!propertyExists) {
        throw new Error(`Property with ID "${id}" not found`);
      }
      existingProperty = propertyExists;
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    // Update all provided fields
    Object.keys(data).forEach((key) => {
      const value = data[key as keyof PropertyUpdateInput];
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    await mutate({
      action: "update",
      path: `properties/${id}`,
      data: updateData,
      actionBy: "admin",
    });
  }

  /**
   * Delete property
   */
  async delete(id: string): Promise<void> {
    await mutate({
      action: "delete",
      path: `properties/${id}`,
      actionBy: "admin",
    });
  }

  /**
   * Get properties by listing type
   */
  async getByListingType(listingType: string): Promise<Property[]> {
    const properties = await this.getAll();
    return properties.filter((property) => property.listingType === listingType);
  }

  /**
   * Search properties
   */
  async search(query: string): Promise<Property[]> {
    const properties = await this.getAll();
    const lowerQuery = query.toLowerCase();

    return properties.filter((property) => {
      // Search in title
      if (property.title?.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in address
      if (property.address?.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in city
      if (property.city?.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in state
      if (property.state?.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      return false;
    });
  }
}

export const propertyService = new PropertyService();

