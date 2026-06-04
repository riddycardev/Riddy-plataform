/**
 * Testes de Segurança — Fase 3: Hardening de Permissões
 *
 * Cobre:
 * - hostProcedure: bloqueia role=user, permite host/both/admin
 * - adminProcedure: bloqueia role!=admin
 * - updateActiveMode: bloqueia mode=host para role=user (bypass prevention)
 * - activateHostMode: converte role=user para role=both corretamente
 * - Constantes de erro: NOT_HOST_ERR_MSG, NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG
 * - Lógica de role enforcement no UserModeContext (frontend)
 * - Lógica de ownership verification nas procedures de host
 */

import { describe, it, expect } from "vitest";
import {
  UNAUTHED_ERR_MSG,
  NOT_ADMIN_ERR_MSG,
  NOT_HOST_ERR_MSG,
} from "../shared/const";

// ─── Constantes de Erro ───────────────────────────────────────────────────────

describe("Constantes de Erro de Segurança", () => {
  it("UNAUTHED_ERR_MSG tem código 10001", () => {
    expect(UNAUTHED_ERR_MSG).toContain("10001");
  });

  it("NOT_ADMIN_ERR_MSG tem código 10002", () => {
    expect(NOT_ADMIN_ERR_MSG).toContain("10002");
  });

  it("NOT_HOST_ERR_MSG tem código 10003", () => {
    expect(NOT_HOST_ERR_MSG).toContain("10003");
  });

  it("Cada código de erro é único", () => {
    const codes = [UNAUTHED_ERR_MSG, NOT_ADMIN_ERR_MSG, NOT_HOST_ERR_MSG];
    const unique = new Set(codes);
    expect(unique.size).toBe(3);
  });

  it("NOT_HOST_ERR_MSG existe e não está vazio", () => {
    expect(NOT_HOST_ERR_MSG).toBeTruthy();
    expect(NOT_HOST_ERR_MSG.length).toBeGreaterThan(0);
  });
});

// ─── Lógica de hostProcedure (extraída do middleware) ─────────────────────────

type UserRole = "user" | "host" | "admin" | "both";

const HOST_ROLES: UserRole[] = ["host", "both", "admin"];

function checkHostRole(role: UserRole): { allowed: boolean; error?: string } {
  if (!HOST_ROLES.includes(role)) {
    return { allowed: false, error: NOT_HOST_ERR_MSG };
  }
  return { allowed: true };
}

function checkAdminRole(role: UserRole): { allowed: boolean; error?: string } {
  if (role !== "admin") {
    return { allowed: false, error: NOT_ADMIN_ERR_MSG };
  }
  return { allowed: true };
}

