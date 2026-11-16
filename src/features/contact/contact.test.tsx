// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useEffect } from "react";
import { MemoryRouter } from "react-router";
import { ContactInbox, ContactPage } from "./Pages";
import { listContacts, sendContact, setContactStatus } from "./api";
const auth = vi.hoisted(() => ({
  profile: { user_id: "n", role: "narrator", active: true },
}));
vi.mock("./Turnstile", () => ({
  Turnstile: ({ onToken }: { onToken: (token: string) => void }) => {
    useEffect(() => {
      onToken("verified-token");
    }, [onToken]);
    return (
      <button type="button" onClick={() => onToken("")}>
        Simular expiração
      </button>
    );
  },
}));
vi.mock("../diary/client", () => ({ supabase: {} }));
vi.mock("../diary/Auth", () => ({
  useAuth: () => auth,
  PrivateDiary: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("./api", async (original) => ({
  ...(await original<typeof import("./api")>()),
  sendContact: vi.fn(),
  listContacts: vi.fn(),
  setContactStatus: vi.fn(),
}));
afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
  auth.profile = { user_id: "n", role: "narrator", active: true };
});
function fill() {
  fireEvent.change(screen.getByLabelText("Seu nome"), {
    target: { value: "Visitante" },
  });
  fireEvent.change(screen.getByLabelText("Contato para retorno"), {
    target: { value: "meu contato" },
  });
  fireEvent.change(screen.getByLabelText("Assunto"), {
    target: { value: "Participar" },
  });
  fireEvent.change(screen.getByLabelText(/Mensagem/), {
    target: { value: "Como participar?" },
  });
}
it("envia sem login e só confirma após persistência, bloqueando cliques repetidos", async () => {
  let finish!: () => void;
  vi.mocked(sendContact).mockReturnValue(
    new Promise<void>((resolve) => {
      finish = resolve;
    }),
  );
  render(<ContactPage />);
  fill();
  fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));
  fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));
  expect(sendContact).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Mensagem recebida")).toBeNull();
  finish();
  await screen.findByText("Mensagem recebida");
});
it("preserva campos após falha ou limite", async () => {
  vi.mocked(sendContact).mockRejectedValue(
    new Error("Limite de envios atingido."),
  );
  render(<ContactPage />);
  fill();
  fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Limite");
  expect((screen.getByLabelText("Seu nome") as HTMLInputElement).value).toBe(
    "Visitante",
  );
});
it("recusa campos contendo somente espaços", async () => {
  render(<ContactPage />);
  fill();
  fireEvent.change(screen.getByLabelText("Seu nome"), {
    target: { value: "  " },
  });
  fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));
  await screen.findByRole("alert");
  expect(sendContact).not.toHaveBeenCalled();
});
it("bloqueia jogador e narrador inativo sem consultar contatos", () => {
  auth.profile.role = "player";
  const view = render(<ContactInbox />);
  expect(screen.getByRole("alert").textContent).toContain("exclusivo");
  auth.profile.role = "narrator";
  auth.profile.active = false;
  view.rerender(<ContactInbox />);
  expect(listContacts).not.toHaveBeenCalled();
});
it("exibe detalhes como texto e permite resolver a mensagem", async () => {
  vi.mocked(listContacts).mockResolvedValue({
    contacts: [
      {
        id: "1",
        name: "Visitante",
        contact: "contato privado",
        subject: "Dúvida",
        message: "<script>texto</script>",
        status: "nova",
        created_at: "2026-11-16T10:00:00Z",
      },
    ],
    total: 1,
    unread: 1,
  });
  render(
    <MemoryRouter>
      <ContactInbox />
    </MemoryRouter>,
  );
  fireEvent.click(await screen.findByRole("button", { name: /Dúvida/ }));
  expect(screen.getByText("<script>texto</script>")).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Marcar como resolvida" }),
  );
  await waitFor(() =>
    expect(setContactStatus).toHaveBeenCalledWith("1", "resolvida"),
  );
});

it("pagina a caixa e permite atualizar após uma falha", async () => {
  vi.mocked(listContacts)
    .mockRejectedValueOnce(new Error("Conexão indisponível"))
    .mockResolvedValue({ contacts: [], total: 21, unread: 2 });
  render(
    <MemoryRouter>
      <ContactInbox />
    </MemoryRouter>,
  );
  expect((await screen.findByRole("alert")).textContent).toContain("Conexão");
  fireEvent.click(screen.getByRole("button", { name: "Atualizar contatos" }));
  await screen.findByText("Página 1");
  fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
  await screen.findByText("Página 2");
  expect(listContacts).toHaveBeenLastCalledWith(1);
  expect(
    (screen.getByRole("button", { name: "Próxima" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
});

it("bloqueia envio quando o token expira", () => {
  render(<ContactPage />);
  fill();
  fireEvent.click(screen.getByRole("button", { name: "Simular expiração" }));
  expect(
    (
      screen.getByRole("button", {
        name: "Enviar mensagem",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));
  expect(sendContact).not.toHaveBeenCalled();
});
