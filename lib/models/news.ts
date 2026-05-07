export type NewsCategory =
  | "news"
  | "announcement"
  | "report"
  | "opinion"
  | "press-release"
  | "blog";

export type NewsStatus = "draft" | "published" | "archived";

export interface NewsPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML or markdown
  category: NewsCategory;
  status: NewsStatus;
  // Media
  imageUrl?: string;
  imageAlt?: string;
  // Author
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  // Engagement
  viewCount: number;
  readingTimeMinutes: number;
  // Flags
  isFeatured: boolean;
  isBreaking: boolean;
  isPinned: boolean;
  // Meta
  tags: string[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateNewsInput = Omit<
  NewsPost,
  "id" | "viewCount" | "createdAt" | "updatedAt"
>;
export type UpdateNewsInput = Partial<Omit<NewsPost, "id" | "createdAt">>;
