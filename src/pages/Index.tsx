```tsx
// (imports unchanged)
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import ProviderCard from "@/components/ProviderCard";
import TimeSlotGrid from "@/components/TimeSlotGrid";
import BookingSummary from "@/components/BookingSummary";
import PatientSwitcher from "@/components/PatientSwitcher";
import { useSharedBookings } from "@/hooks/useSharedBookings";
import {
  provider,
  generateSlots,
  getExistingBooking,
  PATIENTS,
  PatientInfo,
  TimeSlot,
  Booking,
} from "@/data/scheduleData";
import { CalendarDays, AlertTriangle, CheckCircle2 } from "lucide-react";

const Index = () => {
  const [currentPatient, setCurrentPatient] = useState<PatientInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [validatingSlotId, setValidatingSlotId] = useState<string | null>(null);
  const [conflictSlotId, setConflictSlotId] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [bookingFailed, setBookingFailed] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>(() => generateSlots(new Date()));
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const confirmInFlightRef = useRef(false);
  const { bookings, addBooking, isSlotBooked, refresh } = useSharedBookings();
  const { toast } = useToast();

  const prevBookingsLenRef = useRef(bookings.length);
  useEffect(() => {
    if (prevBookingsLenRef.current > 0 && bookings.length === 0) {
      setSelectedSlotId(null);
      setConflictSlotId(null);
      setIsConfirmed(false);
      setBookingFailed(false);
      setCurrentBooking(null);
      setValidatingSlotId(null);
    }
    prevBookingsLenRef.current = bookings.length;
  }, [bookings.length]);

  const bookedSlotIds = useMemo(() => {
    const ids = new Set(bookings.map((b) => b.slotId));
    try {
      const raw = localStorage.getItem("medschedule_bookings");
      if (raw) {
        const live: { slotId: string }[] = JSON.parse(raw);
        live.forEach((b) => ids.add(b.slotId));
      }
    } catch {}
    return ids;
  }, [bookings]);

  const displaySlots = useMemo(
    () =>
      slots.map((slot) =>
        bookedSlotIds.has(slot.id)
          ? { ...slot, status: "booked" as const }
          : slot
      ),
    [slots, bookedSlotIds]
  );

  useEffect(() => {
    if (!selectedSlotId || isConfirmed || validatingSlotId === selectedSlotId) return;
    if (!bookedSlotIds.has(selectedSlotId)) return;

    setConflictSlotId(selectedSlotId);
    setSelectedSlotId(null);
    setValidatingSlotId(null);
  }, [selectedSlotId, bookedSlotIds, isConfirmed, validatingSlotId]);

  const handlePatientSwitch = useCallback((patient: PatientInfo) => {
    setCurrentPatient(patient);
    setSelectedSlotId(null);
    setConflictSlotId(null);
    setIsConfirmed(false);
    setBookingFailed(false);
    setCurrentBooking(null);
  }, []);

  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setSlots(generateSlots(date));
    setSelectedSlotId(null);
    setConflictSlotId(null);
    setIsConfirmed(false);
    setBookingFailed(false);
    setCurrentBooking(null);
  }, []);

  const handleSlotSelect = useCallback((slot: TimeSlot) => {
    if (!currentPatient) {
      toast({ variant: "destructive", title: "No Patient Selected", description: "Please search and select a patient first." });
      return;
    }
    if (isSlotBooked(slot.id)) {
      refresh();
      toast({
        variant: "destructive",
        title: "Slot Already Booked",
        description: "This slot has already been booked by another patient. Please select a different time.",
      });
      return;
    }

    const existing = getExistingBooking(bookings, currentPatient.id, selectedDate);
    if (existing) {
      setBookingFailed(true);
      toast({
        variant: "destructive",
        title: "Already Booked",
        description: `You already have an appointment on this date (Slot ID: ${existing.bookingId}, Time: ${existing.slotLabel}). Only one booking per day is allowed.`,
      });
      return;
    }

    setSelectedSlotId(slot.id);
    setConflictSlotId(null);
    setIsConfirmed(false);
    setBookingFailed(false);
  }, [selectedDate, bookings, currentPatient, isSlotBooked, toast]);

  const handleConfirm = useCallback(async () => {
    if (!selectedSlotId || !currentPatient) return;

    const selectedSlot = slots.find((s) => s.id === selectedSlotId);
    if (!selectedSlot) return;

    const booking: Booking = {
      bookingId: "SLT-" + (1001 + bookings.length),
      patientId: currentPatient.id,
      slotId: selectedSlot.id,
      date: format(selectedDate, "yyyy-MM-dd"),
      slotLabel: selectedSlot.label,
      providerName: provider.name,
    };

    addBooking(booking);
    setCurrentBooking(booking);
    setIsConfirmed(true);

    toast({
      title: "Appointment Confirmed!",
      description: selectedSlot.label + " booked successfully.",
    });
  }, [selectedSlotId, selectedDate, slots, bookings.length, currentPatient, addBooking, toast]);

  const selectedSlot = useMemo(
    () => displaySlots.find((s) => s.id === selectedSlotId) ?? null,
    [displaySlots, selectedSlotId]
  );

  const availableCount = useMemo(
    () => displaySlots.filter((s) => s.status === "available").length,
    [displaySlots]
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            <h1 className="font-display text-xl font-bold text-foreground">
              MedSchedule
            </h1>
          </div>
          <PatientSwitcher currentPatient={currentPatient} onSwitch={handlePatientSwitch} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="w-full lg:w-[30%]">
            <ProviderCard provider={provider} />
            <div className="mt-6 rounded-xl bg-card p-4 shadow-card">
              <h3 className="mb-3 font-display text-sm font-semibold text-foreground">
                Select Date
              </h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="pointer-events-auto rounded-md"
              />
            </div>
          </aside>

          <section className="flex-1">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Available Times
                </h2>
                <p className="font-body text-sm text-muted-foreground">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </p>
              </div>
              <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                {availableCount} available
              </span>
            </div>

            {/* ✅ SAFE UI ADDITION */}
            {!currentPatient ? (
              <div className="flex flex-col items-center justify-center h-[350px] text-center border border-dashed rounded-xl">
                <p className="text-sm mb-3 text-muted-foreground">
                  Select a patient to view available slots
                </p>

                <div className="text-xs">
                  <span className="font-medium text-foreground">
                    Available users to search:
                  </span>

                  <div className="mt-2 flex flex-wrap gap-2 justify-center">
                    {PATIENTS.slice(0, 6).map((p) => (
                      <span
                        key={p.id}
                        className="px-2 py-1 bg-muted rounded-md text-xs"
                      >
                        {p.name} <span className="text-gray-400">({p.id})</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <TimeSlotGrid
                  slots={displaySlots}
                  selectedSlotId={selectedSlotId}
                  validatingSlotId={validatingSlotId}
                  conflictSlotId={conflictSlotId}
                  onSelect={handleSlotSelect}
                />

                <BookingSummary
                  provider={provider}
                  selectedDate={selectedDate}
                  selectedSlot={selectedSlot}
                  isValidating={validatingSlotId !== null}
                  isConfirmed={isConfirmed}
                  onConfirm={handleConfirm}
                />
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;
```
