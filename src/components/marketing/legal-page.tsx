import { GlassPanel } from "@/components/ui/glass-panel";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

/**
 * The shared legal-document layout: sticky "On this page" nav, version and
 * date, numbered sections. Used by Terms, Privacy, Cookies and the DPA.
 */
export function LegalPage({
  kicker,
  title,
  intro,
  sections,
  aside,
}: {
  kicker: string;
  title: string;
  intro: React.ReactNode;
  sections: LegalSection[];
  aside?: React.ReactNode;
}) {
  return (
    <main className="relative mx-auto grid max-w-[1320px] gap-8 px-4 sm:px-6 lg:px-8 py-10 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="On this page" className="hidden lg:block">
        <div className="sticky top-8">
          <p className="text-[11.5px] font-bold text-ink-muted">On this page</p>
          <ul className="mt-3 flex flex-col gap-1.5">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="block text-[12.5px] leading-snug text-ink-secondary hover:text-violet"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
          {aside ? <div className="mt-6">{aside}</div> : null}
        </div>
      </nav>

      <article className="min-w-0">
        <p className="text-[12px] font-bold text-ink-muted">{kicker}</p>
        <h1 className="mt-1.5 text-[clamp(30px,4vw,42px)] font-extrabold tracking-[-0.035em]">
          {title}
        </h1>

        <div className="mt-4 max-w-[70ch] text-[14.5px] leading-relaxed text-ink-secondary">
          {intro}
        </div>

        <div className="mt-9 flex flex-col gap-7">
          {sections.map((section, index) => (
            <GlassPanel key={section.id} id={section.id} as="section" className="scroll-mt-8">
              <h2 className="flex items-baseline gap-3 text-[17px] font-extrabold">
                <span className="text-[12px] font-extrabold text-ink-faint tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.title}
              </h2>
              <div className="mt-2.5 max-w-[70ch] text-[13.5px] leading-relaxed text-ink-secondary [&_a]:font-bold [&_a]:text-violet [&_li]:mt-1 [&_p+p]:mt-3 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
                {section.body}
              </div>
            </GlassPanel>
          ))}
        </div>
      </article>
    </main>
  );
}
