export type Dependencies = {
  origins: string[];
  secret: string;
  verify: (
    token: string,
    secret: string,
  ) => Promise<{ success?: boolean; hostname?: string; action?: string }>;
  save: (
    form: Record<string, string>,
    submissionId: string,
  ) => Promise<"ok" | "duplicate">;
};
export function createHandler(deps: Dependencies) {
  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get("origin") ?? "";
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      Vary: "Origin",
      "Access-Control-Allow-Headers":
        "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
    const reply = (status: number, message: string) =>
      new Response(JSON.stringify({ message }), { status, headers });
    if (!deps.origins.includes(origin))
      return new Response(null, { status: 403 });
    if (req.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    if (req.method !== "POST") return reply(405, "Método não permitido.");
    if (!deps.secret) return reply(503, "Contato indisponível.");
    if (
      !req.headers
        .get("content-type")
        ?.toLowerCase()
        .startsWith("application/json")
    )
      return reply(415, "Envie JSON.");
    const reader = req.body?.getReader();
    if (!reader) return reply(400, "Preencha os campos.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 32768) {
          await reader.cancel();
          return reply(413, "Mensagem muito grande.");
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      const input = JSON.parse(new TextDecoder().decode(bytes));
      if (
        !input ||
        typeof input !== "object" ||
        Array.isArray(input) ||
        typeof input.website !== "string" ||
        input.website !== ""
      )
        return reply(400, "Envio inválido.");
      const form: Record<string, string> = {};
      for (const [key, max] of Object.entries({
        name: 100,
        contact: 200,
        subject: 150,
        message: 5000,
      })) {
        if (typeof input[key] !== "string")
          return reply(400, "Preencha os campos.");
        form[key] = input[key].trim();
        if (
          !form[key] ||
          [...form[key]].length > max ||
          form[key].includes("\u0000")
        )
          return reply(400, "Confira os limites dos campos.");
      }
      const token = input.turnstileToken;
      if (typeof token !== "string" || !token || token.length > 2048)
        return reply(400, "Verificação de segurança obrigatória.");
      const verification = await deps.verify(token, deps.secret);
      if (
        verification.success !== true ||
        verification.hostname !== new URL(origin).hostname ||
        verification.action !== "greenmond_contact"
      )
        return reply(403, "Verificação de segurança inválida ou expirada.");
      // ID determinístico: a chave primária rejeita replays concorrentes do mesmo token.
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(token),
      );
      const hex = Array.from(new Uint8Array(digest), (n) =>
        n.toString(16).padStart(2, "0"),
      ).join("");
      const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
      if ((await deps.save(form, id)) === "duplicate")
        return reply(409, "Este envio já foi recebido.");
      return reply(201, "Mensagem recebida.");
    } catch (err) {
      return reply(
        err instanceof SyntaxError ? 400 : 503,
        "Não foi possível receber a mensagem.",
      );
    } finally {
      reader.releaseLock();
    }
  };
}
