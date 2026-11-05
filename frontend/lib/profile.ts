export type Profile = { user_id: string; display_name: string; phone: string | null };

type ProfileInput = { display_name: string; phone: string };
type Result =
  | { ok: true; value: { display_name: string; phone: string | null } }
  | { ok: false; error: string };

/** Validates the account form. Phones are stored as digits with an optional leading "+". */
export function validateProfile(input: ProfileInput): Result {
  const display_name = input.display_name.trim();
  if (!display_name) return { ok: false, error: "Please enter your name." };
  if (display_name.length > 60) return { ok: false, error: "Name can be at most 60 characters." };

  const phone = input.phone.replace(/[\s\-().]/g, "");
  if (!phone) return { ok: true, value: { display_name, phone: null } };
  if (!/^\+?[0-9]{7,15}$/.test(phone)) {
    return { ok: false, error: "Phone number should look like +358401234567." };
  }
  return { ok: true, value: { display_name, phone } };
}

/** Post-login redirect target; only same-site relative paths are allowed. */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/partners";
  return next;
}
