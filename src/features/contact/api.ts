import { client } from "../diary/api";
export type ContactForm = {
  name: string;
  contact: string;
  subject: string;
  message: string;
  website: string;
};
export type ContactStatus = "nova" | "lida" | "resolvida";
export type Contact = Omit<ContactForm, "website"> & {
  id: string;
  status: ContactStatus;
  created_at: string;
};
export const fields = [
  { key: "name", label: "Seu nome", max: 100 },
  { key: "contact", label: "Contato para retorno", max: 200 },
  { key: "subject", label: "Assunto", max: 150 },
  { key: "message", label: "Mensagem", max: 5000 },
] as const;
export async function sendContact(form: ContactForm, turnstileToken: string) {
  const { error } = await client().functions.invoke("greenmond-contact", {
    body: { ...form, turnstileToken },
  });
  if (error) {
    if (
      error.context instanceof Response &&
      [400, 403, 409].includes(error.context.status)
    )
      throw new Error(
        "Não foi possível validar o envio. Faça a verificação de segurança novamente.",
      );
    if (error.context instanceof Response && error.context.status === 429)
      throw new Error(
        "Limite de envios atingido. Tente novamente em uma hora.",
      );
    throw new Error(
      "Não foi possível enviar. Confira sua conexão e tente novamente.",
    );
  }
}
export async function listContacts(page: number) {
  const db = client();
  const [list, unread] = await Promise.all([
    db
      .from("greenmond_contacts")
      .select("id,name,contact,subject,message,status,created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .order("id")
      .range(page * 20, page * 20 + 19),
    db
      .from("greenmond_contacts")
      .select("id", { count: "exact", head: true })
      .eq("status", "nova"),
  ]);
  if (list.error || unread.error)
    throw new Error("Não foi possível carregar os contatos.");
  return {
    contacts: list.data as Contact[],
    total: list.count ?? 0,
    unread: unread.count ?? 0,
  };
}
export async function setContactStatus(id: string, status: ContactStatus) {
  const { data, error } = await client()
    .from("greenmond_contacts")
    .update({ status })
    .eq("id", id)
    .select("id")
    .single();
  if (error || !data)
    throw new Error(
      "Não foi possível atualizar a mensagem. Verifique seu acesso.",
    );
}

export async function getUnreadCount() {
  const { count, error } = await client()
    .from("greenmond_contacts")
    .select("id", { count: "exact", head: true })
    .eq("status", "nova");
  if (error) throw error;
  return count ?? 0;
}
