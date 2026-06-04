import { useState } from "react";
import { Bell, X, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";


/**
 * Componente NotificationBell - Ícone de notificações com dropdown
 */
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [, navigate] = useLocation();
  
  // Buscar notificações
  const { data: notifications, isLoading, refetch } = trpc.notification.getMyNotifications.useQuery(
    { limit: 10 },
    { enabled: isOpen }
  );
  
  const markAsReadMutation = trpc.notification.markAsRead.useMutation();
  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation();
  
  // Contar notificações não lidas
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
  
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsReadMutation.mutateAsync({ id: notificationId });
      refetch();
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      refetch();
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  };
  
  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-muted rounded-lg transition-colors"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80">
          <Card className="shadow-lg">
            {/* Header */}
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Notificações</CardTitle>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    disabled={markAllAsReadMutation.isPending}
                    className="text-xs h-7"
                  >
                    Marcar todas como lidas
                  </Button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            
            {/* Content */}
            <CardContent className="p-0">
              {isLoading && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Carregando notificações...
                </div>
              )}
              
              {!isLoading && (!notifications || notifications.length === 0) && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Nenhuma notificação
                </div>
              )}
              
              {!isLoading && notifications && notifications.length > 0 && (
                <ScrollArea className="h-96">
                  <div className="space-y-1 p-2">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={() => handleMarkAsRead(notification.id)}
                        isMarking={markAsReadMutation.isPending}
                        onClose={() => setIsOpen(false)}
                        navigate={navigate}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          style={{ pointerEvents: "auto" }}
          onClickCapture={(e) => {
            // Previne que cliques dentro do dropdown fechem o dropdown
            if (e.currentTarget === e.target) {
              setIsOpen(false);
            }
          }}
        />
      )}
    </div>
  );
}

/**
 * Componente individual de notificação
 */
function NotificationItem({
  notification,
  onMarkAsRead,
  isMarking,
  onClose,
  navigate,
}: {
  notification: any;
  onMarkAsRead: () => void;
  isMarking: boolean;
  onClose?: () => void;
  navigate?: (path: string) => void;
}) {
  const [isNavigating, setIsNavigating] = useState(false);
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case "booking_request":
      case "booking_confirmed":
        return "bg-blue-100 text-blue-800";
      case "payment_received":
      case "payment_confirmed":
        return "bg-green-100 text-green-800";
      case "payment_failed":
        return "bg-red-100 text-red-800";
      case "booking_cancelled":
        return "bg-red-100 text-red-800";
      case "document_approved":
        return "bg-emerald-100 text-emerald-800";
      case "document_rejected":
        return "bg-orange-100 text-orange-800";
      case "message_received":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "booking_request":
        return "Nova Solicitação de Reserva";
      case "booking_confirmed":
        return "Reserva Confirmada";
      case "payment_received":
      case "payment_confirmed":
        return "Pagamento Recebido";
      case "payment_failed":
        return "Pagamento Falhou";
      case "booking_cancelled":
        return "Reserva Cancelada";
      case "document_approved":
        return "Documento Aprovado";
      case "document_rejected":
        return "Documento Rejeitado";
      case "review_received":
        return "Nova Avaliação";
      case "message_received":
        return "Nova Mensagem";
      case "fine_issued":
        return "Multa Emitida";
      case "system":
        return "Notificação do Sistema";
      default:
        return "Notificação";
    }
  };
  
  const getNavigationPath = (type: string) => {
    switch (type) {
      case "booking_request":
      case "booking_confirmed":
      case "booking_cancelled":
        return "/my-bookings";
      case "payment_received":
      case "payment_confirmed":
      case "payment_failed":
        return "/receipts";
      case "review_received":
        // Link directly to review page if we have a booking relatedId
        return notification.relatedId && notification.relatedType === "booking"
          ? `/bookings/${notification.relatedId}/review`
          : "/my-bookings";
      case "message_received":
        return "/messages";
      case "document_approved":
      case "document_rejected":
        return "/verify-identity";
      case "fine_issued":
        return "/fines";
      case "system":
        return null;
      default:
        return null;
    }
  };
  
  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsNavigating(true);
    
    if (!notification.isRead) {
      await onMarkAsRead();
    }
    const path = getNavigationPath(notification.notificationType);
    if (path && navigate) {
      navigate(path);
      onClose?.();
    }
    
    setIsNavigating(false);
  };
  
  return (
    <button
      type="button"
      disabled={isNavigating}
      className={`w-full text-left p-3 rounded-lg border cursor-pointer transition-colors ${
        isNavigating ? "opacity-60 cursor-wait" : ""
      } ${
        notification.isRead
          ? "bg-muted/30 border-border/50"
          : "bg-muted border-border hover:bg-muted/50"
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <Badge className={`text-xs mt-0.5 ${getTypeColor(notification.notificationType)}`}>
          {getTypeLabel(notification.notificationType)}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium line-clamp-2 flex items-center gap-2">
            {notification.title}
            {isNavigating && <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />}
          </p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(notification.createdAt).toLocaleDateString("pt-BR", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        {!notification.isRead && (
          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
        )}
      </div>
    </button>
  );
}
