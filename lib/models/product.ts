export type ProductCategory =
  | "apparel"
  | "accessories"
  | "stationery"
  | "publications"
  | "digital"
  | "other";

export type ProductStatus = "active" | "out-of-stock" | "discontinued" | "draft";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number; // in Naira (kobo-precision stored as whole naira)
  compareAtPrice?: number; // original price for sale display
  category: ProductCategory;
  status: ProductStatus;
  imageUrl?: string;
  images?: string[];
  stock: number;
  sku?: string;
  tags: string[];
  isFeatured: boolean;
  isMemberOnly: boolean; // requires member login
  createdAt: string;
  updatedAt: string;
}

export type CreateProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;
export type UpdateProductInput = Partial<Omit<Product, "id" | "createdAt">>;
