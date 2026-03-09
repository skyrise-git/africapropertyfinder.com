import { createClient } from "@/lib/supabase/client";
import type { User, UserInput, UserUpdateInput } from "@/lib/types/user.type";

class StaffService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any {
    return createClient();
  }

  async create(data: UserInput): Promise<{
    userId: string;
    authResponse: { localId: string };
  }> {
    const { data: authData, error: authError } = await this.db.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: "staff",
        },
      },
    });

    if (authError) throw new Error(authError.message);

    const userId = authData.user?.id;
    if (!userId) throw new Error("Failed to create user");

    const { error: profileError } = await this.db
      .from("profiles")
      .upsert({
        id: userId,
        name: data.name,
        email: data.email,
        role: "staff",
        status: "active",
      });

    if (profileError) throw new Error(profileError.message);

    return { userId, authResponse: { localId: userId } };
  }

  async getAll(): Promise<User[]> {
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .eq("role", "staff");

    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, unknown>[]).map(this.mapProfile);
  }

  async getById(id: string): Promise<User | null> {
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .eq("id", id)
      .eq("role", "staff")
      .single();

    if (error) return null;
    return this.mapProfile(data as Record<string, unknown>);
  }

  async update(id: string, data: UserUpdateInput): Promise<void> {
    const { error } = await this.db
      .from("profiles")
      .update({ ...data, updatedAt: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db
      .from("profiles")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async getByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .eq("email", email)
      .eq("role", "staff")
      .single();

    if (error) return null;
    return this.mapProfile(data as Record<string, unknown>);
  }

  async getByFirebaseUid(uid: string): Promise<User | null> {
    return this.getById(uid);
  }

  async changePassword(
    _id: string,
    _currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const { error } = await this.db.auth.updateUser({
      password: newPassword,
    });
    if (error) throw new Error(error.message);
  }

  private mapProfile(row: Record<string, unknown>): User {
    return {
      id: row.id as string,
      uid: row.id as string,
      name: (row.name as string) ?? "",
      email: (row.email as string) ?? "",
      role: (row.role as User["role"]) ?? "staff",
      status: (row.status as User["status"]) ?? "active",
      password: "",
      profilePicture: row.profilePicture as string | undefined,
      profilePictureFileKey: row.profilePictureFileKey as string | undefined,
      createdAt: (row.createdAt as string) ?? new Date().toISOString(),
      updatedAt: row.updatedAt as string | undefined,
    };
  }
}

export const staffService = new StaffService();
