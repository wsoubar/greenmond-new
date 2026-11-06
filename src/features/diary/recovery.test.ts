import { describe, expect, it } from "vitest";
import { consumeRecoveryCallback, recoveryRedirectUrl } from "./recovery";

describe("recuperação de senha", () => {
  it("monta o redirect na origem e base path atuais, sem fragmento", () => {
    expect(
      recoveryRedirectUrl(
        new URL("https://greenmond.example/app/index.html#/entrar?origem=menu"),
      ),
    ).toBe("https://greenmond.example/app/index.html?recovery=1");
  });

  it("lê os tokens de recuperação do fragmento Supabase", () => {
    expect(
      consumeRecoveryCallback(
        "https://greenmond.example/app/?recovery=1#access_token=access-123&refresh_token=refresh-456&type=recovery",
      ),
    ).toEqual({
      kind: "recovery",
      accessToken: "access-123",
      refreshToken: "refresh-456",
    });
  });

  it("não interpreta uma navegação comum como callback de recuperação", () => {
    expect(
      consumeRecoveryCallback(
        "https://greenmond.example/app/#access_token=access-123&refresh_token=refresh-456&type=signup",
      ),
    ).toEqual({ kind: "none" });
    expect(consumeRecoveryCallback("https://greenmond.example/app/#/entrar")).toEqual({
      kind: "none",
    });
  });

  it("reporta erro de callback apenas no fluxo de recuperação", () => {
    expect(
      consumeRecoveryCallback(
        "https://greenmond.example/app/?recovery=1#error=access_denied&error_description=Link+expirado&type=recovery",
      ),
    ).toMatchObject({ kind: "error" });
    expect(
      consumeRecoveryCallback(
        "https://greenmond.example/app/#error=access_denied&error_description=Link+expirado&type=recovery",
      ),
    ).toEqual({ kind: "none" });
  });

  it("rejeita callback de recuperação com tokens incompletos", () => {
    expect(
      consumeRecoveryCallback(
        "https://greenmond.example/app/?recovery=1#access_token=access-123&type=recovery",
      ),
    ).toMatchObject({ kind: "error" });
    expect(
      consumeRecoveryCallback(
        "https://greenmond.example/app/?recovery=1#refresh_token=refresh-456&type=recovery",
      ),
    ).toMatchObject({ kind: "error" });
  });
});
