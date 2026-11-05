import { describe, it, expect } from "vitest";
import { mapEvent, mapRegistration, mongoId } from "../scripts/mongo-map";

const eventDoc = {
  _id: { $oid: "6650a1b2c3d4e5f600000001" },
  year: 2025,
  name: "Tower Swing 2025",
  date: { $date: "2025-06-28T13:00:00Z" },
  maxCapacity: 40,
  isActive: true,
  registrationOpen: false,
  waitingListEnabled: true,
  price: 15,
  venue: "REDI Floor 33",
  address: "Hermannin rantatie 5",
  createdAt: { $date: "2025-05-01T10:00:00Z" },
  updatedAt: { $date: "2025-06-01T10:00:00Z" },
  __v: 0,
};

const regDoc = {
  _id: { $oid: "6650a1b2c3d4e5f6000000aa" },
  firstName: "Aino",
  lastName: "Virtanen",
  email: "Aino@Example.com",
  phone: "+358401234567",
  experience: "intermediate",
  paymentStatus: "paid",
  eventId: "6650a1b2c3d4e5f600000001",
  eventYear: 2025,
  registrationDate: { $date: "2025-05-10T08:00:00.000Z" },
  eventDate: { $date: "2025-06-28T13:00:00Z" },
  price: 15,
  emergencyContact: { name: "Mom", phone: "1", relationship: "mother" },
};

describe("mongo → supabase mapping", () => {
  it("reads ObjectIds in both export styles", () => {
    expect(mongoId({ $oid: "abc" })).toBe("abc");
    expect(mongoId("abc")).toBe("abc");
  });

  it("maps events and converts $date", () => {
    expect(mapEvent(eventDoc)).toEqual({
      year: 2025,
      name: "Tower Swing 2025",
      date: "2025-06-28T13:00:00.000Z",
      max_capacity: 40,
      is_active: true,
      registration_open: false,
      waiting_list_enabled: true,
      price: 15,
      venue: "REDI Floor 33",
      address: "Hermannin rantatie 5",
      description: null,
      created_at: "2025-05-01T10:00:00.000Z",
    });
  });

  it("maps registrations and links the event via the id map", () => {
    const idMap = new Map([["6650a1b2c3d4e5f600000001", "uuid-1"]]);
    expect(mapRegistration(regDoc, idMap)).toMatchObject({
      first_name: "Aino",
      email: "aino@example.com",
      payment_status: "paid",
      event_id: "uuid-1",
      event_year: 2025,
      registration_date: "2025-05-10T08:00:00.000Z",
      event_date: "2025-06-28T13:00:00.000Z",
      emergency_contact: { name: "Mom", phone: "1", relationship: "mother" },
      dietary_restrictions: null,
      notes: null,
    });
  });

  it("leaves event_id null when the event is unknown or missing", () => {
    expect(mapRegistration({ ...regDoc, eventId: undefined }, new Map()).event_id).toBeNull();
    expect(mapRegistration(regDoc, new Map()).event_id).toBeNull();
  });

  it("accepts plain ISO strings and $date with $numberLong", () => {
    expect(mapEvent({ ...eventDoc, date: "2025-06-28T13:00:00Z" }).date).toBe("2025-06-28T13:00:00.000Z");
    expect(mapEvent({ ...eventDoc, date: { $date: { $numberLong: "1751115600000" } } }).date).toBe(
      new Date(1751115600000).toISOString(),
    );
  });
});
