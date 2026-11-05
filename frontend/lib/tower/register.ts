import type { EmailData } from "@/lib/email";

export type Experience = "beginner" | "intermediate" | "advanced";

export type RegistrationInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  experience: Experience;
};

export type RegisterResult =
  | { ok: true; isWaitingList: boolean; message: string }
  | { ok: false; message: string };

export type RegisterDeps = {
  rpc: (payload: Record<string, string>) => Promise<{
    data: { payment_status: string; registration_date: string } | null;
    error: { message: string } | null;
  }>;
  sendConfirmation: (data: EmailData) => Promise<void>;
};

// Messages are identical to the old Express API so the page behaves the same.
const ERRORS: Record<string, string> = {
  duplicate_email: "A registration with this email already exists",
  registration_closed: "Registration is currently closed for this event.",
  no_active_event: "No active event found. Registration is currently closed.",
};

export async function registerCore(input: RegistrationInput, deps: RegisterDeps): Promise<RegisterResult> {
  const v = {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
  };
  if (!v.firstName) return { ok: false, message: "First name is required" };
  if (!v.lastName) return { ok: false, message: "Last name is required" };
  if (v.firstName.length > 50 || v.lastName.length > 50) return { ok: false, message: "Name cannot exceed 50 characters" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) return { ok: false, message: "Please enter a valid email" };
  if (!v.phone) return { ok: false, message: "Phone number is required" };
  if (!["beginner", "intermediate", "advanced"].includes(input.experience)) {
    return { ok: false, message: "Experience must be beginner, intermediate, or advanced" };
  }

  const { data, error } = await deps.rpc({
    first_name: v.firstName,
    last_name: v.lastName,
    email: v.email,
    phone: v.phone,
    experience: input.experience,
  });
  if (error || !data) {
    const code = Object.keys(ERRORS).find((k) => error?.message.includes(k));
    if (!code) console.error("register_tower failed:", error?.message);
    return { ok: false, message: code ? ERRORS[code] : "Registration failed. Please try again." };
  }

  const isWaitingList = data.payment_status === "waiting";
  try {
    await deps.sendConfirmation({
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email,
      experience: input.experience,
      registrationDate: data.registration_date,
      waitingListStatus: isWaitingList ? "active" : "none",
    });
  } catch (emailError) {
    console.error("Email sending failed, but registration was saved:", emailError);
  }
  return {
    ok: true,
    isWaitingList,
    message: isWaitingList ? "Registration successful! You have been added to the waiting list." : "Registration successful",
  };
}
