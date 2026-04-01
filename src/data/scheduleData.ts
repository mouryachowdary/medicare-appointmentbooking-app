export interface TimeSlot {
  id: string;
  time: string;
  label: string;
  status: "available" | "booked" | "recently-booked";
}

export interface Provider {
  id: string;
  name: string;
  specialty: string;
  credentials: string;
  avatar: string;
  rating: number;
  reviewCount: number;
}

export interface Booking {
  bookingId: string;
  patientId: string;
  slotId: string;
  date: string;
  slotLabel: string;
  providerName: string;
}

export const PATIENTS = [
  { id: "007", name: "James Bond" },
  { id: "008", name: "Jane Smith" },
] as const;

export type PatientInfo = (typeof PATIENTS)[number];

export const provider: Provider = {
  id: "dr-001",
  name: "Dr. Sarah Mitchell",
  specialty: "Cardiologist",
  credentials: "MD, FACC — Board Certified",
  avatar: "",
  rating: 4.9,
  reviewCount: 237,
};

export function getExistingBooking(bookings: Booking[], patientId: string, date: Date): Booking | null {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return bookings.find((b) => b.patientId === patientId && b.date === dateStr) ?? null;
}

export function createBooking(
  bookings: Booking[],
  patientId: string,
  slot: TimeSlot,
  date: Date,
  providerName: string
): { updatedBookings: Booking[]; booking: Booking } {
  const bookingId = `SLT-${1001 + bookings.length}`;
  const booking: Booking = {
    bookingId,
    patientId,
    slotId: slot.id,
    date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
    slotLabel: slot.label,
    providerName,
  };
  return { updatedBookings: [...bookings, booking], booking };
}

export function simulateDoubleBookingCheck(bookings: Booking[], patientId: string, date: Date): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const existing = getExistingBooking(bookings, patientId, date);
      resolve(existing !== null);
    }, 300);
  });
}

export function generateSlots(date: Date): TimeSlot[] {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return [];

  const baseSlots = [
    { time: "09:00", label: "9:00 AM" },
    { time: "09:30", label: "9:30 AM" },
    { time: "10:00", label: "10:00 AM" },
    { time: "10:30", label: "10:30 AM" },
    { time: "11:00", label: "11:00 AM" },
    { time: "11:30", label: "11:30 AM" },
    { time: "13:00", label: "1:00 PM" },
    { time: "13:30", label: "1:30 PM" },
    { time: "14:00", label: "2:00 PM" },
    { time: "14:30", label: "2:30 PM" },
    { time: "15:00", label: "3:00 PM" },
    { time: "15:30", label: "3:30 PM" },
    { time: "16:00", label: "4:00 PM" },
    { time: "16:30", label: "4:30 PM" },
  ];

  return baseSlots.map((slot) => ({
    id: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}-${slot.time}`,
    time: slot.time,
    label: slot.label,
    status: "available" as const,
  }));
}
