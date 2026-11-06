export type RecoveryCallback =
  | { kind: "none" }
  | { kind: "error" }
  | { kind: "recovery"; accessToken: string; refreshToken: string };

export function recoveryRedirectUrl(currentUrl: string | URL): string {
  const url = new URL(currentUrl);
  url.search = "?recovery=1";
  url.hash = "";
  return url.toString();
}

export function consumeRecoveryCallback(currentUrl: string | URL): RecoveryCallback {
  const url = new URL(currentUrl);
  if (url.searchParams.get("recovery") !== "1") return { kind: "none" };
  const params = new URLSearchParams(url.hash.slice(1));
  if (params.has("error") || params.has("error_code")) return { kind: "error" };
  if (params.get("type") !== "recovery") return { kind: "none" };
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return { kind: "error" };
  return { kind: "recovery", accessToken, refreshToken };
}
