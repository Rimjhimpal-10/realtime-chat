"use client";

import { createRealtime } from "@upstash/realtime/client";
import type { RealtimeEvents } from "./realtime";

export const { useRealtime } =
  createRealtime<RealtimeEvents>();

// createRealtime() initializes the realtime client once.
// useRealtime() is a custom hook that lets any component
// access the same realtime connection (like useQuery() from React Query).
// RealtimeEvents gives full TypeScript autocomplete and validation
// for all publish/subscribe events.