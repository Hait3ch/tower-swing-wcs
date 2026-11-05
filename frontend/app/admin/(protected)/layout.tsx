import { requireAdmin } from "../actions";

/** Every page in this group is admin-only; checked on the server before rendering. */
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
