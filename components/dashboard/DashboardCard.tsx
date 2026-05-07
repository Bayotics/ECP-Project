interface DashboardCardProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export default function DashboardCard({
  title,
  action,
  children,
}: DashboardCardProps) {
  return (
    <div className="rounded-xl border border-(--color-neutral-200) bg-white shadow-(--shadow-card)">
      <div className="flex items-center justify-between border-b border-(--color-neutral-100) px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-500">{title}</h3>
        {action && <div className="text-sm">{action}</div>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
