import { Provider } from "@/data/scheduleData";
import { Star, BadgeCheck } from "lucide-react";

interface ProviderCardProps {
  provider: Provider;
}

const ProviderCard = ({ provider }: ProviderCardProps) => {
  return (
    <div className="rounded-xl bg-card p-6 shadow-card">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary font-display text-2xl font-bold text-primary-foreground">
          {provider.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {provider.name}
            </h2>
            <BadgeCheck className="h-5 w-5 text-primary" />
          </div>
          <p className="font-body text-sm text-muted-foreground">{provider.specialty}</p>
          <p className="font-body text-xs text-muted-foreground">{provider.credentials}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        <span className="font-display text-sm font-semibold text-foreground">{provider.rating}</span>
        <span className="text-sm text-muted-foreground">({provider.reviewCount} reviews)</span>
      </div>
    </div>
  );
};

export default ProviderCard;
