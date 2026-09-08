import { FieldType } from "@/generated/prisma";

export type FieldSeed = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  order: number;
  options?: string[];
};

/**
 * The built-in fields, in the order screen 1d shows them. With the
 * organisation's "minimise by default" setting on — which is the default —
 * a new event starts with name and email only; phone and company have to be
 * switched on deliberately and justified.
 */
export const BUILT_IN_FIELDS: FieldSeed[] = [
  { key: "name", label: "Full name", type: FieldType.TEXT, required: true, order: 0 },
  { key: "email", label: "Email", type: FieldType.EMAIL, required: true, order: 1 },
  { key: "phone", label: "Phone", type: FieldType.PHONE, required: false, order: 2 },
  { key: "company", label: "Company", type: FieldType.COMPANY, required: false, order: 3 },
];

export const MINIMISED_FIELD_KEYS = new Set(["name", "email"]);

export function defaultFields(minimise: boolean): FieldSeed[] {
  return minimise
    ? BUILT_IN_FIELDS.filter((field) => MINIMISED_FIELD_KEYS.has(field.key))
    : BUILT_IN_FIELDS;
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  [FieldType.TEXT]: "Short text",
  [FieldType.EMAIL]: "Email",
  [FieldType.PHONE]: "Phone",
  [FieldType.COMPANY]: "Company",
  [FieldType.CHOICE]: "Choice",
  [FieldType.CHECKBOX]: "Checkbox",
};

/** Fields the minimisation setting requires a reason for. */
export function needsJustification(key: string): boolean {
  return !MINIMISED_FIELD_KEYS.has(key);
}
