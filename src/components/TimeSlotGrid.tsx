import { TimeSlot } from "@/data/scheduleData";
import { Clock, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlotId: string | null;
  validatingSlotId: string | null;
  conflictSlotId: string | null;
  onSelect: (slot: TimeSlot) => void;
}

const TimeSlotGrid = ({
  slots,
  selectedSlotId,
  validatingSlotId,
  conflictSlotId,
  onSelect,
}: TimeSlotGridProps) => {
  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Clock className="mb-3 h-10 w-10" />
        <p className="font-display text-base font-medium">No slots available</p>
        <p className="text-sm">This provider is not available on weekends.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {slots.map((slot) => {
        const isSelected = selectedSlotId === slot.id;
        const isValidating = validatingSlotId === slot.id;
        const isConflict = conflictSlotId === slot.id;
        const isBooked = slot.status === "booked" || slot.status === "recently-booked";

        return (
          <button
            key={slot.id}
            data-testid={`slot-${slot.label.replace(/\s+/g, "-").toLowerCase()}`}
            disabled={isBooked || isValidating}
            onClick={() => onSelect(slot)}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-lg border-2 px-4 py-4 font-display text-sm font-semibold transition-colors",
              !isBooked && !isSelected && !isConflict &&
                "border-border bg-card text-foreground hover:border-primary hover:bg-primary/5",
              isSelected && !isConflict &&
                "border-primary bg-primary/10 text-primary",
              isValidating && "cursor-wait border-primary bg-primary/10 text-primary",
              isBooked && !isConflict &&
                "cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-60",
              isConflict &&
                "cursor-not-allowed border-destructive bg-destructive/10 text-destructive"
            )}
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isConflict ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4 opacity-50" />
            )}
            <span className="mt-1">{slot.label}</span>
            {isConflict && (
              <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-destructive">
                Just Booked
              </span>
            )}
            {isBooked && !isConflict && (
              <span className="mt-1 text-[10px] font-medium uppercase tracking-wider">
                Booked
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TimeSlotGrid;
