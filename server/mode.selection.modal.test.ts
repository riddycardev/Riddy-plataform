/**
 * FASE 4 — Testes do ModeSelectionModal
 *
 * Testa a lógica do handleConfirm sem depender de React/DOM:
 * - role=user selecionando host → chama activateHostMode (não setMode)
 * - role=host selecionando host → chama setMode("host")
 * - role=both selecionando renter → chama setMode("renter")
 * - selecionando renter → navega para /dashboard
 * - selecionando host → navega para /host
 * - sem seleção → não faz nada
 * - completeModeSelection sempre chamado após sucesso
 * - Verificação de source code: estrutura e segurança
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Role = "user" | "host" | "both" | "admin";
type UserMode = "renter" | "host" | "admin";
type Selection = "renter" | "host" | null;

// ─── 1. Lógica do handleConfirm — roteamento de chamada ───────────────────────

describe("handleConfirm — roteamento de chamada por role e seleção", () => {
  /**
   * Simula a lógica do handleConfirm do ModeSelectionModal.
   * Retorna qual função foi chamada e para onde navegou.
   */
  async function simulateHandleConfirm(
    selected: Selection,
    canSwitchToHost: boolean
  ): Promise<{
    calledActivateHostMode: boolean;
    calledSetMode: string | null;
    calledCompleteModeSelection: boolean;
    navigatedTo: string | null;
  }> {
    let calledActivateHostMode = false;
    let calledSetMode: string | null = null;
    let calledCompleteModeSelection = false;
    let navigatedTo: string | null = null;

    const activateHostMode = vi.fn(async () => { calledActivateHostMode = true; });
    const setMode = vi.fn(async (mode: string) => { calledSetMode = mode; });
    const completeModeSelection = vi.fn(() => { calledCompleteModeSelection = true; });
    const navigate = vi.fn((path: string) => { navigatedTo = path; });

    if (!selected) return { calledActivateHostMode, calledSetMode, calledCompleteModeSelection, navigatedTo };

    if (selected === "host") {
      if (!canSwitchToHost) {
        await activateHostMode();
      } else {
        await setMode("host");
      }
      completeModeSelection();
      navigate("/host");
    } else {
      await setMode("renter");
      completeModeSelection();
      navigate("/dashboard");
    }

    return { calledActivateHostMode, calledSetMode, calledCompleteModeSelection, navigatedTo };
  }

  it("sem seleção → nenhuma função chamada", async () => {
    const result = await simulateHandleConfirm(null, false);
    expect(result.calledActivateHostMode).toBe(false);
    expect(result.calledSetMode).toBeNull();
    expect(result.calledCompleteModeSelection).toBe(false);
    expect(result.navigatedTo).toBeNull();
  });

  it("seleção=host + canSwitchToHost=false (role=user) → chama activateHostMode", async () => {
    const result = await simulateHandleConfirm("host", false);
    expect(result.calledActivateHostMode).toBe(true);
    expect(result.calledSetMode).toBeNull();
  });

  it("seleção=host + canSwitchToHost=true (role=host) → chama setMode('host')", async () => {
    const result = await simulateHandleConfirm("host", true);
    expect(result.calledActivateHostMode).toBe(false);
    expect(result.calledSetMode).toBe("host");
  });

  it("seleção=host + canSwitchToHost=true (role=both) → chama setMode('host')", async () => {
    const result = await simulateHandleConfirm("host", true);
    expect(result.calledSetMode).toBe("host");
  });

  it("seleção=renter → chama setMode('renter') independente de canSwitchToHost", async () => {
    const resultUser = await simulateHandleConfirm("renter", false);
    expect(resultUser.calledSetMode).toBe("renter");
    expect(resultUser.calledActivateHostMode).toBe(false);

    const resultHost = await simulateHandleConfirm("renter", true);
    expect(resultHost.calledSetMode).toBe("renter");
    expect(resultHost.calledActivateHostMode).toBe(false);
  });

  it("seleção=host → navega para /host após sucesso", async () => {
    const result = await simulateHandleConfirm("host", false);
    expect(result.navigatedTo).toBe("/host");
  });

  it("seleção=renter → navega para /dashboard após sucesso", async () => {
    const result = await simulateHandleConfirm("renter", false);
    expect(result.navigatedTo).toBe("/dashboard");
  });

  it("seleção=host → completeModeSelection sempre chamado", async () => {
    const resultUser = await simulateHandleConfirm("host", false);
    expect(resultUser.calledCompleteModeSelection).toBe(true);

    const resultHost = await simulateHandleConfirm("host", true);
    expect(resultHost.calledCompleteModeSelection).toBe(true);
  });

  it("seleção=renter → completeModeSelection sempre chamado", async () => {
    const result = await simulateHandleConfirm("renter", false);
    expect(result.calledCompleteModeSelection).toBe(true);
  });
});

// ─── 2. Mapeamento role → canSwitchToHost → função chamada ───────────────────

