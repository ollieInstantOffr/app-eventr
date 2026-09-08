import "server-only";
import { randomInt } from "node:crypto";
import { EventStatus, FieldType, type Event } from "@/generated/prisma";
import { prisma } from "@/server/db";
import { renderConsentText, DEFAULT_CONSENT_TEMPLATE, DEFAULT_CONSENT_VERSION } from "@/server/consent";

const FIRST_NAMES = [
  "Jonas", "Sofia", "Priya", "Tomas", "Elin", "Ahmed", "Anna", "Erik", "Lina", "Marcus",
  "Nadia", "Oskar", "Petra", "Rasmus", "Sara", "Viktor", "Yasmin", "Zaid", "Ida", "Nils",
];

const LAST_NAMES = [
  "Ek", "Lindgren", "Raman", "Berg", "Åkesson", "Khalil", "Nyström", "Sandberg", "Holm",
  "Persson", "Dahl", "Falk", "Grönlund", "Hedlund", "Isaksson", "Jonsson", "Karlsson",
];

const COMPANIES = [
  "Spotify", "Klarna", "Ericsson", "Northvolt", "Truecaller", "Tink", "Voi", "Kry", "Einride",
];

const TALKS = ["AI keynote", "Design systems", "Hardware"];

function pick<T>(values: readonly T[]): T {
  return values[randomInt(0, values.length)]!;
}

/**
 * "Try it with sample data" from screen 7e — a demo event with 40 fake
 * entries, including a couple of deliberate duplicates so the Duplicates tab
 * and the eligibility rules have something to show.
 */
export async function seedDemoEvent(organisationId: string): Promise<Event> {
  const organisation = await prisma.organisation.findUniqueOrThrow({
    where: { id: organisationId },
  });

  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 14);
  const entriesCloseAt = new Date(eventDate);
  entriesCloseAt.setHours(16, 0, 0, 0);
  const drawAt = new Date(eventDate);
  drawAt.setHours(16, 30, 0, 0);

  const slug = `demo-${Date.now().toString(36)}`;

  const event = await prisma.event.create({
    data: {
      organisationId,
      slug,
      name: "Demo raffle — sample data",
      status: EventStatus.PUBLISHED,
      publishedAt: new Date(),
      eventDate,
      entriesCloseAt,
      drawAt,
      venueLabel: "Stand B12",
      welcomeMessage:
        "Drop your details for a chance to win. Winners are drawn live at the main stage at 16:30.",
      maskPersonalData: organisation.maskNamesOnScreen,
      nextEntryNumber: 1,
      fields: {
        create: [
          { key: "name", label: "Full name", type: FieldType.TEXT, required: true, order: 0 },
          { key: "email", label: "Email", type: FieldType.EMAIL, required: true, order: 1 },
          { key: "phone", label: "Phone", type: FieldType.PHONE, required: false, order: 2 },
          { key: "company", label: "Company", type: FieldType.COMPANY, required: false, order: 3 },
          {
            key: "talk",
            label: "Which talk are you most excited about?",
            type: FieldType.CHOICE,
            required: false,
            order: 4,
            options: TALKS,
          },
        ],
      },
      prizes: {
        create: [
          { order: 0, name: 'MacBook Air 13"', meta: "M4 · 16 GB", winnerCount: 1 },
          { order: 1, name: "Sony WH-1000XM6", meta: "Noise cancelling", winnerCount: 1 },
          { order: 2, name: "Weekend stay", meta: "Two nights, breakfast", winnerCount: 1 },
        ],
      },
    },
  });

  const consentText = renderConsentText(
    DEFAULT_CONSENT_TEMPLATE,
    organisation,
    organisation.retentionPeriod,
  );

  const entries: Array<{
    number: number;
    name: string;
    email: string;
    phone: string;
    company: string;
    talk: string;
  }> = [];

  for (let index = 0; index < 40; index += 1) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const company = pick(COMPANIES);
    entries.push({
      number: index + 1,
      name: `${first} ${last}`,
      email: `${first}.${last}${index}`.toLowerCase().replace(/[^a-z0-9.]/g, "") + "@example.com",
      phone: `+4670${String(1000000 + randomInt(0, 8999999)).slice(0, 7)}`,
      company,
      talk: pick(TALKS),
    });
  }

  // Two deliberate duplicates, so the Duplicates tab is not empty.
  if (entries[3] && entries[11]) entries[11].email = entries[3].email;
  if (entries[7] && entries[22]) entries[22].phone = entries[7].phone;

  const seenEmails = new Map<string, number>();
  const seenPhones = new Map<string, number>();

  for (const entry of entries) {
    const duplicate = seenEmails.has(entry.email) || seenPhones.has(entry.phone);
    const createdAt = new Date(Date.now() - (40 - entry.number) * 90_000);

    await prisma.entry.create({
      data: {
        eventId: event.id,
        number: entry.number,
        name: entry.name,
        email: entry.email,
        phone: entry.phone,
        data: {
          name: entry.name,
          email: entry.email,
          phone: entry.phone,
          company: entry.company,
          talk: entry.talk,
        },
        isDuplicate: duplicate,
        consentText,
        consentVersion: DEFAULT_CONSENT_VERSION,
        consentedAt: createdAt,
        createdAt,
      },
    });

    seenEmails.set(entry.email, entry.number);
    seenPhones.set(entry.phone, entry.number);
  }

  return prisma.event.update({
    where: { id: event.id },
    data: { nextEntryNumber: entries.length + 1 },
  });
}
