// @vitest-environment jsdom
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Turnstile, contactSiteKey } from "./Turnstile";
afterEach(() => {
  cleanup();
  delete window.turnstile;
});
it("usa a Site Key fornecida, expira token e remove widget ao sair", async () => {
  const remove = vi.fn();
  const renderWidget = vi.fn().mockReturnValue("widget-id");
  window.turnstile = { render: renderWidget, remove };
  const onToken = vi.fn();
  const view = render(<Turnstile onToken={onToken} />);
  await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(1));
  const options = renderWidget.mock.calls[0][1];
  expect(options.sitekey).toBe(contactSiteKey);
  expect(options.action).toBe("greenmond_contact");
  options.callback("token");
  expect(onToken).toHaveBeenLastCalledWith("token");
  options["expired-callback"]();
  expect(onToken).toHaveBeenLastCalledWith("");
  view.unmount();
  expect(remove).toHaveBeenCalledWith("widget-id");
});
it("exibe falha e recria widget ao tentar novamente", async () => {
  const renderWidget = vi.fn().mockReturnValue("widget-id");
  window.turnstile = { render: renderWidget, remove: vi.fn() };
  render(<Turnstile onToken={vi.fn()} />);
  await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(1));
  const { act } = await import("@testing-library/react");
  act(() => renderWidget.mock.calls[0][1]["error-callback"]());
  expect(await screen.findByRole("alert")).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Tentar verificação novamente" }),
  );
  await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(2));
});
