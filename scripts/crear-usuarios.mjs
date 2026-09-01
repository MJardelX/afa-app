/**
 * Crea (o restablece) los usuarios de prueba locales.
 *
 * `supabase db reset` reaplica migraciones y seed, pero el seed NO crea
 * usuarios: las cuentas se crean por la Admin API, no por SQL. Sin este
 * script, después de cada reset el login falla con "credenciales inválidas"
 * y parece un bug de la app.
 *
 *   node scripts/crear-usuarios.mjs
 */

const API = process.env.SUPABASE_URL ?? "http://127.0.0.1:54421";
const SECRETO =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const CLAVE = process.env.CLAVE_PRUEBA ?? "Amistad2026";

const USUARIOS = [
  { email: "director@afa.gt", nombre_completo: "Director AFA", rol: "director" },
  { email: "coordinador@afa.gt", nombre_completo: "Coordinadora AFA", rol: "coordinador" },
  { email: "entrenador@afa.gt", nombre_completo: "Prof. Mendez", rol: "entrenador" },
];

const cabeceras = {
  apikey: SECRETO,
  Authorization: `Bearer ${SECRETO}`,
  "Content-Type": "application/json",
};

async function existentes() {
  const r = await fetch(`${API}/auth/v1/admin/users?per_page=200`, {
    headers: cabeceras,
  });
  if (!r.ok) throw new Error(`No se pudo listar usuarios: HTTP ${r.status}`);
  const { users } = await r.json();
  return new Map(users.map((u) => [u.email, u.id]));
}

async function crear(u) {
  const r = await fetch(`${API}/auth/v1/admin/users`, {
    method: "POST",
    headers: cabeceras,
    body: JSON.stringify({
      email: u.email,
      password: CLAVE,
      email_confirm: true,
      // El `rol` en el metadata es lo que hace que el perfil nazca ACTIVO:
      // así lo distingue el trigger fn_nuevo_usuario().
      user_metadata: { nombre_completo: u.nombre_completo, rol: u.rol },
    }),
  });
  if (!r.ok) throw new Error(`${u.email}: HTTP ${r.status} ${await r.text()}`);
}

async function restablecerClave(id, email) {
  const r = await fetch(`${API}/auth/v1/admin/users/${id}`, {
    method: "PUT",
    headers: cabeceras,
    body: JSON.stringify({ password: CLAVE, email_confirm: true }),
  });
  if (!r.ok) throw new Error(`${email}: HTTP ${r.status} ${await r.text()}`);
}

async function verificar(email) {
  const r = await fetch(`${API}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SECRETO, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: CLAVE }),
  });
  return r.ok;
}

try {
  const previos = await existentes();

  for (const u of USUARIOS) {
    const id = previos.get(u.email);
    if (id) {
      await restablecerClave(id, u.email);
      console.log(`  contraseña restablecida  ${u.email.padEnd(22)} ${u.rol}`);
    } else {
      await crear(u);
      console.log(`  creado                   ${u.email.padEnd(22)} ${u.rol}`);
    }
  }

  console.log("\nVerificando login real:");
  let todo = true;
  for (const u of USUARIOS) {
    const ok = await verificar(u.email);
    todo = todo && ok;
    console.log(`  ${ok ? "OK   " : "FALLA"} ${u.email}`);
  }

  console.log(`\nContraseña de todos: ${CLAVE}`);
  if (!todo) process.exitCode = 1;
} catch (e) {
  console.error("\nError:", e.message);
  console.error("¿Está el stack arriba? Probá: npm run db:start");
  process.exitCode = 1;
}
