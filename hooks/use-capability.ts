"use client";

import { useAppStore } from "@/hooks/use-app-store";
import {
  type CapabilityName,
  DEFAULT_CAPABILITIES,
  type UserCapabilities,
} from "@/lib/types/user.type";

/**
 * Returns whether the current user has a given capability. Capabilities are
 * additive flags on the profile that let one account list properties, buy,
 * manage properties, and lease as a tenant in any combination.
 *
 * Falls back to DEFAULT_CAPABILITIES when the user is not loaded yet.
 */
export function useCapability(name: CapabilityName): boolean {
  const user = useAppStore((s) => s.user);
  const caps: UserCapabilities = user?.capabilities ?? DEFAULT_CAPABILITIES;
  return Boolean(caps[name]);
}

export function useCapabilities(): UserCapabilities {
  const user = useAppStore((s) => s.user);
  return user?.capabilities ?? DEFAULT_CAPABILITIES;
}
