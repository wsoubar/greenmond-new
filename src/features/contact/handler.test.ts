import { expect, it, vi } from "vitest";
import { createHandler } from "../../../supabase/functions/greenmond-contact/handler";
const form = {
  name: "Visitante",
  contact: "retorno",
  subject: "Dúvida",
  message: "Olá",
  website: "",
  turnstileToken: "verified-token",
};
function setup(result: "ok" | "duplicate" = "ok") {
  const save = vi.fn().mockResolvedValue(result);
  const verify = vi
    .fn()
    .mockResolvedValue({
      success: true,
      hostname: "site.test",
      action: "greenmond_contact",
    });
  const handler = createHandler({
    origins: ["https://site.test"],
    secret: "server-secret",
    verify,
    save,
  });
  const request = (
    body: unknown = form,
    headers: Record<string, string> = {},
  ) =>
    new Request("https://fn.test", {
      method: "POST",
      headers: {
        origin: "https://site.test",
        "content-type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
  return { handler, request, save, verify };
}
it("valida Turnstile sem IP e persiste somente campos públicos com ID de deduplicação", async () => {
  const { handler, request, save, verify } = setup();
  expect((await handler(request())).status).toBe(201);
  expect(verify).toHaveBeenCalledWith("verified-token", "server-secret");
  expect(save.mock.calls[0][1]).toMatch(
    /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/,
  );
  expect(save.mock.calls[0][0]).toEqual({
    name: "Visitante",
    contact: "retorno",
    subject: "Dúvida",
    message: "Olá",
  });
});
it("nega origens indevidas, honeypot, campos inválidos e payload grande antes de validar token", async () => {
  const { handler, request, save, verify } = setup();
  expect(
    (await handler(request(form, { origin: "https://bad.test" }))).status,
  ).toBe(403);
  for (const value of [
    { ...form, website: "bot" },
    { ...form, name: " " },
    { ...form, message: "a".repeat(5001) },
    null,
  ])
    expect((await handler(request(value))).status).toBe(400);
  expect(
    (await handler(request({ ...form, message: "a".repeat(33000) }))).status,
  ).toBe(413);
  expect(save).not.toHaveBeenCalled();
  expect(verify).not.toHaveBeenCalled();
});
it("rejeita token ausente, expirado, hostname indevido e action incorreta sem gravar", async () => {
  const { handler, request, verify, save } = setup();
  expect((await handler(request({ ...form, turnstileToken: "" }))).status).toBe(
    400,
  );
  for (const response of [
    { success: false },
    { success: true, hostname: "other.test", action: "greenmond_contact" },
    { success: true, hostname: "site.test", action: "login" },
    null,
  ]) {
    verify.mockResolvedValue(response);
    expect([403, 503]).toContain((await handler(request())).status);
  }
  expect(save).not.toHaveBeenCalled();
});
it("não confirma falha de banco nem indisponibilidade do Turnstile", async () => {
  const { handler, request, save, verify } = setup();
  save.mockRejectedValue(new Error("db"));
  expect((await handler(request())).status).toBe(503);
  verify.mockRejectedValue(new Error("timeout"));
  expect((await handler(request())).status).toBe(503);
  expect(save).toHaveBeenCalledTimes(1);
});
it("mesmo token usa mesmo ID, recusa replay e trata preflight", async () => {
  const { handler, request, save } = setup("duplicate");
  expect((await handler(request())).status).toBe(409);
  expect((await handler(request())).status).toBe(409);
  expect(save.mock.calls[0][1]).toBe(save.mock.calls[1][1]);
  expect(
    (
      await handler(
        new Request("https://fn.test", {
          method: "OPTIONS",
          headers: { origin: "https://site.test" },
        }),
      )
    ).status,
  ).toBe(204);
});
it("falha fechada sem a Secret Key", async () => {
  const { save, verify, request } = setup();
  const handler = createHandler({
    origins: ["https://site.test"],
    secret: "",
    save,
    verify,
  });
  expect((await handler(request())).status).toBe(503);
  expect(save).not.toHaveBeenCalled();
});
