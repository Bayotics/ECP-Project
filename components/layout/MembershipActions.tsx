import Link from "next/link";

/** Shared by the site, sign-in and portal headers so membership stays reachable. */
export default function MembershipActions() {
  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      <Link
        href="/auth/login"
        className="hidden min-h-11 items-center justify-center rounded-full border border-neutral-300 bg-white px-2 text-center text-[11px] font-medium leading-tight text-neutral-900 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 sm:px-4 sm:text-sm xl:inline-flex"
      >
        <span>Members<span className="block sm:inline"> Login</span></span>
      </Link>
      <Link
        href="/membership/apply"
        className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-[#065f46] px-3 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-[#064e3b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 sm:px-5 sm:text-sm"
      >
        Become a Member
      </Link>
    </div>
  );
}
