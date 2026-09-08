import Link from "next/link";
import { GlassPanel } from "@/components/ui/glass-panel";

type Step = { key: string; label: string; hint: string; done: boolean; href: string | null };

/** Screen 7e — the four-step checklist a new account lands on. */
export function FirstRunChecklist({ steps, doneCount }: { steps: Step[]; doneCount: number }) {
  return (
    <GlassPanel>
      <h2 className="text-[13px] font-extrabold text-ink-muted">
        Getting started · {doneCount} of {steps.length} done
      </h2>
      <ol className="mt-4 divide-y divide-black/6">
        {steps.map((step, index) => (
          <li key={step.key} className="flex items-center gap-3.5 py-3.5">
            <span
              aria-hidden
              className={
                step.done
                  ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-tile bg-teal/18 text-[14px] font-extrabold text-teal-darker"
                  : "flex h-8 w-8 shrink-0 items-center justify-center rounded-tile bg-white text-[13px] font-extrabold text-ink-muted"
              }
            >
              {step.done ? "✓" : index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-bold">{step.label}</span>
              <span className="block text-[12px] text-ink-muted">{step.hint}</span>
            </span>
            {!step.done && step.href ? (
              <Link
                href={step.href}
                className="shrink-0 text-[12.5px] font-bold text-violet hover:text-violet-hover"
              >
                Start →
              </Link>
            ) : null}
          </li>
        ))}
      </ol>
    </GlassPanel>
  );
}
