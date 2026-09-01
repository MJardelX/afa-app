import { ListaBarras } from "@/components/ui/barras";
import {
  EstadoAsistencia,
  nivelDeAsistencia,
} from "@/components/ui/estado-asistencia";
import { Indicador, Tarjeta, TituloTarjeta } from "@/components/ui/tarjeta";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Panel · AFA Manager" };

export default async function Panel() {
  const supabase = await crearClienteServidor();

  // Las tres consultas pasan por RLS: lo que devuelvan depende del rol.
  const [{ data: jugadores }, { data: ranking }, { count: equipos }] =
    await Promise.all([
      supabase
        .from("v_jugadores")
        .select(
          "id, codigo, nombre_completo, categoria, categoria_por_edad, edad_deportiva, fuera_de_categoria, sin_inscribir, estado",
        )
        .eq("estado", "activo"),
      supabase
        .from("v_ranking_equipo")
        .select("jugador_id, nombre_completo, categoria, porcentaje, sesiones_convocadas"),
      supabase.from("equipos").select("*", { count: "exact", head: true }),
    ]);

  const lista = jugadores ?? [];
  const filas = ranking ?? [];

  const porCategoria = agrupar(lista);
  const promedio = promedioAsistencia(filas);
  const alertas = construirAlertas(lista, filas);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Panel</h1>
        <p className="mt-0.5 text-sm text-tenue">
          Resumen de la academia al día de hoy.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador
          titulo="Jugadores activos"
          valor={lista.length}
          detalle={plural(porCategoria.length, "categoría", "categorías")}
        />
        <Indicador titulo="Equipos" valor={equipos ?? 0} />
        <Indicador
          titulo="Asistencia promedio"
          valor={promedio === null ? "—" : `${promedio}%`}
          detalle={
            promedio === null ? "Sin sesiones registradas" : "Sobre lo convocado"
          }
          acento
        />
        <Indicador
          titulo="Alertas"
          valor={alertas.length}
          detalle={alertas.length === 0 ? "Todo en orden" : "Requieren atención"}
        />
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Tarjeta>
          <TituloTarjeta extra={plural(lista.length, "jugador", "jugadores")}>
            Jugadores por categoría
          </TituloTarjeta>
          <ListaBarras
            datos={porCategoria}
            vacio="Todavía no hay jugadores inscritos."
          />
        </Tarjeta>

        <Tarjeta>
          <TituloTarjeta
            extra={filas.length > 0 ? "De menor a mayor" : undefined}
          >
            Asistencia por jugador
          </TituloTarjeta>
          {filas.length === 0 ? (
            <p className="py-6 text-center text-sm text-tenue">
              Aún no se ha pasado asistencia en ninguna sesión.
            </p>
          ) : (
            <ul className="divide-y divide-borde">
              {[...filas]
                .sort((a, b) => (a.porcentaje ?? 0) - (b.porcentaje ?? 0))
                .slice(0, 6)
                .map((f) => (
                  <li
                    key={f.jugador_id}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{f.nombre_completo}</p>
                      <p className="text-xs text-tenue">
                        {f.categoria} · {f.sesiones_convocadas} convocadas
                      </p>
                    </div>
                    <EstadoAsistencia
                      nivel={nivelDeAsistencia(f.porcentaje ?? 0)}
                      porcentaje={Math.round(f.porcentaje ?? 0)}
                    />
                  </li>
                ))}
            </ul>
          )}
        </Tarjeta>
      </div>

      <Tarjeta>
        <TituloTarjeta extra={alertas.length > 0 ? `${alertas.length}` : undefined}>
          Alertas
        </TituloTarjeta>
        {alertas.length === 0 ? (
          <p className="py-6 text-center text-sm text-tenue">
            Nada pendiente. Todos los jugadores activos están inscritos y en su
            categoría.
          </p>
        ) : (
          <ul className="divide-y divide-borde">
            {alertas.map((a) => (
              <li
                key={a.clave}
                className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-alerta-fondo">
                  <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    className="size-3 fill-none stroke-alerta stroke-[2]"
                    strokeLinecap="round"
                  >
                    <path d="M10 5.5v5M10 13.6v.1" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-sm">{a.titulo}</p>
                  <p className="text-xs text-tenue">{a.detalle}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Cálculos. Se hacen aquí y no en la base: son agregaciones sobre pocos
   cientos de filas que ya vinieron filtradas por RLS.
   --------------------------------------------------------------------------- */

function plural(n: number, singular: string, plural: string) {
  return `${n} ${n === 1 ? singular : plural}`;
}

type Jugador = {
  id: string | null;
  codigo: string | null;
  nombre_completo: string | null;
  categoria: string | null;
  categoria_por_edad: string | null;
  fuera_de_categoria: boolean | null;
  sin_inscribir: boolean | null;
};

type Fila = {
  jugador_id: string | null;
  nombre_completo: string | null;
  porcentaje: number | null;
};

function agrupar(jugadores: Jugador[]) {
  const cuenta = new Map<string, number>();
  for (const j of jugadores) {
    const clave = j.categoria ?? j.categoria_por_edad ?? "Sin categoría";
    cuenta.set(clave, (cuenta.get(clave) ?? 0) + 1);
  }
  return [...cuenta.entries()]
    .map(([etiqueta, valor]) => ({ etiqueta, valor }))
    .sort((a, b) => b.valor - a.valor);
}

function promedioAsistencia(filas: Fila[]) {
  const validos = filas
    .map((f) => f.porcentaje)
    .filter((p): p is number => p !== null);
  if (validos.length === 0) return null;
  return Math.round(validos.reduce((a, b) => a + b, 0) / validos.length);
}

function construirAlertas(jugadores: Jugador[], filas: Fila[]) {
  const alertas: { clave: string; titulo: string; detalle: string }[] = [];

  for (const j of jugadores) {
    if (j.sin_inscribir) {
      alertas.push({
        clave: `sin-${j.id}`,
        titulo: `${j.nombre_completo} no está inscrito en la temporada`,
        detalle: `${j.codigo} · le corresponde ${j.categoria_por_edad ?? "sin categoría"}`,
      });
    } else if (j.fuera_de_categoria) {
      alertas.push({
        clave: `fuera-${j.id}`,
        titulo: `${j.nombre_completo} juega fuera de su categoría`,
        detalle: `Inscrito en ${j.categoria}, le corresponde ${j.categoria_por_edad}`,
      });
    }
  }

  for (const f of filas) {
    if (f.porcentaje !== null && f.porcentaje < 70) {
      alertas.push({
        clave: `asist-${f.jugador_id}`,
        titulo: `${f.nombre_completo} tiene asistencia baja`,
        detalle: `${Math.round(f.porcentaje)}% de las sesiones convocadas`,
      });
    }
  }

  return alertas;
}
