import { useEffect, useRef, useState } from "react";
import { ActionButton } from "../../components/Actions";
export const contactSiteKey =
  import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || "0x4AAAAAAGELTKD-nGKO0s3h";
type WidgetOptions = {
  sitekey: string;
  action: string;
  theme: string;
  size: string;
  language: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};
type TurnstileAPI = {
  render: (container: HTMLElement, options: WidgetOptions) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileAPI;
  }
}
let loading: Promise<TurnstileAPI> | undefined;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loading) return loading;
  loading = new Promise<TurnstileAPI>((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    const timeout = window.setTimeout(() => fail(), 15000);
    function fail() {
      window.clearTimeout(timeout);
      script.remove();
      loading = undefined;
      reject(new Error("Turnstile indisponível"));
    }
    script.onerror = fail;
    script.onload = () => {
      window.clearTimeout(timeout);
      if (window.turnstile) resolve(window.turnstile);
      else fail();
    };
    document.head.appendChild(script);
  });
  return loading;
}
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    let widget: string | undefined;
    let api: TurnstileAPI | undefined;
    setError(false);
    onToken("");
    loadTurnstile()
      .then((loaded) => {
        if (!live || !container.current) return;
        api = loaded;
        widget = api.render(container.current, {
          sitekey: contactSiteKey,
          action: "greenmond_contact",
          theme: "dark",
          size: "flexible",
          language: "pt-br",
          callback: (token) => {
            if (live) {
              setError(false);
              onToken(token);
            }
          },
          "expired-callback": () => {
            if (live) onToken("");
          },
          "error-callback": () => {
            if (live) {
              onToken("");
              setError(true);
            }
          },
        });
      })
      .catch(() => {
        if (live) setError(true);
      });
    return () => {
      live = false;
      if (widget !== undefined) api?.remove(widget);
    };
  }, [onToken, attempt]);
  return (
    <div className="contact-verification">
      <div ref={container} />
      {error && (
        <div role="alert">
          <p>
            Não foi possível verificar a segurança do envio. Confira sua conexão
            ou o bloqueador de conteúdo.
          </p>
          <ActionButton
            icon="refresh"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Tentar verificação novamente
          </ActionButton>
        </div>
      )}
    </div>
  );
}
