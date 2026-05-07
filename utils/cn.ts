import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility for merging Tailwind CSS class names.
 * Uses clsx for conditional classes + tailwind-merge to resolve conflicts.
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-green-500", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
