"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type CaptchaApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => number;
};

const readyListeners = new Set<() => void>();

export default function Recaptcha({ onChange, dark = false }: { onChange: (token: string) => void; dark?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<number | null>(null);
  const [failed, setFailed] = useState(false);
  const renderRef = useRef<() => void>(() => {});
  useEffect(() => {
    const target = window as Window & { ecpRecaptchaReady?: () => void };
    const ready = () => renderRef.current();
    readyListeners.add(ready);
    target.ecpRecaptchaReady = () => readyListeners.forEach(listener => listener());
    ready();
    return () => { readyListeners.delete(ready); };
  }, []);
  const sitekey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  function renderWidget() {
    const api = (window as Window & { grecaptcha?: CaptchaApi }).grecaptcha;
    if (!container.current || !api?.render || widget.current !== null) return;
    widget.current = api.render(container.current, {
      sitekey,
      size: "compact",
      theme: dark ? "dark" : "light",
      callback: (token: string) => { setFailed(false); onChange(token); },
      "expired-callback": () => onChange(""),
      "error-callback": () => { setFailed(true); onChange(""); },
    });
  }

  useEffect(() => { renderRef.current = renderWidget; });

  if (!sitekey) return <p role="alert" className={dark ? "text-sm text-red-200" : "text-sm text-red-700"}>Verification is not configured. Please contact the club.</p>;

  return (
    <div className="space-y-2">
      <p className={dark ? "text-sm text-white" : "text-sm text-neutral-900"}>Complete verification before submitting.</p>
      <Script id="ecp-recaptcha" src="https://www.google.com/recaptcha/api.js?onload=ecpRecaptchaReady&render=explicit" onReady={renderWidget} onError={() => setFailed(true)} />
      <div ref={container} />
      {failed && <p role="alert" className={dark ? "text-sm text-red-200" : "text-sm text-red-700"}>Verification could not load. Check your connection and reload this page; your answers are saved.</p>}
    </div>
  );
}
