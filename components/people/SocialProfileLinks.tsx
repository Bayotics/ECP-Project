import { normalizeSocialProfile, SOCIAL_PLATFORMS, type SocialProfiles } from "@/lib/social-profiles";

const paths = {
  linkedinUrl: "M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96C2 21.32 2.69 22 3.55 22h16.9c.86 0 1.55-.68 1.55-1.52V3.52C22 2.68 21.31 2 20.45 2ZM7.93 18.75H4.98V9.2h2.95v9.55ZM6.45 7.9a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42Zm12.3 10.85H15.8V14.1c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.21-1.79 2.46v4.73H9.51V9.2h2.83v1.3h.04c.39-.74 1.36-1.52 2.79-1.52 2.98 0 3.53 1.96 3.53 4.5v5.27Z",
  facebookUrl: "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.19 2.23.19v2.46h-1.25c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z",
};

export default function SocialProfileLinks({ profiles, name, className = "" }: { profiles: SocialProfiles; name: string; className?: string }) {
  return (
    <div className={`mt-2 flex flex-wrap gap-2 ${className}`} aria-label={`${name}'s social profiles`}>
      {SOCIAL_PLATFORMS.map(({ key, label }) => {
        const href = normalizeSocialProfile(key, profiles[key] ?? "");
        const icon = key === "instagramUrl" ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d={paths[key]} /></svg>
        );
        const baseClass = "inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200";
        return href ? (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${name} on ${label} (opens in a new tab)`} title={label} className={`${baseClass} bg-white text-neutral-700 transition-colors hover:border-green-600 hover:text-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600`}>
            {icon}
          </a>
        ) : (
          <span key={key} role="link" aria-disabled="true" aria-label={`${name} on ${label} (profile not added)`} title={`${label} profile not added`} className={`${baseClass} cursor-default bg-neutral-50 text-neutral-400`}>
            {icon}
          </span>
        );
      })}
    </div>
  );
}
