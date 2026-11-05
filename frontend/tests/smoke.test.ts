import { describe, it, expect, afterEach } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin";

describe("createAdminClient", () => {
  const saved = process.env.SUPABASE_SERVICE_ROLE_KEY;
  afterEach(() => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = saved;
  });

  it("throws when the service role key is missing", () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    expect(() => createAdminClient()).toThrow("SUPABASE_SERVICE_ROLE_KEY missing");
  });
});
