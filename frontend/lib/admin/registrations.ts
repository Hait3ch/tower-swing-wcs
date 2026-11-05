import type { EmailData } from "@/lib/email";

export type PaymentStatus = "pending" | "paid" | "cancelled" | "waiting";
export const PAYMENT_STATUSES: readonly PaymentStatus[] = ["pending", "paid", "cancelled", "waiting"];

type UpdatedRegistration = {
  first_name: string;
  last_name: string;
  email: string;
  experience: string;
  registration_date: string;
};

export type StatusDeps = {
  update: (id: string, status: PaymentStatus) => Promise<UpdatedRegistration | null>;
  sendPayment: (data: EmailData) => Promise<void>;
  sendRegistration: (data: EmailData) => Promise<void>;
};

/** Updates a registration's status and sends the same emails the old backend did. */
export async function applyStatusChange(id: string, status: PaymentStatus, deps: StatusDeps): Promise<void> {
  if (!PAYMENT_STATUSES.includes(status)) throw new Error("Invalid status");
  const reg = await deps.update(id, status);
  if (!reg) throw new Error("Registration not found");

  const data: EmailData = {
    firstName: reg.first_name,
    lastName: reg.last_name,
    email: reg.email,
    experience: reg.experience,
    registrationDate: reg.registration_date,
  };
  try {
    if (status === "paid") await deps.sendPayment(data);
    else if (status === "pending") await deps.sendRegistration({ ...data, waitingListStatus: "none" });
  } catch (err) {
    console.error(`Status email (${status}) failed:`, err);
  }
}
