import { cn } from "@/utils/cn";

type StatColor = "green" | "gold";

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  color?: StatColor;
}

const colorMap: Record<
  StatColor,
  { icon: string; bg: string; text: string; delta: string }
> = {
  green: {
    icon: "bg-(--color-green-100)",
    bg: "border-l-(--color-green-500)",
    text: "text-(--color-green-700)",
    delta: "text-(--color-green-600)",
  },
  gold: {
    icon: "bg-(--color-gold-100)",
    bg: "border-l-(--color-gold-500)",
    text: "text-(--color-gold-700)",
    delta: "text-(--color-gold-600)",
  },
};

export default function StatCard({
  label,
  value,
  delta,
  color = "green",
}: StatCardProps) {
  const c = colorMap[color];
  return (
    <div
      className={cn(
        "rounded-xl border border-(--color-neutral-200) bg-white p-5 shadow-(--shadow-card) border-l-4",
        c.bg
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-(--color-neutral-400)">
        {label}
      </p>
      <p className="mt-2 text-3xl font-extrabold text-gray-500">
        {value}
      </p>
      {delta && (
        <p className={cn("mt-1 text-xs font-medium", c.delta)}>{delta}</p>
      )}
    </div>
  );
}
