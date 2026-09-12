/**
 * Creates (or resets) the local test users.
 *
 * `supabase db reset` re-applies migrations and the seed, but the seed does
 * NOT create users: accounts are created through the Admin API, not through
 * SQL. Without this script, after every reset the login fails with "invalid
 * credentials" and it looks like an app bug.
 *
 * Reads everything from the environment — nothing sensitive is hard-coded.
 * For local dev the values come from `.env.local` (see `.env.example`); the
 * service-role key and API URL are printed by `npx supabase status`.
 *
 *   node --env-file=.env.local scripts/create-users.mjs
 */

const API =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "http://127.0.0.1:54421";
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.TEST_PASSWORD;

if (!SECRET || !PASSWORD) {
  console.error(
    "Missing env vars. Set SUPABASE_SERVICE_ROLE_KEY and TEST_PASSWORD\n" +
      "(and optionally SUPABASE_URL). For local dev: `npx supabase status`.",
  );
  process.exit(1);
}

const USERS = [
  { email: "director@afa.gt", nombre_completo: "Director AFA", rol: "director" },
  {
    email: "coordinador@afa.gt",
    nombre_completo: "Coordinadora AFA",
    rol: "coordinador",
  },
  { email: "entrenador@afa.gt", nombre_completo: "Prof. Mendez", rol: "entrenador" },
];

const headers = {
  apikey: SECRET,
  Authorization: `Bearer ${SECRET}`,
  "Content-Type": "application/json",
};

async function existing() {
  const r = await fetch(`${API}/auth/v1/admin/users?per_page=200`, { headers });
  if (!r.ok) throw new Error(`Could not list users: HTTP ${r.status}`);
  const { users } = await r.json();
  return new Map(users.map((u) => [u.email, u.id]));
}

async function create(u) {
  const r = await fetch(`${API}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
      // The `rol` in the metadata is what makes the profile start ACTIVE:
      // that is how the fn_nuevo_usuario() trigger tells it apart.
      user_metadata: { nombre_completo: u.nombre_completo, rol: u.rol },
    }),
  });
  if (!r.ok) throw new Error(`${u.email}: HTTP ${r.status} ${await r.text()}`);
}

async function resetPassword(id, email) {
  const r = await fetch(`${API}/auth/v1/admin/users/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ password: PASSWORD, email_confirm: true }),
  });
  if (!r.ok) throw new Error(`${email}: HTTP ${r.status} ${await r.text()}`);
}

async function verify(email) {
  const r = await fetch(`${API}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SECRET, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  return r.ok;
}

try {
  const previous = await existing();

  for (const u of USERS) {
    const id = previous.get(u.email);
    if (id) {
      await resetPassword(id, u.email);
      console.log(`  password reset          ${u.email.padEnd(22)} ${u.rol}`);
    } else {
      await create(u);
      console.log(`  created                 ${u.email.padEnd(22)} ${u.rol}`);
    }
  }

  console.log("\nVerifying real login:");
  let allOk = true;
  for (const u of USERS) {
    const ok = await verify(u.email);
    allOk = allOk && ok;
    console.log(`  ${ok ? "OK   " : "FAIL "} ${u.email}`);
  }

  console.log(`\nPassword for everyone: ${PASSWORD}`);
  if (!allOk) process.exitCode = 1;
} catch (e) {
  console.error("\nError:", e.message);
  console.error("Is the stack up? Try: npm run db:start");
  process.exitCode = 1;
}