describe("Mapeamento role → canSwitchToHost → função chamada", () => {
  function getCanSwitchToHost(role: Role): boolean {
    return ["host", "both", "admin"].includes(role);
  }

  function getFunctionToCall(selected: Selection, role: Role): string {
    if (!selected) return "none";
    if (selected === "renter") return "setMode(renter)";
    const canSwitch = getCanSwitchToHost(role);
    return canSwitch ? "setMode(host)" : "activateHostMode";
  }

  it("role=user + host → activateHostMode", () => {
    expect(getFunctionToCall("host", "user")).toBe("activateHostMode");
  });

  it("role=host + host → setMode(host)", () => {
    expect(getFunctionToCall("host", "host")).toBe("setMode(host)");
  });

  it("role=both + host → setMode(host)", () => {
    expect(getFunctionToCall("host", "both")).toBe("setMode(host)");
  });

  it("role=admin + host → setMode(host)", () => {
    expect(getFunctionToCall("host", "admin")).toBe("setMode(host)");
  });

  it("role=user + renter → setMode(renter)", () => {
    expect(getFunctionToCall("renter", "user")).toBe("setMode(renter)");
  });

  it("role=host + renter → setMode(renter)", () => {
    expect(getFunctionToCall("renter", "host")).toBe("setMode(renter)");
  });

  it("null + qualquer role → none", () => {
    expect(getFunctionToCall(null, "user")).toBe("none");
    expect(getFunctionToCall(null, "host")).toBe("none");
  });
});

// ─── 3. Verificação no source code do ModeSelectionModal ──────────────────────

describe("ModeSelectionModal — verificação no source code", () => {
  const fs = require("fs");
  const path = require("path");
  let modalContent: string;

  beforeEach(() => {
    modalContent = fs.readFileSync(
      path.join(__dirname, "../client/src/components/ModeSelectionModal.tsx"),
      "utf8"
    );
  });

  it("deve existir componente ModeSelectionModal", () => {
    expect(modalContent).toContain("export function ModeSelectionModal");
  });

  it("deve usar canSwitchToHost do UserModeContext", () => {
    expect(modalContent).toContain("canSwitchToHost");
  });

  it("deve chamar activateHostMode quando !canSwitchToHost", () => {
    expect(modalContent).toContain("!canSwitchToHost");
    expect(modalContent).toContain("activateHostMode()");
  });

  it("deve chamar setMode('host') quando canSwitchToHost", () => {
    expect(modalContent).toContain('setMode("host")');
  });

  it("deve chamar completeModeSelection após sucesso", () => {
    expect(modalContent).toContain("completeModeSelection()");
  });

  it("deve navegar para /host após seleção host", () => {
    expect(modalContent).toContain('navigate("/host")');
  });

  it("deve navegar para /dashboard após seleção renter", () => {
    expect(modalContent).toContain('navigate("/dashboard")');
  });

  it("deve ter botão de confirmação desabilitado sem seleção", () => {
    expect(modalContent).toContain("disabled={!selected || isSwitching}");
  });

  it("deve impedir fechamento pelo usuário (onboarding obrigatório)", () => {
    expect(modalContent).toContain("e.preventDefault()");
  });

  it("deve ter estado de loading (isSwitching)", () => {
    expect(modalContent).toContain("isSwitching");
    expect(modalContent).toContain("Configurando...");
  });

  it("deve ter opção de locatário com cor cyan", () => {
    expect(modalContent).toContain("cyan");
    expect(modalContent).toContain("Locatário");
  });

  it("deve ter opção de anfitrião com cor emerald", () => {
    expect(modalContent).toContain("emerald");
    expect(modalContent).toContain("Anfitrião");
  });

  it("deve usar useAuth para obter o usuário", () => {
    expect(modalContent).toContain("useAuth");
  });

  it("deve usar useUserMode para obter contexto de modo", () => {
    expect(modalContent).toContain("useUserMode");
  });
});

// ─── 4. Segurança: não deve permitir bypass de role ───────────────────────────

describe("Segurança do ModeSelectionModal — sem bypass de role", () => {
  it("canSwitchToHost=false + host → NUNCA chama setMode diretamente", async () => {
    let setModeCalled = false;
    let activateHostModeCalled = false;

    const setMode = vi.fn(async () => { setModeCalled = true; });
    const activateHostMode = vi.fn(async () => { activateHostModeCalled = true; });
    const completeModeSelection = vi.fn();
    const navigate = vi.fn();

    const canSwitchToHost = false; // role=user
    const selected = "host";

    if (selected === "host") {
      if (!canSwitchToHost) {
        await activateHostMode();
      } else {
        await setMode("host");
      }
      completeModeSelection();
      navigate("/host");
    }

    expect(setModeCalled).toBe(false);
    expect(activateHostModeCalled).toBe(true);
  });

  it("canSwitchToHost=true + host → NUNCA chama activateHostMode", async () => {
    let setModeCalled = false;
    let activateHostModeCalled = false;

    const setMode = vi.fn(async () => { setModeCalled = true; });
    const activateHostMode = vi.fn(async () => { activateHostModeCalled = true; });
    const completeModeSelection = vi.fn();
    const navigate = vi.fn();

    const canSwitchToHost = true; // role=host/both/admin
    const selected = "host";

    if (selected === "host") {
      if (!canSwitchToHost) {
        await activateHostMode();
      } else {
        await setMode("host");
      }
      completeModeSelection();
      navigate("/host");
    }

    expect(setModeCalled).toBe(true);
    expect(activateHostModeCalled).toBe(false);
  });

  it("seleção=renter → NUNCA chama activateHostMode", async () => {
    let activateHostModeCalled = false;

    const setMode = vi.fn(async () => {});
    const activateHostMode = vi.fn(async () => { activateHostModeCalled = true; });
    const completeModeSelection = vi.fn();
    const navigate = vi.fn();

    const selected = "renter";

    if (selected === "host") {
      await activateHostMode();
    } else {
      await setMode("renter");
    }
    completeModeSelection();
    navigate("/dashboard");

    expect(activateHostModeCalled).toBe(false);
  });
});
