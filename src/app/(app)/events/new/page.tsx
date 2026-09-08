import { createEvent } from "@/server/events/mutations";

/**
 * "New event" creates the draft server-side and hands straight over to the
 * builder, so the event has an id from the first keystroke and autosave has
 * somewhere to write.
 */
export default async function NewEventPage() {
  await createEvent();
}
