import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { createHandler } from "./handler.ts";
const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
Deno.serve(
  createHandler({
    origins: (Deno.env.get("GREENMOND_CONTACT_ORIGINS") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    secret: Deno.env.get("GREENMOND_TURNSTILE_SECRET_KEY") ?? "",
    async verify(token, secret) {
      const response = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret, response: token }),
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!response.ok) throw new Error("TURNSTILE_UNAVAILABLE");
      return await response.json();
    },
    async save(form, submissionId) {
      const { error } = await db
        .from("greenmond_contacts")
        .insert({ ...form, id: submissionId });
      if (error?.code === "23505") return "duplicate";
      if (error) throw new Error("CONTACT_SAVE_FAILED");
      return "ok";
    },
  }),
);
