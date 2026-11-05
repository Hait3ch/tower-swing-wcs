// Pure mapping from `mongoexport --jsonArray` documents (Extended JSON) to Supabase rows.
/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = Record<string, any>;

export function mongoId(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && "$oid" in (v as Doc)) return String((v as Doc).$oid);
  return String(v);
}

export function mongoDate(v: unknown): string | null {
  if (v == null) return null;
  let raw: unknown = v;
  if (typeof v === "object" && "$date" in (v as Doc)) raw = (v as Doc).$date;
  if (raw && typeof raw === "object" && "$numberLong" in (raw as Doc)) raw = Number((raw as Doc).$numberLong);
  const d = new Date(raw as string | number);
  if (Number.isNaN(d.getTime())) throw new Error(`Bad date: ${JSON.stringify(v)}`);
  return d.toISOString();
}

const num = (v: unknown) =>
  v && typeof v === "object" ? Number((v as Doc).$numberInt ?? (v as Doc).$numberDouble ?? (v as Doc).$numberLong) : Number(v);

export function mapEvent(doc: Doc) {
  return {
    year: num(doc.year),
    name: doc.name,
    date: mongoDate(doc.date),
    max_capacity: num(doc.maxCapacity),
    is_active: !!doc.isActive,
    registration_open: doc.registrationOpen ?? true,
    waiting_list_enabled: doc.waitingListEnabled ?? true,
    price: num(doc.price),
    venue: doc.venue,
    address: doc.address,
    description: doc.description ?? null,
    created_at: mongoDate(doc.createdAt) ?? new Date().toISOString(),
  };
}

export function mapRegistration(doc: Doc, eventIdMap: Map<string, string>) {
  const mongoEventId = mongoId(doc.eventId);
  return {
    first_name: doc.firstName,
    last_name: doc.lastName,
    email: String(doc.email).trim().toLowerCase(),
    phone: doc.phone,
    experience: doc.experience,
    dietary_restrictions: doc.dietaryRestrictions ?? null,
    emergency_contact: doc.emergencyContact ?? null,
    payment_status: doc.paymentStatus ?? "pending",
    event_id: (mongoEventId && eventIdMap.get(mongoEventId)) ?? null,
    event_year: doc.eventYear != null ? num(doc.eventYear) : null,
    registration_date: mongoDate(doc.registrationDate) ?? mongoDate(doc.createdAt),
    event_date: mongoDate(doc.eventDate),
    price: num(doc.price),
    notes: doc.notes ?? null,
    created_at: mongoDate(doc.createdAt) ?? mongoDate(doc.registrationDate),
  };
}
