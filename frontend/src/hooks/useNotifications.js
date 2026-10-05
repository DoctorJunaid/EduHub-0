import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/Slices/authSlice";
import * as api from "@/api/notification.api";
import toast from "react-hot-toast";

export const NOTIFICATION_QK = ["user-notifications"];

export function useNotifications() {
  const queryClient = useQueryClient();
  const auth = useSelector(selectAuth);
  const user = auth?.user;
  const token = auth?.token || localStorage.getItem("eduHubToken");

  const [pushPermission, setPushPermission] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  });

  const seenIdsRef = useRef(new Set());
  const initialFetchDone = useRef(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: NOTIFICATION_QK,
    queryFn: async () => {
      const res = await api.getNotificationsApi({ limit: 30 });
      return {
        notifications: res.data || [],
        unreadCount: res.unreadCount || 0,
        total: res.total || 0,
      };
    },
    enabled: Boolean(token && user),
    refetchInterval: 20000, // Poll every 20s for real-time background updates
    staleTime: 10000,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Trigger Native Browser Web Push Notification when new unread notifications arrive
  useEffect(() => {
    if (!notifications.length) return;

    if (!initialFetchDone.current) {
      notifications.forEach((n) => seenIdsRef.current.add(n._id));
      initialFetchDone.current = true;
      return;
    }

    const newNotifications = notifications.filter(
      (n) => !n.isRead && !seenIdsRef.current.has(n._id)
    );

    if (newNotifications.length > 0) {
      newNotifications.forEach((item) => {
        seenIdsRef.current.add(item._id);

        // Native HTML5 Browser Push
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          try {
            const browserNotif = new Notification(item.title, {
              body: item.message,
              icon: "/favicon.ico",
              tag: item._id,
            });
            browserNotif.onclick = () => {
              window.focus();
              if (item.link) {
                window.location.href = item.link;
              }
            };
          } catch (e) {
            console.warn("Browser push display failed:", e);
          }
        }
      });
    }
  }, [notifications]);

  // Request browser desktop push permission
  const requestDesktopPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Browser notifications are not supported on this device.");
      return "unsupported";
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === "granted") {
        toast.success("Desktop push notifications enabled!");
      } else if (permission === "denied") {
        toast("Push notifications were disabled.", { icon: "🔔" });
      }
      return permission;
    } catch (e) {
      console.error("Error requesting notification permission:", e);
      return "default";
    }
  };

  // Mark single as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id) => api.markNotificationReadApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QK });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => api.markAllNotificationsReadApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QK });
      toast.success("All notifications marked as read");
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteNotificationApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QK });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    isError,
    refetch,
    markAsRead: (id) => markReadMutation.mutateAsync(id),
    markAllAsRead: () => markAllReadMutation.mutateAsync(),
    deleteNotification: (id) => deleteMutation.mutateAsync(id),
    requestDesktopPermission,
    pushPermission,
    isMarkingAll: markAllReadMutation.isPending,
  };
}

export default useNotifications;
