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

          // Helper: invalidate appointment-related queries
          const invalidateAppointments = () => {
            queryClient.invalidateQueries({
              predicate: (query) => {
                const key = query.queryKey;
                return Array.isArray(key) && typeof key[0] === 'string' && (
                  key[0].includes('/api/appointments') ||
                  key[0].includes('/api/time-slots') ||
                  key[0].includes('/api/schedule-availability')
                );
              }
            });
          };

          // Helper: invalidate prescription-related queries
          const invalidatePrescriptions = () => {
            queryClient.invalidateQueries({
              predicate: (query) => {
                const key = query.queryKey;
                return Array.isArray(key) && typeof key[0] === 'string' &&
                  key[0].includes('/api/prescriptions');
              }
            });
          };

          // Helper: invalidate patient/admission data
          const invalidatePatients = () => {
            queryClient.invalidateQueries({
              predicate: (query) => {
                const key = query.queryKey;
                return Array.isArray(key) && typeof key[0] === 'string' && (
                  key[0].includes('/api/patients') ||
                  key[0].includes('/api/admissions') ||
                  key[0].includes('/api/beds')
                );
              }
            });
          };

          // Helper: invalidate schedule/doctor data
          const invalidateSchedules = () => {
            queryClient.invalidateQueries({
              predicate: (query) => {
                const key = query.queryKey;
                return Array.isArray(key) && typeof key[0] === 'string' && (
                  key[0].includes('/api/doctors') ||
                  key[0].includes('/api/doctor-schedules') ||
                  key[0].includes('/api/time-slots') ||
                  key[0].includes('/api/schedule-availability')
                );
              }
            });
          };

          if (data.type === "notification") {
            queryClient.invalidateQueries({ queryKey: ["/api/user-notifications", userId] });
            if (data.notification?.type === "appointment") {
              invalidateAppointments();
            }
          }

          // Admin broadcasts
          if (data.type === "admin_notification") {
            const ev = data.event;
            if (ev === "appointment_created" || ev === "appointment_updated" ||
                ev === "appointment_confirmed" || ev === "appointment_cancelled") {
              invalidateAppointments();
              queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && typeof q.queryKey[0] === 'string' && q.queryKey[0].includes('/api/activity-logs') });
            }
            if (ev === "prescription_created") {
              invalidatePrescriptions();
            }
            if (ev === "schedule_updated") {
              invalidateSchedules();
            }
            if (ev === "patient_admitted" || ev === "patient_discharged") {
              invalidatePatients();
              invalidateAppointments();
            }
          }

          // OPD Manager broadcasts (check-in, booking, cancellation)
          if (data.type === "opd_notification") {
            invalidateAppointments();
          }

          // Direct appointment update broadcast (sent to doctor on booking)
          if (data.type === "appointment_update") {
            invalidateAppointments();
          }

          // Check-in status updates broadcast
          if (data.type === "appointment_status_update") {
            invalidateAppointments();
            invalidatePrescriptions();
          }

          // Slot updates
          if (data.type === "slot_update") {
            invalidateAppointments();
          }

          // Nurse notifications
          if (data.type === "nurse_notification") {
            invalidatePatients();
          }

          // Medical store / prescription push
          if (data.type === "prescription_notification") {
            invalidatePrescriptions();
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
