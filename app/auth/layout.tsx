import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Auth",
    template: "%s | ECP Auth",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-green-50) px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
