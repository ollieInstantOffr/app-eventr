import { AmbientBackground } from "@/components/ui/ambient-background";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Toggle } from "@/components/ui/toggle";
import { GlassPanel, PanelSection } from "@/components/ui/glass-panel";
import { Logo } from "@/components/ui/logo";

export const metadata = { title: "Style guide" };

/** Every primitive on one page, so drift is obvious. */
export default function StyleguidePage() {
  return (
    <main className="relative min-h-screen bg-screen px-8 py-10">
      <AmbientBackground />
      <div className="relative mx-auto flex max-w-4xl flex-col gap-6">
        <GlassPanel className="flex items-center justify-between">
          <Logo size="lg" />
          <Badge tone="live" dot>
            Live
          </Badge>
        </GlassPanel>

        <PanelSection title="Buttons" hint="Violet is the single action colour.">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Publish &amp; get QR</Button>
            <Button variant="secondary">Save draft</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="danger">Delete event permanently</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Create your first event</Button>
          </div>
        </PanelSection>

        <PanelSection title="Fields">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Event name" htmlFor="sg-name">
              <Input id="sg-name" defaultValue="Nordic Tech Expo 2026" />
            </Field>
            <Field label="Entries close" htmlFor="sg-close" hint="Local time">
              <Input id="sg-close" type="time" defaultValue="16:00" />
            </Field>
            <Field label="Claim window" htmlFor="sg-claim">
              <Select id="sg-claim" defaultValue="TODAY">
                <option value="MINUTES_15">15 min</option>
                <option value="HOUR_1">1 h</option>
                <option value="TODAY">Today</option>
                <option value="DAYS_7">7 days</option>
              </Select>
            </Field>
            <Field label="Email" htmlFor="sg-email" error="That address doesn't look right">
              <Input id="sg-email" defaultValue="mara@" />
            </Field>
            <Field label="Welcome message" htmlFor="sg-welcome" className="sm:col-span-2">
              <Textarea
                id="sg-welcome"
                defaultValue="Drop your details for a chance to win. Winners are drawn live at the main stage at 16:30."
              />
            </Field>
          </div>
          <div className="mt-2 divide-y divide-black/6">
            <Toggle checked label="Mask names on the live screen" description="“Jonas E.” instead of full names in public." />
            <Toggle checked={false} label="Separate marketing opt-in" description="Keeps raffle consent and marketing consent apart." />
          </div>
        </PanelSection>

        <PanelSection title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge>Draft</Badge>
            <Badge tone="violet">Published</Badge>
            <Badge tone="live" dot>Live now</Badge>
            <Badge tone="warn">Possible duplicate</Badge>
            <Badge tone="danger">Erasure due</Badge>
          </div>
        </PanelSection>
      </div>
    </main>
  );
}
