import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { UserNotification } from "@shared/schema";

interface UseNotificationsOptions {
  userId: string;
  userRole: string;
  enabled?: boolean;
}

export function useNotifications({ userId, userRole, enabled = true }: UseNotificationsOptions) {
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: notifications = [], isLoading, refetch } = useQuery<UserNotification[]>({
    queryKey: ["/api/user-notifications", userId],
    enabled: enabled && !!userId,
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("PATCH", `/api/user-notifications/${notificationId}/read`);
    },
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/user-notifications", userId] });
      const previousData = queryClient.getQueryData<UserNotification[]>(["/api/user-notifications", userId]);
      queryClient.setQueryData<UserNotification[]>(
        ["/api/user-notifications", userId],
        (old) => old?.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      return { previousData };
    },
    onError: (_err, _notificationId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["/api/user-notifications", userId], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-notifications", userId] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/user-notifications/${userId}/read-all`);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["/api/user-notifications", userId] });
      const previousData = queryClient.getQueryData<UserNotification[]>(["/api/user-notifications", userId]);
      queryClient.setQueryData<UserNotification[]>(
        ["/api/user-notifications", userId],
        (old) => old?.map(n => ({ ...n, isRead: true }))
      );
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["/api/user-notifications", userId], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-notifications", userId] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("DELETE", `/api/user-notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-notifications", userId] });
    },
  });

  const connectWebSocket = useCallback(() => {
    if (!enabled || !userId || !userRole) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications?userId=${userId}&userRole=${userRole}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        console.log("WebSocket notification connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "notification") {
            queryClient.invalidateQueries({ queryKey: ["/api/user-notifications", userId] });
          }
        } catch (e) {
          console.error("WebSocket message parse error:", e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        console.log("WebSocket notification disconnected");
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
    }
  }, [userId, userRole, enabled]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const unreadNotifications = notifications.filter((n) => !n.isRead);

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    isLoading,
    wsConnected,
    markAsRead: markReadMutation.mutate,
    markAllAsRead: markAllReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    refetch,
  };
}
