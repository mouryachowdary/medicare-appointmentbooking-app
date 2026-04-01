import { useState, useRef, useEffect, useCallback } from "react";
import { PATIENTS, PatientInfo } from "@/data/scheduleData";
import { User, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientSwitcherProps {
  currentPatient: PatientInfo | null;
  onSwitch: (patient: PatientInfo) => void;
}

const PatientSwitcher = ({ currentPatient, onSwitch }: PatientSwitcherProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track whether a selection click is in progress to prevent outside-click race
  const selectingRef = useRef(false);

  const filtered = PATIENTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );

  // Focus input when dropdown opens
  useEffect(() => {
    if (open) {
      // Use rAF to ensure DOM is painted before focusing (Firefox needs this)
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        console.log("[PatientSwitcher] search input mounted & focused");
      });
    }
  }, [open]);

  // Close on outside click, but not during a selection
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (selectingRef.current) return;
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        console.log("[PatientSwitcher] selector closed (outside click)");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      console.log(`[PatientSwitcher] selector ${next ? "opened" : "closed"}`);
      return next;
    });
    setSearch("");
  }, []);

  const handleSelect = useCallback((patient: PatientInfo) => {
    selectingRef.current = true;
    console.log(`[PatientSwitcher] patient selected: ${patient.id}`);
    onSwitch(patient);
    setOpen(false);
    setSearch("");
    console.log("[PatientSwitcher] selector closed (selection)");
    // Reset guard after microtask so the mousedown handler doesn't race
    queueMicrotask(() => { selectingRef.current = false; });
  }, [onSwitch]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        data-testid="patient-selector"
        onClick={handleToggle}
        className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 font-display text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
      >
        <User className="h-4 w-4" />
        <span>
          {currentPatient
            ? `${currentPatient.name} (${currentPatient.id})`
            : "Select Patient"}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          data-testid="patient-dropdown"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-card shadow-elevated"
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              data-testid="patient-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients..."
              autoComplete="off"
              className="flex-1 bg-transparent font-body text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {search.trim() === "" ? (
              <p className="px-3 py-4 text-center font-body text-sm text-muted-foreground">
                Type a name or ID to search
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-4 text-center font-body text-sm text-muted-foreground">
                No patients found
              </p>
            ) : (
              filtered.map((patient) => (
                <button
                  type="button"
                  key={patient.id}
                  data-testid={`patient-${patient.id}`}
                  onClick={() => handleSelect(patient)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    currentPatient?.id === patient.id
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full font-display text-xs font-bold",
                    currentPatient?.id === patient.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {patient.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold">{patient.name}</p>
                    <p className="font-body text-xs text-muted-foreground">ID: {patient.id}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientSwitcher;