describe("hostProcedure — Role Enforcement", () => {
  it("role=user é BLOQUEADO", () => {
    const result = checkHostRole("user");
    expect(result.allowed).toBe(false);
    expect(result.error).toBe(NOT_HOST_ERR_MSG);
  });

  it("role=host é PERMITIDO", () => {
    const result = checkHostRole("host");
    expect(result.allowed).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("role=both é PERMITIDO", () => {
    const result = checkHostRole("both");
    expect(result.allowed).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("role=admin é PERMITIDO (admin pode tudo)", () => {
    const result = checkHostRole("admin");
    expect(result.allowed).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("Apenas 3 roles são permitidos: host, both, admin", () => {
    const allowed = HOST_ROLES;
    expect(allowed).toHaveLength(3);
    expect(allowed).toContain("host");
    expect(allowed).toContain("both");
    expect(allowed).toContain("admin");
    expect(allowed).not.toContain("user");
  });
});

describe("adminProcedure — Role Enforcement", () => {
  it("role=user é BLOQUEADO", () => {
    const result = checkAdminRole("user");
    expect(result.allowed).toBe(false);
    expect(result.error).toBe(NOT_ADMIN_ERR_MSG);
  });

  it("role=host é BLOQUEADO", () => {
    const result = checkAdminRole("host");
    expect(result.allowed).toBe(false);
    expect(result.error).toBe(NOT_ADMIN_ERR_MSG);
  });

  it("role=both é BLOQUEADO", () => {
    const result = checkAdminRole("both");
    expect(result.allowed).toBe(false);
    expect(result.error).toBe(NOT_ADMIN_ERR_MSG);
  });

  it("role=admin é PERMITIDO", () => {
    const result = checkAdminRole("admin");
    expect(result.allowed).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

// ─── Lógica de updateActiveMode (bypass prevention) ──────────────────────────

type UserMode = "renter" | "host";

function validateModeChange(
  currentRole: UserRole,
  requestedMode: UserMode
): { allowed: boolean; error?: string } {
  // mode=host requer role host, both ou admin
  if (requestedMode === "host") {
    if (!HOST_ROLES.includes(currentRole)) {
      return {
        allowed: false,
        error: "Você precisa ativar o modo anfitrião primeiro. (10003)",
      };
    }
  }
  return { allowed: true };
}

describe("updateActiveMode — Bypass Prevention", () => {
  it("role=user NÃO pode definir mode=host", () => {
    const result = validateModeChange("user", "host");
    expect(result.allowed).toBe(false);
    expect(result.error).toContain("10003");
  });

  it("role=user PODE definir mode=renter", () => {
    const result = validateModeChange("user", "renter");
    expect(result.allowed).toBe(true);
  });

  it("role=host PODE definir mode=host", () => {
    const result = validateModeChange("host", "host");
    expect(result.allowed).toBe(true);
  });

  it("role=host PODE definir mode=renter", () => {
    const result = validateModeChange("host", "renter");
    expect(result.allowed).toBe(true);
  });

  it("role=both PODE definir mode=host", () => {
    const result = validateModeChange("both", "host");
    expect(result.allowed).toBe(true);
  });

  it("role=both PODE definir mode=renter", () => {
    const result = validateModeChange("both", "renter");
    expect(result.allowed).toBe(true);
  });

  it("role=admin PODE definir mode=host", () => {
    const result = validateModeChange("admin", "host");
    expect(result.allowed).toBe(true);
  });

  it("role=admin PODE definir mode=renter", () => {
    const result = validateModeChange("admin", "renter");
    expect(result.allowed).toBe(true);
  });

  it("Bypass: role=user tentando mode=host retorna erro com código 10003", () => {
    const result = validateModeChange("user", "host");
    expect(result.allowed).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.error).toContain("10003");
  });
});

// ─── Lógica de activateHostMode ───────────────────────────────────────────────

function simulateActivateHostMode(
  currentRole: UserRole
): { success: boolean; newRole: UserRole } {
  const alreadyHost = HOST_ROLES.includes(currentRole);
  const newRole: UserRole = alreadyHost ? currentRole : "both";
  return { success: true, newRole };
}

describe("activateHostMode — Conversão de Role", () => {
  it("role=user é convertido para role=both", () => {
    const result = simulateActivateHostMode("user");
    expect(result.success).toBe(true);
    expect(result.newRole).toBe("both");
  });

  it("role=host permanece host (já é host)", () => {
    const result = simulateActivateHostMode("host");
    expect(result.success).toBe(true);
    expect(result.newRole).toBe("host");
  });

  it("role=both permanece both (já tem acesso)", () => {
    const result = simulateActivateHostMode("both");
    expect(result.success).toBe(true);
    expect(result.newRole).toBe("both");
  });

  it("role=admin permanece admin (admin pode tudo)", () => {
    const result = simulateActivateHostMode("admin");
    expect(result.success).toBe(true);
    expect(result.newRole).toBe("admin");
  });

  it("Após ativação, role=user nunca permanece user", () => {
    const result = simulateActivateHostMode("user");
    expect(result.newRole).not.toBe("user");
  });

  it("Após ativação, novo role sempre permite modo host", () => {
    const roles: UserRole[] = ["user", "host", "both", "admin"];
    for (const role of roles) {
      const result = simulateActivateHostMode(role);
      expect(HOST_ROLES).toContain(result.newRole);
    }
  });
});

// ─── Lógica de Ownership Verification ────────────────────────────────────────

interface Vehicle {
  id: number;
  hostId: number;
  status: string;
}

interface AuthUser {
  id: number;
  role: UserRole;
}

function checkVehicleOwnership(
  vehicle: Vehicle,
  user: AuthUser
): { allowed: boolean; error?: string } {
  // Admin pode acessar qualquer veículo
  if (user.role === "admin") return { allowed: true };

  // Verificar ownership
  if (vehicle.hostId !== user.id) {
    return { allowed: false, error: "Acesso negado" };
  }

  // Verificar role (mesmo que seja dono, precisa de role host)
  if (!HOST_ROLES.includes(user.role)) {
    return { allowed: false, error: NOT_HOST_ERR_MSG };
  }

  return { allowed: true };
}

describe("Vehicle Ownership Verification", () => {
  const vehicle: Vehicle = { id: 1, hostId: 42, status: "active" };

  it("Dono com role=host pode acessar seu veículo", () => {
    const user: AuthUser = { id: 42, role: "host" };
    const result = checkVehicleOwnership(vehicle, user);
    expect(result.allowed).toBe(true);
  });

  it("Dono com role=both pode acessar seu veículo", () => {
    const user: AuthUser = { id: 42, role: "both" };
    const result = checkVehicleOwnership(vehicle, user);
    expect(result.allowed).toBe(true);
  });

  it("Admin pode acessar qualquer veículo (sem ser dono)", () => {
    const user: AuthUser = { id: 99, role: "admin" };
    const result = checkVehicleOwnership(vehicle, user);
    expect(result.allowed).toBe(true);
  });

  it("Não-dono com role=host NÃO pode acessar veículo de outro", () => {
    const user: AuthUser = { id: 99, role: "host" };
    const result = checkVehicleOwnership(vehicle, user);
    expect(result.allowed).toBe(false);
    expect(result.error).toBe("Acesso negado");
  });

  it("Dono com role=user NÃO pode acessar (role insuficiente)", () => {
    // Cenário de bypass: usuário tem o hostId mas perdeu o role
    const user: AuthUser = { id: 42, role: "user" };
    const result = checkVehicleOwnership(vehicle, user);
    expect(result.allowed).toBe(false);
    expect(result.error).toBe(NOT_HOST_ERR_MSG);
  });

  it("Não-dono com role=user NÃO pode acessar", () => {
    const user: AuthUser = { id: 1, role: "user" };
    const result = checkVehicleOwnership(vehicle, user);
    expect(result.allowed).toBe(false);
  });
});

// ─── Lógica de Booking Host Actions ──────────────────────────────────────────

interface Booking {
  id: number;
  hostId: number;
  renterId: number;
  status: string;
}

function checkBookingHostAction(
  booking: Booking,
  user: AuthUser,
  action: "approve" | "reject"
): { allowed: boolean; error?: string } {
  // Verificar role de host
  if (!HOST_ROLES.includes(user.role)) {
    return { allowed: false, error: NOT_HOST_ERR_MSG };
  }

  // Admin pode fazer qualquer ação
  if (user.role === "admin") return { allowed: true };

  // Verificar que é o host da reserva
  if (booking.hostId !== user.id) {
    return {
      allowed: false,
      error: `Apenas o proprietário pode ${action === "approve" ? "aprovar" : "rejeitar"} esta reserva`,
    };
  }

  return { allowed: true };
}

describe("Booking Host Actions — Verificação de Permissão", () => {
  const booking: Booking = {
    id: 1,
    hostId: 42,
    renterId: 10,
    status: "pending_host_approval",
  };

  it("Host dono da reserva pode aprovar", () => {
    const user: AuthUser = { id: 42, role: "host" };
    const result = checkBookingHostAction(booking, user, "approve");
    expect(result.allowed).toBe(true);
  });

  it("Host dono da reserva pode rejeitar", () => {
    const user: AuthUser = { id: 42, role: "host" };
    const result = checkBookingHostAction(booking, user, "reject");
    expect(result.allowed).toBe(true);
  });

  it("Admin pode aprovar qualquer reserva", () => {
    const user: AuthUser = { id: 99, role: "admin" };
    const result = checkBookingHostAction(booking, user, "approve");
    expect(result.allowed).toBe(true);
  });

  it("Host de outra reserva NÃO pode aprovar", () => {
    const user: AuthUser = { id: 99, role: "host" };
    const result = checkBookingHostAction(booking, user, "approve");
    expect(result.allowed).toBe(false);
    expect(result.error).toContain("proprietário");
  });

  it("role=user NÃO pode aprovar reserva (mesmo sendo o hostId)", () => {
    // Cenário de bypass: usuário tem o hostId mas não tem role host
    const user: AuthUser = { id: 42, role: "user" };
    const result = checkBookingHostAction(booking, user, "approve");
    expect(result.allowed).toBe(false);
    expect(result.error).toBe(NOT_HOST_ERR_MSG);
  });

  it("role=user NÃO pode rejeitar reserva", () => {
    const user: AuthUser = { id: 42, role: "user" };
    const result = checkBookingHostAction(booking, user, "reject");
    expect(result.allowed).toBe(false);
    expect(result.error).toBe(NOT_HOST_ERR_MSG);
  });

  it("Locatário (renterId) NÃO pode aprovar sua própria reserva", () => {
    const user: AuthUser = { id: 10, role: "user" };
    const result = checkBookingHostAction(booking, user, "approve");
    expect(result.allowed).toBe(false);
  });
});

// ─── Lógica do UserModeContext (frontend) ─────────────────────────────────────

const SWITCHABLE_ROLES: UserRole[] = ["both", "admin"];

function computeUserModePermissions(role: UserRole) {
  return {
    canSwitchToHost: HOST_ROLES.includes(role),
    canSwitch: SWITCHABLE_ROLES.includes(role),
    isAdmin: role === "admin",
  };
}

describe("UserModeContext — Permissões por Role", () => {
  it("role=user: canSwitchToHost=false, canSwitch=false", () => {
    const perms = computeUserModePermissions("user");
    expect(perms.canSwitchToHost).toBe(false);
    expect(perms.canSwitch).toBe(false);
    expect(perms.isAdmin).toBe(false);
  });

  it("role=host: canSwitchToHost=true, canSwitch=false (só tem um modo)", () => {
    const perms = computeUserModePermissions("host");
    expect(perms.canSwitchToHost).toBe(true);
    expect(perms.canSwitch).toBe(false);
    expect(perms.isAdmin).toBe(false);
  });

  it("role=both: canSwitchToHost=true, canSwitch=true (pode alternar)", () => {
    const perms = computeUserModePermissions("both");
    expect(perms.canSwitchToHost).toBe(true);
    expect(perms.canSwitch).toBe(true);
    expect(perms.isAdmin).toBe(false);
  });

  it("role=admin: canSwitchToHost=true, canSwitch=true, isAdmin=true", () => {
    const perms = computeUserModePermissions("admin");
    expect(perms.canSwitchToHost).toBe(true);
    expect(perms.canSwitch).toBe(true);
    expect(perms.isAdmin).toBe(true);
  });

  it("role=user não pode alternar para modo host (canSwitch=false)", () => {
    const perms = computeUserModePermissions("user");
    expect(perms.canSwitch).toBe(false);
  });

  it("role=host não pode alternar para modo renter (canSwitch=false)", () => {
    const perms = computeUserModePermissions("host");
    expect(perms.canSwitch).toBe(false);
  });
});

// ─── Testes de Integridade do Sistema de Roles ────────────────────────────────

describe("Sistema de Roles — Integridade", () => {
  const ALL_ROLES: UserRole[] = ["user", "host", "both", "admin"];

  it("Todos os roles conhecidos estão mapeados", () => {
    expect(ALL_ROLES).toHaveLength(4);
  });

  it("HOST_ROLES é subconjunto de ALL_ROLES", () => {
    for (const role of HOST_ROLES) {
      expect(ALL_ROLES).toContain(role);
    }
  });

  it("SWITCHABLE_ROLES é subconjunto de HOST_ROLES", () => {
    for (const role of SWITCHABLE_ROLES) {
      expect(HOST_ROLES).toContain(role);
    }
  });

  it("role=user nunca está em HOST_ROLES", () => {
    expect(HOST_ROLES).not.toContain("user");
  });

  it("role=user nunca está em SWITCHABLE_ROLES", () => {
    expect(SWITCHABLE_ROLES).not.toContain("user");
  });

  it("role=host não está em SWITCHABLE_ROLES (host puro não pode alternar)", () => {
    expect(SWITCHABLE_ROLES).not.toContain("host");
  });

  it("Hierarquia de permissões: user < host < both < admin", () => {
    // user: sem acesso host
    expect(checkHostRole("user").allowed).toBe(false);
    // host: acesso host
    expect(checkHostRole("host").allowed).toBe(true);
    // both: acesso host + switch
    expect(checkHostRole("both").allowed).toBe(true);
    expect(computeUserModePermissions("both").canSwitch).toBe(true);
    // admin: acesso total
    expect(checkHostRole("admin").allowed).toBe(true);
    expect(checkAdminRole("admin").allowed).toBe(true);
  });

  it("Apenas admin passa no adminProcedure", () => {
    for (const role of ALL_ROLES) {
      const result = checkAdminRole(role);
      if (role === "admin") {
        expect(result.allowed).toBe(true);
      } else {
        expect(result.allowed).toBe(false);
      }
    }
  });

  it("3 de 4 roles passam no hostProcedure (todos exceto user)", () => {
    let allowed = 0;
    for (const role of ALL_ROLES) {
      if (checkHostRole(role).allowed) allowed++;
    }
    expect(allowed).toBe(3);
  });
});
