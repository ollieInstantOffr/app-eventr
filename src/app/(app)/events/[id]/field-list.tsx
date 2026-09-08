"use client";

import { useState } from "react";
import { FieldType } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";

export type BuilderField = {
  id?: string;
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string[];
  justification: string | null;
};

const TYPE_LABELS: Record<FieldType, string> = {
  [FieldType.TEXT]: "Short text",
  [FieldType.EMAIL]: "Email",
  [FieldType.PHONE]: "Phone",
  [FieldType.COMPANY]: "Company",
  [FieldType.CHOICE]: "Choice",
  [FieldType.CHECKBOX]: "Checkbox",
};

const BUILT_IN: Array<{ key: string; label: string; type: FieldType }> = [
  { key: "name", label: "Full name", type: FieldType.TEXT },
  { key: "email", label: "Email", type: FieldType.EMAIL },
  { key: "phone", label: "Phone", type: FieldType.PHONE },
  { key: "company", label: "Company", type: FieldType.COMPANY },
];

// The two fields the minimise-by-default setting considers unremarkable.
const MINIMAL_KEYS = new Set(["name", "email"]);

/**
 * Screen 1b's "Entry form fields · Drag to reorder". The order here is the
 * order the guest sees on their phone.
 */
export function FieldList({
  fields,
  minimiseByDefault,
  onChange,
}: {
  fields: BuilderField[];
  minimiseByDefault: boolean;
  onChange: (fields: BuilderField[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function move(from: number, to: number) {
    if (to < 0 || to >= fields.length || from === to) return;
    const next = [...fields];
    const [moved] = next.splice(from, 1);
    if (moved) next.splice(to, 0, moved);
    onChange(next);
  }

  function patch(index: number, changes: Partial<BuilderField>) {
    onChange(fields.map((field, i) => (i === index ? { ...field, ...changes } : field)));
  }

  function remove(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  const missing = BUILT_IN.filter((builtIn) => !fields.some((field) => field.key === builtIn.key));

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {fields.map((field, index) => {
          const justificationNeeded = minimiseByDefault && !MINIMAL_KEYS.has(field.key);
          const isCustom = !BUILT_IN.some((builtIn) => builtIn.key === field.key);

          return (
            <li
              key={field.key}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) move(dragIndex, index);
                setDragIndex(null);
              }}
              className={cn(
                "rounded-field bg-white p-3 transition-shadow",
                dragIndex === index && "opacity-60 shadow-lift",
              )}
            >
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="cursor-grab text-[13px] leading-none text-ink-faint select-none"
                  title="Drag to reorder"
                >
                  ⋮⋮
                </span>

                <Input
                  aria-label={`Field ${index + 1} label`}
                  value={field.label}
                  onChange={(e) => patch(index, { label: e.target.value })}
                  className="h-9 flex-1 text-[13px]"
                />

                {isCustom ? (
                  <Select
                    aria-label="Field type"
                    value={field.type}
                    onChange={(e) => patch(index, { type: e.target.value as FieldType })}
                    className="h-9 w-[130px] text-[12.5px]"
                  >
                    {[FieldType.TEXT, FieldType.CHOICE, FieldType.CHECKBOX].map((type) => (
                      <option key={type} value={type}>
                        {TYPE_LABELS[type]}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <span className="w-[130px] shrink-0 text-[12px] font-bold text-ink-muted">
                    {TYPE_LABELS[field.type]}
                  </span>
                )}

                <label className="flex shrink-0 items-center gap-1.5 text-[12px] font-bold text-ink-muted">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => patch(index, { required: e.target.checked })}
                    className="h-4 w-4 accent-violet"
                  />
                  Required
                </label>

                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove ${field.label}`}
                  className="shrink-0 rounded px-1.5 text-[15px] leading-none text-ink-faint hover:text-danger"
                >
                  ×
                </button>
              </div>

              {field.type === FieldType.CHOICE ? (
                <Input
                  aria-label="Choices, comma separated"
                  value={field.options.join(", ")}
                  placeholder="AI keynote, Design systems, Hardware"
                  onChange={(e) =>
                    patch(index, {
                      options: e.target.value
                        .split(",")
                        .map((option) => option.trim())
                        .filter(Boolean),
                    })
                  }
                  className="mt-2 h-9 text-[12.5px]"
                />
              ) : null}

              {justificationNeeded ? (
                <Input
                  aria-label={`Why do you need ${field.label}?`}
                  value={field.justification ?? ""}
                  placeholder="Why do you need this? Stored with the event."
                  onChange={(e) => patch(index, { justification: e.target.value || null })}
                  className="mt-2 h-9 bg-violet-tint/60 text-[12.5px]"
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            onChange([
              ...fields,
              {
                key: `custom_${Date.now().toString(36)}`,
                label: "",
                type: FieldType.TEXT,
                required: false,
                options: [],
                justification: null,
              },
            ])
          }
        >
          + Add custom question
        </Button>

        {missing.map((builtIn) => (
          <Button
            key={builtIn.key}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange([
                ...fields,
                {
                  key: builtIn.key,
                  label: builtIn.label,
                  type: builtIn.type,
                  required: false,
                  options: [],
                  justification: null,
                },
              ])
            }
          >
            + {builtIn.label}
          </Button>
        ))}
      </div>

      {minimiseByDefault ? (
        <p className="mt-1 text-[11.5px] leading-snug text-ink-muted">
          Your organisation collects name and email by default. Anything else needs a reason, which
          is stored with the event and shown in your processing record.
        </p>
      ) : null}
    </div>
  );
}
