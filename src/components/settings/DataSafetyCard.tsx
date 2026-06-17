import { ShieldCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TIPS = [
  "Údaje si pravidelne ukladajte a kontrolujte úplnosť záznamov.",
  "Kontrolujte prístup k zariadeniam, na ktorých sa aplikácia používa.",
  "Pri zmazaní záznamu alebo vozidla nie je obnova automatická.",
];

export function DataSafetyCard() {
  return (
    <Card className="border-brand-border bg-brand-surface text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <ShieldCheck className="h-5 w-5 text-brand-accent" />
          Dáta a bezpečnosť
        </CardTitle>
        <CardDescription className="text-white/60">
          Odporúčania pre bezpečné používanie aplikácie.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="ml-5 list-disc space-y-2 text-sm text-white/80">
          {TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
