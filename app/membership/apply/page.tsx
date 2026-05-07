import type { Metadata } from "next";
import ApplicationWizard from "@/components/membership/ApplicationWizard";

export const metadata: Metadata = {
  title: "Apply for Membership",
  description:
    "Apply to become a member of Eko Club Philadelphia. Complete our application form to join our vibrant Lagosian diaspora community.",
};

export default function MembershipApplyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Page header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-(--color-neutral-200) font-display mb-2">
          Membership Application
        </h1>
        <p className="text-sm text-(--color-neutral-500) max-w-xl mx-auto">
          Join the Empowerment Community Platform Lagos. Complete the form below — your progress is saved automatically.
        </p>
        <div className="mt-4 text-xs text-(--color-neutral-400) flex items-center justify-center gap-4 flex-wrap">
          <span>📋 4 steps</span>
          <span>💾 Auto-save draft</span>
          <span>⏱ ~10 mins</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-(--color-neutral-200) shadow-sm p-6 md:p-8">
        <ApplicationWizard />
      </div>

      {/* Already applied */}
      <p className="text-center text-sm text-(--color-neutral-500) mt-6">
        Already applied?{" "}
        <a href="/membership/status" className="text-(--color-green-600) font-semibold hover:underline">
          Check your application status →
        </a>
      </p>
    </div>
  );
}
