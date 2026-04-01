import { useState, useEffect, useCallback, useRef } from "react";
import { Booking } from "@/data/scheduleData";

const STORAGE_KEY = "medschedule_bookings";
const TIMESTAMP_KEY = "medschedule_bookings_timestamp";
const CHANNEL_NAME = "medschedule_bookings_channel";
const LOCK_PREFIX = "medschedule_slot_lock";
const EXPIRY_MS = 60_000; // 1 minute
const LOCK_EXPIRY_MS = 2_000;

function getLockKey(slotId: string, date: string): string {
  return `${LOCK_PREFIX}:${date}:${slotId}`;
}

function acquireSlotLock(slotId: string, date: string): string | null {
  try {
    const lockKey = getLockKey(slotId, date);
    const current = localStorage.getItem(lockKey);

    if (current) {
      const [expiresAt] = current.split("|");
      if (Number(expiresAt) > Date.now()) return null;
    }

    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const payload = `${Date.now() + LOCK_EXPIRY_MS}|${token}`;
    localStorage.setItem(lockKey, payload);

    return localStorage.getItem(lockKey) === payload ? token : null;
  } catch {
    return null;
  }
}

function releaseSlotLock(slotId: string, date: string, token: string) {
  try {
    const lockKey = getLockKey(slotId, date);
    const current = localStorage.getItem(lockKey);
    if (current?.endsWith(`|${token}`)) {
      localStorage.removeItem(lockKey);
    }
  } catch {}
}

function isExpired(): boolean {
  const ts = localStorage.getItem(TIMESTAMP_KEY);
  // No timestamp yet — not expired, just not initialized
  if (!ts) return false;
  return Date.now() - Number(ts) > EXPIRY_MS;
}

function clearBookings() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TIMESTAMP_KEY);
}

function loadBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    // If there's data but timestamp confirms expiry, clear
    if (isExpired()) {
      clearBookings();
      return [];
    }

    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveBookings(bookings: Booking[]) {
  // Write timestamp BEFORE data to prevent race where another tab
  // sees data but no timestamp and treats it as expired
  if (!localStorage.getItem(TIMESTAMP_KEY)) {
    localStorage.setItem(TIMESTAMP_KEY, String(Date.now()));
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

export function useSharedBookings() {
  const [bookings, setBookings] = useState<Booking[]>(loadBookings);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const refreshFromStorage = useCallback(() => {
    const fresh = loadBookings();
    lastSnapshotRef.current = localStorage.getItem(STORAGE_KEY) ?? "";
    setBookings(fresh);
  }, []);

  // Auto-clear expired bookings every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isExpired()) {
        clearBookings();
        setBookings([]);
        try {
          channelRef.current?.postMessage("updated");
        } catch {}
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Track last-known storage snapshot for polling comparison
  const lastSnapshotRef = useRef<string>(localStorage.getItem(STORAGE_KEY) ?? "");

  useEffect(() => {
    // 1. BroadcastChannel (modern browsers)
    try {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current.onmessage = () => refreshFromStorage();
    } catch {
      // BroadcastChannel not supported
    }

    // 2. StorageEvent (fires in other tabs on same origin)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === TIMESTAMP_KEY) {
        refreshFromStorage();
      }
    };
    window.addEventListener("storage", handleStorage);

    // 3. Polling fallback — 500ms for snappier cross-tab sync
    const poll = setInterval(() => {
      const current = localStorage.getItem(STORAGE_KEY) ?? "";
      if (current !== lastSnapshotRef.current) {
        lastSnapshotRef.current = current;
        setBookings(loadBookings());
      }
    }, 500);

    // 4. Visibilitychange — immediate sync when tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshFromStorage();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
      channelRef.current?.close();
      clearInterval(poll);
    };
  }, [refreshFromStorage]);

  const addBooking = useCallback((booking: Booking): boolean => {
    const lockToken = acquireSlotLock(booking.slotId, booking.date);
    if (!lockToken) {
      setBookings(loadBookings());
      return false;
    }

    try {
    // Re-read from localStorage to get latest state (race condition guard)
    const current = loadBookings();
    
    // Check if slot already taken by another user
    if (current.some((b) => b.slotId === booking.slotId)) {
      setBookings(current);
      return false;
    }
    
    // Check if patient already has booking on this date
    if (current.some((b) => b.patientId === booking.patientId && b.date === booking.date)) {
      setBookings(current);
      return false;
    }

    const updated = [...current, booking];
    saveBookings(updated);
    setBookings(updated);
    
    try {
      channelRef.current?.postMessage("updated");
    } catch {}

    // Dispatch manual storage event so same-window listeners update too
    try {
      window.dispatchEvent(
        new StorageEvent("storage", { key: STORAGE_KEY, newValue: JSON.stringify(updated) })
      );
    } catch {}
    
    return true;
    } finally {
      releaseSlotLock(booking.slotId, booking.date, lockToken);
    }
  }, []);

  const isSlotBooked = useCallback((slotId: string): boolean => {
    return loadBookings().some((b) => b.slotId === slotId);
  }, []);

  return { bookings, addBooking, isSlotBooked, refresh: refreshFromStorage };
}
