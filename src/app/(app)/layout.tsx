import { redirect } from "next/navigation";

import { BarraLateral } from "@/components/app/barra-lateral";
import { Encabezado } from "@/components/app/encabezado";
import { NavInferior } from "@/components/app/nav-inferior";
import { crearClienteServidor } from "@/lib/supabase/server";

export default async function LayoutApp({ children }: LayoutProps<"/">) {
  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre_completo, rol, activo")
    .eq("id", user.id)
    .single();

  // Un usuario sin perfil, o con el perfil desactivado, no tiene academia:
  // RLS le devolvería todo vacío. Mejor decírselo que mostrarle ceros.
  if (!perfil || !perfil.activo) return <SinAcceso correo={user.email} />;

  const { data: temporada } = await supabase
    .from("temporadas")
    .select("nombre")
    .eq("activa", true)
    .maybeSingle();

  return (
    <div className="flex min-h-dvh">
      <BarraLateral temporada={temporada?.nombre} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Encabezado
          nombre={perfil.nombre_completo}
          rol={perfil.rol}
          temporada={temporada?.nombre}
        />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
          {children}
        </main>
      </div>

      <NavInferior />
    </div>
  );
}

function SinAcceso({ correo }: { correo?: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-sm rounded-xl border border-borde bg-superficie p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold">Cuenta sin activar</h1>
        <p className="mt-2 text-sm leading-relaxed text-tenue">
          {correo} todavía no tiene acceso a la academia. La dirección debe
          activar la cuenta y asignarle un rol.
        </p>
      </div>
    </main>
  );
}
