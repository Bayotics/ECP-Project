import { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export type BadgeColor = "green" | "gold" | "neutral" | "danger" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  dot?: boolean;
}

const colorClasses: Record<BadgeColor, string> = {
  green:
    "bg-(--color-green-100) text-(--color-green-700) ring-(--color-green-200)",
  gold: "bg-(--color-gold-100) text-(--color-gold-700) ring-(--color-gold-200)",
  neutral:
    "bg-(--color-neutral-100) text-(--color-neutral-700) ring-(--color-neutral-200)",
  danger: "bg-red-100 text-red-700 ring-red-200",
  info: "bg-blue-100 text-blue-700 ring-blue-200",
};

const dotColors: Record<BadgeColor, string> = {
  green: "bg-(--color-green-500)",
  gold: "bg-(--color-gold-500)",
  neutral: "bg-(--color-neutral-500)",
  danger: "bg-red-500",
  info: "bg-blue-500",
};

export default function Badge({
  color = "green",
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        colorClasses[color],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", dotColors[color])}
        />
      )}
      {children}
    </span>
  );
}
