// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { ReactNode } from "react";
import { RequestRecovery, ResetPassword } from "./Recovery";

const mocks = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
  getSession: vi.fn(),
  updateUser: vi.fn(),
  recoverySession: vi.fn(),
  clearRecoverySession: vi.fn(),
}));

vi.mock("./client", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      getSession: mocks.getSession,
      updateUser: mocks.updateUser,
    },
  },
}));

vi.mock("./recovery-session", () => ({
  recoverySession: mocks.recoverySession,
  clearRecoverySession: mocks.clearRecoverySession,
}));

const routers: ReturnType<typeof createMemoryRouter>[] = [];
function renderPage(path: string, element: ReactNode) {
  const router = createMemoryRouter([{ path: "*", element }], {
    initialEntries: [path],
  });
  routers.push(router);
  render(<RouterProvider router={router} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
  mocks.getSession.mockResolvedValue({
    data: { session: { user: { id: "player-1" } } },
    error: null,
  });
  mocks.updateUser.mockResolvedValue({ error: null });
  mocks.recoverySession.mockResolvedValue({ userId: "player-1" });
});

afterEach(() => {
  cleanup();
  routers.splice(0).forEach((router) => router.dispose());
});

describe("interface de recuperação de senha", () => {
  it("solicita instruções usando o e-mail informado", async () => {
    renderPage("/recuperar-senha", <RequestRecovery />);
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "  jogador@example.com  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar instruções" }));

    expect((await screen.findByRole("status")).textContent).toContain(
      "você receberá as instruções",
    );
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(
      "jogador@example.com",
      { redirectTo: expect.stringContaining("?recovery=1") },
    );
  });

  it("mostra erro quando a confirmação da senha diverge", async () => {
    renderPage("/redefinir-senha", <ResetPassword />);
    await screen.findByLabelText("Nova senha");
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "senha-nova-123" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "senha-diferente-456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "As senhas não coincidem.",
    );
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("atualiza a senha, limpa a sessão de recuperação e confirma sucesso", async () => {
    renderPage("/redefinir-senha", <ResetPassword />);
    await screen.findByLabelText("Nova senha");
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "senha-nova-123" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "senha-nova-123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));

    expect((await screen.findByRole("status")).textContent).toContain(
      "Senha alterada.",
    );
    expect(mocks.getSession).toHaveBeenCalledOnce();
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: "senha-nova-123" });
    expect(mocks.clearRecoverySession).toHaveBeenCalledOnce();
  });

  it("apresenta recuperação inválida quando não há sessão de recovery", async () => {
    mocks.recoverySession.mockResolvedValue(null);
    renderPage("/redefinir-senha", <ResetPassword />);

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Este link é inválido, expirou ou já foi usado.",
    );
    expect(screen.getByRole("link", { name: "Solicitar novo link" }).getAttribute("href")).toBe(
      "/recuperar-senha",
    );
    expect(mocks.getSession).not.toHaveBeenCalled();
  });
});
