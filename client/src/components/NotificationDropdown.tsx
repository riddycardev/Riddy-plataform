/**
 * NotificationDropdown
 * Dropdown funcional de notificações com dados reais do banco
 */

import { trpc } from "@/lib/trpc";
import { Bell, Check, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";

interface NotificationDropdownProps {
  theme?: "cyan" | "emerald" | "red";
}

export default function NotificationDropdown({ theme = "cyan" }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  // Fetch notifications
  const { data: notifications, refetch } = trpc.notification.getMyNotifications.useQuery(
    { limit: 10 },
    { refetchInterval: 30000 } // Refetch every 30s
  );

  // Mark as read mutation
  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const themeColors = {
    cyan: {
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      hover: "hover:bg-cyan-500/20",
      border: "border-cyan-500/30",
      badge: "bg-cyan-500",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      hover: "hover:bg-emerald-500/20",
      border: "border-emerald-500/30",
      badge: "bg-emerald-500",
    },
    red: {
      bg: "bg-red-500/10",
      text: "text-red-400",
      hover: "hover:bg-red-500/20",
      border: "border-red-500/30",
      badge: "bg-red-500",
    },
  };

  const colors = themeColors[theme];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking_request":
        return "🚗";
      case "booking_confirmed":
        return "✅";
      case "booking_cancelled":
        return "❌";
      case "payment_received":
        return "💰";
      case "payment_failed":
        return "⚠️";
      case "review_received":
        return "⭐";
      case "message_received":
        return "💬";
      case "document_approved":
        return "📄";
      case "document_rejected":
        return "🚫";
      case "fine_issued":
        return "🚨";
      default:
        return "🔔";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 ${colors.hover} rounded-lg transition`}
      >
        <Bell className={`w-5 h-5 ${colors.text}`} />
        {unreadCount > 0 && (
          <span className={`absolute top-1 right-1 w-5 h-5 ${colors.badge} text-white text-xs rounded-full flex items-center justify-center font-bold`}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-96 bg-slate-900 border ${colors.border} rounded-lg shadow-2xl z-50 max-h-[500px] overflow-hidden flex flex-col`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${colors.border}`}>
            <h3 className="text-white font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className={`text-xs ${colors.text} ${colors.hover} px-2 py-1 rounded transition`}
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {!notifications || notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 ${notification.isRead ? "bg-slate-900" : colors.bg} hover:bg-slate-800/50 transition cursor-pointer`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsReadMutation.mutate({ id: notification.id });
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getNotificationIcon(notification.notificationType)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`font-medium ${notification.isRead ? "text-gray-300" : "text-white"}`}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className={`w-2 h-2 ${colors.badge} rounded-full mt-1.5 flex-shrink-0`}></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications && notifications.length > 0 && (
            <div className={`p-3 border-t ${colors.border} text-center`}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to notifications section based on user role
                  if (theme === "red") {
                    // Admin doesn't have notifications section, just close dropdown
                    return;
                  } else if (theme === "emerald") {
                    // Host doesn't have notifications section, just close dropdown
                    return;
                  } else {
                    window.location.href = "/dashboard?section=notifications";
                  }
                }}
                className={`text-sm ${colors.text} ${colors.hover} px-4 py-2 rounded transition`}
              >
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
