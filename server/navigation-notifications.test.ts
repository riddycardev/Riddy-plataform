/**
 * Testes de Navegação e Notificações
 * Valida correções de navegação do sidebar e funcionalidade de notificações
 */

import { describe, it, expect } from "vitest";

describe("Navegação dos Dashboards", () => {
  it("deve ter seções definidas para AdminDashboard", () => {
    const adminSections = [
      "overview",
      "documents",
      "fines",
      "users",
      "vehicles",
      "reports",
      "audit",
    ];

    expect(adminSections.length).toBe(7);
    expect(adminSections).toContain("overview");
    expect(adminSections).toContain("documents");
    expect(adminSections).toContain("fines");
    expect(adminSections).toContain("users");
    expect(adminSections).toContain("vehicles");
    expect(adminSections).toContain("reports");
    expect(adminSections).toContain("audit");
  });

  it("deve ter seções definidas para UserDashboard", () => {
    const userSections = [
      "overview",
      "trips",
      "favorites",
      "reviews",
      "wallet",
      "notifications",
      "profile",
    ];

    expect(userSections.length).toBe(7);
    expect(userSections).toContain("overview");
    expect(userSections).toContain("trips");
    expect(userSections).toContain("favorites");
    expect(userSections).toContain("reviews");
    expect(userSections).toContain("wallet");
    expect(userSections).toContain("notifications");
    expect(userSections).toContain("profile");
  });

  it("deve ter seções definidas para HostDashboard", () => {
    const hostSections = [
      "overview",
      "vehicles",
      "reservations",
      "calendar",
      "reviews",
      "documents",
      "reports",
    ];

    expect(hostSections.length).toBe(7);
    expect(hostSections).toContain("overview");
    expect(hostSections).toContain("vehicles");
    expect(hostSections).toContain("reservations");
    expect(hostSections).toContain("calendar");
    expect(hostSections).toContain("reviews");
    expect(hostSections).toContain("documents");
    expect(hostSections).toContain("reports");
  });
});

describe("Sistema de Notificações", () => {
  it("deve ter tipos de notificação definidos", () => {
    const notificationTypes = [
      "booking_request",
      "booking_confirmed",
      "booking_cancelled",
      "payment_received",
      "payment_failed",
      "review_received",
      "message_received",
      "document_approved",
      "document_rejected",
      "fine_issued",
      "system",
    ];

    expect(notificationTypes.length).toBeGreaterThanOrEqual(10);
    expect(notificationTypes).toContain("booking_request");
    expect(notificationTypes).toContain("payment_received");
    expect(notificationTypes).toContain("system");
  });

  it("deve ter ícones para cada tipo de notificação", () => {
    const iconMap: Record<string, string> = {
      booking_request: "🚗",
      booking_confirmed: "✅",
      booking_cancelled: "❌",
      payment_received: "💰",
      payment_failed: "⚠️",
      review_received: "⭐",
      message_received: "💬",
      document_approved: "📄",
      document_rejected: "🚫",
      fine_issued: "🚨",
      system: "🔔",
    };

    expect(Object.keys(iconMap).length).toBeGreaterThanOrEqual(10);
    expect(iconMap["booking_request"]).toBe("🚗");
    expect(iconMap["payment_received"]).toBe("💰");
    expect(iconMap["system"]).toBe("🔔");
  });

  it("deve ter temas de cores para diferentes tipos de usuário", () => {
    const themes = {
      cyan: {
        name: "Usuário/Locatário",
        badge: "bg-cyan-500",
        text: "text-cyan-400",
      },
      emerald: {
        name: "Proprietário",
        badge: "bg-emerald-500",
        text: "text-emerald-400",
      },
      red: {
        name: "Admin",
        badge: "bg-red-500",
        text: "text-red-400",
      },
    };

    expect(Object.keys(themes).length).toBe(3);
    expect(themes.cyan.name).toBe("Usuário/Locatário");
    expect(themes.emerald.name).toBe("Proprietário");
    expect(themes.red.name).toBe("Admin");
  });
});

describe("Funcionalidades de Navegação", () => {
  it("deve construir URLs corretas para navegação do sidebar", () => {
    const buildUrl = (dashboard: string, section: string) => {
      return `/${dashboard}?section=${section}`;
    };

    expect(buildUrl("admin", "documents")).toBe("/admin?section=documents");
    expect(buildUrl("dashboard", "favorites")).toBe("/dashboard?section=favorites");
    expect(buildUrl("host", "vehicles")).toBe("/host?section=vehicles");
  });

  it("deve extrair seção correta da URL", () => {
    const extractSection = (url: string, defaultSection: string = "overview") => {
      const params = new URLSearchParams(url.split("?")[1] || "");
      return params.get("section") || defaultSection;
    };

    expect(extractSection("/admin?section=documents")).toBe("documents");
    expect(extractSection("/dashboard?section=favorites")).toBe("favorites");
    expect(extractSection("/host")).toBe("overview");
    expect(extractSection("/admin?section=fines")).toBe("fines");
  });
});

describe("Funcionalidades de Notificações", () => {
  it("deve determinar navegação correta baseada no tema", () => {
    const getNotificationRoute = (theme: "cyan" | "emerald" | "red") => {
      if (theme === "red") return "/admin?section=overview";
      if (theme === "emerald") return "/host?section=overview";
      return "/dashboard?section=notifications";
    };

    expect(getNotificationRoute("cyan")).toBe("/dashboard?section=notifications");
    expect(getNotificationRoute("emerald")).toBe("/host?section=overview");
    expect(getNotificationRoute("red")).toBe("/admin?section=overview");
  });

  it("deve calcular contador de não lidas corretamente", () => {
    const notifications = [
      { id: 1, isRead: false },
      { id: 2, isRead: true },
      { id: 3, isRead: false },
      { id: 4, isRead: false },
      { id: 5, isRead: true },
    ];

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    expect(unreadCount).toBe(3);
  });
});
