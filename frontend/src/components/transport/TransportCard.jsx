import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Bus, MapPin, Clock, Phone, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import { getMyTransportApi } from "@/api/transport.api";

/**
 * TransportCard Component
 * Displays student transit info (Bus Number, Driver Name & Phone, Assigned Stop).
 * Strictly renders only if the student requires transport (usesTransport === true).
 */
export default function TransportCard({ student = null, studentId = null }) {
  const currentUser = useSelector(selectCurrentUser);
  const targetId = studentId || student?.id || student?._id || currentUser?.id || currentUser?._id;

  // React Query fetch for multi-tenant self or parent-scoped transport info
  const { data: transportResponse, isLoading } = useQuery({
    queryKey: ["transport", "my-transport", targetId],
    queryFn: () => getMyTransportApi(targetId),
    enabled: Boolean(targetId),
    staleTime: 5 * 60 * 1000,
  });

  const transportData = transportResponse?.data || null;

  // Determine if transport is active
  const isEnrolled = Boolean(
    student?.usesTransport === true ||
    student?.transportEnrolled === true ||
    transportResponse?.usesTransport === true ||
    transportResponse?.assigned === true ||
    transportData?.usesTransport === true ||
    transportData?.assigned === true
  );

  // If student does not use transport, render nothing
  if (!isEnrolled && !isLoading) {
    return null;
  }

  if (isLoading && !transportData) {
    return (
      <Card className="p-4 flex items-center justify-center gap-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs">
        <Spinner className="w-4 h-4 text-indigo-600" />
        <span className="text-xs text-muted-foreground font-medium">
          Loading assigned transport details...
        </span>
      </Card>
    );
  }

  if (!transportData) {
    return null;
  }

  // Gracefully handle null / deleted routes or vehicles
  const route = transportData.route || null;
  const vehicle = transportData.vehicle || null;
  const driver = transportData.driver || null;
  const stop = transportData.stop || null;

  const busNumber = vehicle?.busNumber || "Bus Pending";
  const driverName = driver?.name || "Driver to be assigned";
  const driverPhone = driver?.phone || "—";
  const stopName = stop?.stopName || transportData.student?.stopName || "Designated Stop";
  const pickupTime = stop?.pickupTime || "07:15 AM";

  return (
    <Card className="sd-transport-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs relative overflow-hidden transition-all hover:shadow-sm">
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Bus className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {route?.routeName || "Campus Transit Route"}
            </span>
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-2 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold"
            >
              Enrolled Commuter
            </Badge>
          </div>
          <h3 className="text-base font-bold text-foreground leading-snug truncate">
            {busNumber}{" "}
            {vehicle?.model && vehicle.model !== "—" && (
              <span className="text-xs font-normal text-muted-foreground">
                ({vehicle.model} · {vehicle.plateNumber})
              </span>
            )}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap w-full md:w-auto shrink-0">
        {/* Designated Stop */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs">
          <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-tight">
              Assigned Stop
            </span>
            <strong className="text-foreground leading-tight">{stopName}</strong>
            <span className="text-muted-foreground block text-[11px] leading-tight">
              Pickup: {pickupTime}
            </span>
          </div>
        </div>

        {/* Driver Contact */}
        <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs min-w-[180px]">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-tight">
              Driver Name & Phone
            </span>
            <strong className="text-foreground leading-tight block">{driverName}</strong>
            <span className="text-muted-foreground block text-[11px] leading-tight font-mono">
              {driverPhone}
            </span>
          </div>
          {driverPhone && driverPhone !== "—" && (
            <Button
              size="sm"
              variant="outline"
              asChild
              className="h-7 text-xs gap-1 border-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              <a href={`tel:${driverPhone}`}>
                <Phone className="w-3 h-3 text-emerald-600" />
                Call
              </a>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
