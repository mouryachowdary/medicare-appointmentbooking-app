import { Provider, TimeSlot } from "@/data/scheduleData";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface BookingSummaryProps {
  provider: Provider;
  selectedDate: Date;
  selectedSlot: TimeSlot | null;
  isValidating: boolean;
  isConfirmed: boolean;
  onConfirm: () => void;
}

const BookingSummary = ({
  provider,
  selectedDate,
  selectedSlot,
  isValidating,
  isConfirmed,
  onConfirm,
}: BookingSummaryProps) => {
  if (!selectedSlot) return null;

  return (
    <div
      data-testid="booking-summary"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card px-4 py-4 shadow-elevated sm:px-6 lg:static lg:mt-6 lg:rounded-xl lg:border lg:shadow-card"
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarCheck className="h-5 w-5 text-success" />
          <div>
            <p className="font-display text-sm font-semibold text-foreground">
              {provider.name} — {provider.specialty}
            </p>
            <p className="font-body text-sm text-muted-foreground">
              {format(selectedDate, "EEEE, MMMM d, yyyy")} at {selectedSlot.label}
            </p>
          </div>
        </div>
        <Button
          data-testid="confirm-button"
          onClick={onConfirm}
          disabled={isValidating || isConfirmed}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold"
        >
          {isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking…
            </>
          ) : isConfirmed ? (
            "Confirmed ✓"
          ) : (
            "Confirm Appointment"
          )}
        </Button>
      </div>
    </div>
  );
};

export default BookingSummary;
