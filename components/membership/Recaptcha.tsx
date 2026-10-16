"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type CaptchaApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => number;
};

export default function Recaptcha({ onChange }: { onChange: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<number | null>(null);
  const [failed, setFailed] = useState(false);
  const renderRef = useRef<() => void>(() => {});
  useEffect(() => {
    const target = window as Window & { ecpRecaptchaReady?: () => void };
    target.ecpRecaptchaReady = () => renderRef.current();
    return () => { delete target.ecpRecaptchaReady; };
  }, []);
  const sitekey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  function renderWidget() {
    const api = (window as Window & { grecaptcha?: CaptchaApi }).grecaptcha;
    if (!container.current || !api?.render || widget.current !== null) return;
    widget.current = api.render(container.current, {
      sitekey,
      size: "compact",
      callback: (token: string) => { setFailed(false); onChange(token); },
      "expired-callback": () => onChange(""),
      "error-callback": () => { setFailed(true); onChange(""); },
    });
  }

  useEffect(() => { renderRef.current = renderWidget; });

  if (!sitekey) return <p role="alert" className="text-sm text-red-700">Application verification is not configured. Please contact the membership committee.</p>;

  return (
    <div className="space-y-2">
      <p className="text-sm text-neutral-900">Complete verification before submitting.</p>
      <Script src="https://www.google.com/recaptcha/api.js?onload=ecpRecaptchaReady&render=explicit" onReady={renderWidget} onError={() => setFailed(true)} />
      <div ref={container} />
      {failed && <p role="alert" className="text-sm text-red-700">Verification could not load. Check your connection and reload this page; your answers are saved.</p>}
    </div>
  );
}
