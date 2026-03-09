import { createClient } from "@/lib/supabase/client";
import type {
  Blog,
  BlogInput,
  BlogUpdateInput,
  BlogCategory,
  BlogStatus,
} from "@/lib/types/blog.type";
import { generateSlug } from "@/lib/utils/blog-utils";

class BlogService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any {
    return createClient();
  }

  private generateSlug(title: string): string {
    return generateSlug(title);
  }

  async create(data: BlogInput): Promise<string> {
    const now = Date.now();
    const nowISO = new Date().toISOString();
    const slug = data.slug || this.generateSlug(data.title);
    const publishedAt = data.status === "published" ? now : data.publishedAt;

    const { data: row, error } = await this.db
      .from("blogs")
      .insert({
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt,
        coverImage: data.coverImage,
        coverImageFileKey: data.coverImageFileKey,
        author: data.author,
        category: data.category,
        tags: data.tags || [],
        publishedAt,
        status: data.status || "draft",
        featured: data.featured || false,
        createdAt: nowISO,
        updatedAt: nowISO,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return row.id;
  }

  async getAll(): Promise<Blog[]> {
    const { data, error } = await this.db
      .from("blogs")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Blog[];
  }

  async getPublished(): Promise<Blog[]> {
    const { data, error } = await this.db
      .from("blogs")
      .select("*")
      .eq("status", "published")
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Blog[];
  }

  async getById(id: string): Promise<Blog | null> {
    const { data, error } = await this.db
      .from("blogs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data as unknown as Blog;
  }

  async getBySlug(slug: string): Promise<Blog | null> {
    const { data, error } = await this.db
      .from("blogs")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) return null;
    return data as unknown as Blog;
  }

  async update(id: string, data: BlogUpdateInput): Promise<void> {
    if (!id) throw new Error("Blog ID is required");

    const existingBlog = await this.getById(id);
    if (!existingBlog) throw new Error(`Blog with ID "${id}" not found`);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (data.title && data.title !== existingBlog.title) {
      updateData.slug = data.slug !== undefined ? data.slug : this.generateSlug(data.title);
      updateData.title = data.title;
    } else if (data.slug !== undefined) {
      updateData.slug = data.slug;
    }

    if (data.status === "published" && existingBlog.status !== "published") {
      updateData.publishedAt = Date.now();
    }

    const fields: (keyof BlogUpdateInput)[] = [
      "content", "excerpt", "coverImage", "coverImageFileKey",
      "author", "category", "tags", "status", "featured", "publishedAt",
    ];
    for (const key of fields) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }

    const { error } = await this.db
      .from("blogs")
      .update(updateData)
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db
      .from("blogs")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async getByCategory(category: BlogCategory): Promise<Blog[]> {
    const { data, error } = await this.db
      .from("blogs")
      .select("*")
      .eq("category", category)
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Blog[];
  }

  async getByTag(tag: string): Promise<Blog[]> {
    const blogs = await this.getAll();
    return blogs.filter((blog) =>
      blog.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())
    );
  }

  async getByAuthor(authorId: string): Promise<Blog[]> {
    const { data, error } = await this.db
      .from("blogs")
      .select("*")
      .eq("author", authorId)
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Blog[];
  }

  async getByStatus(status: BlogStatus): Promise<Blog[]> {
    const { data, error } = await this.db
      .from("blogs")
      .select("*")
      .eq("status", status)
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Blog[];
  }

  async search(query: string): Promise<Blog[]> {
    const { data, error } = await this.db
      .from("blogs")
      .select("*")
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Blog[];
  }
}

export const blogService = new BlogService();
