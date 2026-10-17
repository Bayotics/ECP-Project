import { SOCIAL_PLATFORMS, type SocialProfileKey, type SocialProfiles } from "@/lib/social-profiles";

export default function SocialProfileFields({ values, onChange, errors = {} }: {
  values: SocialProfiles;
  onChange: (key: SocialProfileKey, value: string) => void;
  errors?: Partial<Record<SocialProfileKey, string>>;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-neutral-900">Social profiles (optional)</legend>
      <p className="text-xs leading-5 text-neutral-700">Add your profile links to activate the icons beneath your name. Links are visible in the member directory and, if you appear there, on the public officer page. Icons remain visible without a link, but are inactive.</p>
      {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label htmlFor={key} className="mb-1.5 block text-sm text-neutral-900">{label} profile URL</label>
          <input id={key} type="text" inputMode="url" autoCapitalize="none" spellCheck={false} value={values[key] ?? ""} onChange={(event) => onChange(key, event.target.value)} placeholder={placeholder} maxLength={2048} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${key}-error` : undefined} className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200" />
          {errors[key] && <p id={`${key}-error`} role="alert" className="mt-1 text-xs text-red-700">{errors[key]}</p>}
        </div>
      ))}
    </fieldset>
  );
}
