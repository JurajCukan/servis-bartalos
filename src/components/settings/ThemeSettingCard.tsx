import { Monitor, Moon, Sun } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTheme, type Theme } from "@/components/theme/ThemeProvider";

const OPTIONS: { value: Theme; label: string; description: string; icon: typeof Sun }[] = [
  { value: "light", label: "Svetlý režim", description: "Svetlé pozadie aplikácie.", icon: Sun },
  { value: "dark", label: "Tmavý režim", description: "Tmavé pozadie aplikácie.", icon: Moon },
  {
    value: "system",
    label: "Podľa systému",
    description: "Sleduje nastavenie operačného systému.",
    icon: Monitor,
  },
];

export function ThemeSettingCard() {
  const { theme, setTheme } = useTheme();

  return (
    <Card className="border-brand-border bg-brand-surface text-brand-fg">
      <CardHeader>
        <CardTitle className="text-brand-fg">Vzhľad</CardTitle>
        <CardDescription className="text-brand-fg-muted">
          Vyberte si režim zobrazenia aplikácie.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={theme}
          onValueChange={(v) => setTheme(v as Theme)}
          className="grid gap-3 sm:grid-cols-3"
        >
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.value;
            return (
              <Label
                key={opt.value}
                htmlFor={`theme-${opt.value}`}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                  active
                    ? "border-brand-accent bg-brand-accent/10"
                    : "border-brand-border bg-brand-bg hover:border-brand-border"
                }`}
              >
                <RadioGroupItem
                  id={`theme-${opt.value}`}
                  value={opt.value}
                  className="mt-1 border-brand-border text-brand-accent"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-brand-fg">
                    <Icon className="h-4 w-4" />
                    {opt.label}
                  </div>
                  <p className="text-xs text-brand-fg-muted">{opt.description}</p>
                </div>
              </Label>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
