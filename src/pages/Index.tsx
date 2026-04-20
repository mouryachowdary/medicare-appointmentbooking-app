```tsx
import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import ProviderCard from "@/components/ProviderCard";
import TimeSlotGrid from "@/components/TimeSlotGrid";
import BookingSummary from "@/components/BookingSummary";
import PatientSwitcher from "@/components/PatientSwitcher";
import {
  provider,
  generateSlots,
  PATIENTS,
} from "@/data/scheduleData";
import { CalendarDays } from "lucide-react";

const Index = () => {
  const [currentPatient, setCurrentPatient] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [slots, setSlots] = useState(generateSlots(new Date()));

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setSlots(generateSlots(date));
    setSelectedSlotId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">MedSchedule</h1>
          </div>
          <PatientSwitcher
            currentPatient={currentPatient}
            onSwitch={setCurrentPatient}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">

          <aside className="w-full lg:w-[30%]">
            <ProviderCard provider={provider} />

            <div className="mt-6 bg-card p-4 rounded-xl">
              <h3 className="mb-3 text-sm font-semibold">Select Date</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
              />
            </div>
          </aside>

          <section className="flex-1">
            <h2 className="text-lg font-semibold mb-2">Available Times</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </p>

            {!currentPatient ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center border border-dashed rounded-xl">
                <h2 className="text-lg font-semibold mb-2">
                  No Patient Selected
                </h2>

                <p className="text-sm mb-4">
                  Please select a patient to continue.
                </p>

                <div className="text-xs">
                  <span className="font-medium">
                    Available users to search:
                  </span>

                  <div className="mt-3 flex flex-wrap gap-2 justify-center">
                    {PATIENTS.slice(0, 6).map((p: any) => (
                      <span
                        key={p.id}
                        className="px-3 py-1 bg-muted rounded-md text-xs"
                      >
                        {p.name}{" "}
                        <span className="text-gray-400">({p.id})</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <TimeSlotGrid
                  slots={slots}
                  selectedSlotId={selectedSlotId}
                  onSelect={(slot: any) => setSelectedSlotId(slot.id)}
                />

                <BookingSummary
                  provider={provider}
                  selectedDate={selectedDate}
                  selectedSlot={
                    slots.find((s: any) => s.id === selectedSlotId) || null
                  }
                  isConfirmed={false}
                  onConfirm={() => {}}
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
