export type Profile = { user_id: string; display_name: string; phone: string | null; whatsapp_username: string | null };

type ProfileInput = { display_name: string; phone: string; whatsapp_username: string; phone_ok: boolean };
type Result =
  | { ok: true; value: { display_name: string; phone: string | null; whatsapp_username: string | null } }
  | { ok: false; error: string };

/** Validates the account form. Phones are stored as digits with an optional leading "+". */
export function validateProfile(input: ProfileInput): Result {
  const display_name = input.display_name.trim();
  if (!display_name) return { ok: false, error: "Please enter your name." };
  if (display_name.length > 60) return { ok: false, error: "Name can be at most 60 characters." };

  const username = input.whatsapp_username.trim().replace(/^@/, "").toLowerCase();
  if (username && !/^[a-z0-9._]{3,35}$/.test(username)) {
    return { ok: false, error: "WhatsApp username can have 3–35 letters, numbers, dots or underscores." };
  }
  const whatsapp_username = username || null;

  const phone = input.phone.replace(/[\s\-().]/g, "");
  if (!phone) return { ok: true, value: { display_name, phone: null, whatsapp_username } };
  if (!/^\+?[0-9]{7,15}$/.test(phone)) {
    return { ok: false, error: "Phone number should look like +358401234567." };
  }
  if (!input.phone_ok) return { ok: false, error: "Please tick the box to agree to share your phone number, or leave it empty." };
  return { ok: true, value: { display_name, phone, whatsapp_username } };
}

/** Post-login redirect target; only same-site relative paths are allowed. */
export function safeNext(next: string | null | undefined): string {
  const fallback = "/partners";
  // Browsers strip tabs/newlines and treat "\" like "/", so "/\t/evil.com" would leave the site.
  if (!next || !next.startsWith("/") || /[\x00-\x20\\]/.test(next)) return fallback;
  try {
    const base = "http://same.invalid";
    const url = new URL(next, base);
    if (url.origin !== base) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
