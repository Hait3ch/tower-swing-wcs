export type Role = "leader" | "follower";

export type QueueRow = {
  id: string;
  event_id: string;
  user_id: string;
  role: Role;
  note: string | null;
  created_at: string;
  display_name: string;
};

/** Orders each role's queue by join time (id breaks ties) and assigns 1-based positions. */
export function numberQueue(rows: QueueRow[]): Array<QueueRow & { position: number }> {
  const sorted = [...rows].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
  const next: Record<Role, number> = { leader: 0, follower: 0 };
  return sorted.map((row) => ({ ...row, position: ++next[row.role] }));
}

/** WhatsApp click-to-chat link. Local Finnish numbers (0…) are converted to +358. */
export function waLink(phone: string, eventName: string): string {
  let digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `358${digits.slice(1)}`;
  const text = `Hi! I saw you're looking for a partner for ${eventName} on Tower Swing.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function timeAgo(iso: string, now: Date = new Date()): string {
  const s = Math.max(0, (now.getTime() - Date.parse(iso)) / 1000);
  const fmt = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;
  if (s < 60) return "just now";
  if (s < 3600) return fmt(Math.floor(s / 60), "minute");
  if (s < 86400) return fmt(Math.floor(s / 3600), "hour");
  if (s < 86400 * 60) return fmt(Math.floor(s / 86400), "day");
  return fmt(Math.floor(s / (86400 * 30)), "month");
}
