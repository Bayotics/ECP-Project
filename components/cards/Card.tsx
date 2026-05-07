import { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

export default function Card({
  title,
  description,
  badge,
  footer,
  noPadding = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-(--color-neutral-200) bg-white shadow-(--shadow-card)",
        className
      )}
      {...props}
    >
      {(title || description || badge) && (
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
          <div>
            {title && (
              <h3 className="font-semibold text-gray-500">{title}</h3>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-(--color-neutral-500)">
                {description}
              </p>
            )}
          </div>
          {badge && <div className="flex-shrink-0">{badge}</div>}
        </div>
      )}

      <div className={cn(!noPadding && "px-5 py-4")}>{children}</div>

      {footer && (
        <div className="border-t border-(--color-neutral-100) px-5 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}
