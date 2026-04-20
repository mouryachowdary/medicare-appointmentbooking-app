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
import { CalendarDays, AlertTriangle, CheckCircle2, Users } from "lucide-react";

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

  // Reset UI state when bookings are cleared (e.g. after expiry)
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

  // Derive booked slot IDs from all bookings + live localStorage read
  const bookedSlotIds = useMemo(() => {
    const ids = new Set(bookings.map((b) => b.slotId));
    // Also merge live localStorage data to catch any sync lag
    try {
      const raw = localStorage.getItem("medschedule_bookings");
      if (raw) {
        const live: { slotId: string }[] = JSON.parse(raw);
        live.forEach((b) => ids.add(b.slotId));
      }
    } catch {}
    return ids;
  }, [bookings]);

  // Apply booked status to slots
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
    if (confirmInFlightRef.current) return;
    confirmInFlightRef.current = true;

    const existing = getExistingBooking(bookings, currentPatient.id, selectedDate);
    if (existing) {
      setBookingFailed(true);
      toast({
        variant: "destructive",
        title: "Double-Booking Prevented",
        description: `Patient ${currentPatient.id} already has a booking on this date. Existing Slot ID: ${existing.bookingId}.`,
      });
      setSelectedSlotId(null);
      confirmInFlightRef.current = false;
      return;
    }

    // Re-check slot availability from shared storage (cross-tab)
    if (isSlotBooked(selectedSlotId)) {
      refresh();
      setSelectedSlotId(null);
      setBookingFailed(true);
      toast({
        variant: "destructive",
        title: "Slot Already Booked",
        description: "This slot has already been booked by another patient. Please select a different time.",
      });
      confirmInFlightRef.current = false;
      return;
    }

    setValidatingSlotId(selectedSlotId);
    await new Promise((r) => setTimeout(r, 300));

    const selectedSlot = slots.find((s) => s.id === selectedSlotId);
    if (!selectedSlot) { confirmInFlightRef.current = false; return; }

    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    const bookingId = `SLT-${1001 + bookings.length}`;
    const booking: Booking = {
      bookingId,
      patientId: currentPatient.id,
      slotId: selectedSlot.id,
      date: dateStr,
      slotLabel: selectedSlot.label,
      providerName: provider.name,
    };

    const success = addBooking(booking);
    if (!success) {
      refresh();
      setValidatingSlotId(null);
      setSelectedSlotId(null);
      setBookingFailed(true);
      toast({
        variant: "destructive",
        title: "Slot Already Booked",
        description: "This slot was just booked by another patient. Please select a different time.",
      });
      confirmInFlightRef.current = false;
      return;
    }

    setCurrentBooking(booking);
    setValidatingSlotId(null);
    setIsConfirmed(true);
    setBookingFailed(false);

    toast({
      title: "Appointment Confirmed!",
      description: `Booking ID: ${booking.bookingId} | Patient: ${currentPatient.id} | ${format(selectedDate, "MMM d")} at ${selectedSlot.label}`,
    });
    confirmInFlightRef.current = false;
  }, [selectedSlotId, selectedDate, slots, bookings, currentPatient, isSlotBooked, addBooking, toast]);

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
        {currentBooking && (
          <div
            data-testid={isConfirmed ? "booking-success" : "booking-info"}
            className="mb-6 flex items-center gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 px-5 py-4"
          >
            {isConfirmed ? (
              <CheckCircle2 className="h-6 w-6 shrink-0 text-success" />
            ) : (
              <AlertTriangle className="h-6 w-6 shrink-0 text-primary" />
            )}
            <div>
              <p className="font-display text-sm font-semibold text-foreground">
                {isConfirmed ? "Booking Confirmed" : "Existing Booking Found"}
              </p>
              <p className="font-body text-sm text-muted-foreground">
                Slot ID: <span className="font-semibold text-primary">{currentBooking.bookingId}</span>
                {" · "}Patient: <span className="font-semibold">{currentBooking.patientId}</span>
                {" · "}{currentBooking.slotLabel} with {currentBooking.providerName}
                {" · "}{format(selectedDate, "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        )}

        {bookingFailed && (
          <div
            data-testid="booking-failed"
            className="mb-6 flex items-center gap-3 rounded-xl border-2 border-destructive/30 bg-destructive/5 px-5 py-4"
          >
            <AlertTriangle className="h-6 w-6 shrink-0 text-destructive" />
            <div>
              <p className="font-display text-sm font-semibold text-foreground">
                Booking Failed
              </p>
              <p className="font-body text-sm text-muted-foreground">
                You already have an appointment on this date. Only one booking per day is allowed.
              </p>
            </div>
          </div>
        )}

        <section
          data-testid="available-patients-card"
          className="mb-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3"
        >
          <div className="flex items-start gap-2.5">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-foreground">
                Available Patients ({PATIENTS.length})
              </p>
              <p className="font-body text-xs text-muted-foreground">
                {PATIENTS.map((patient) => `${patient.name} (${patient.id})`).join(" • ")}
              </p>
            </div>
          </div>
        </section>

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
                disabled={(date) => {
                  const d = date.getDay();
                  return d === 0 || d === 6 || date < new Date(new Date().setHours(0, 0, 0, 0));
                }}
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
              {displaySlots.length > 0 && (
                <span className="rounded-full bg-success/10 px-3 py-1 font-display text-xs font-semibold text-success">
                  {availableCount} available
                </span>
              )}
            </div>

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
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;
