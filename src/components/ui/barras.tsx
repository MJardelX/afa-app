/**
 * Lista de barras horizontales para "cantidad por categoría".
 *
 * Una sola serie = un solo color. Pintar cada categoría de un color distinto
 * sugiere que el color significa algo, y aquí no significa nada: la longitud
 * ya lleva toda la información.
 *
 * Cada barra lleva su valor escrito al lado, así que el dato se lee sin
 * depender del color ni de pasar el mouse.
 */
export function ListaBarras({
  datos,
  vacio = "Sin datos todavía.",
}: {
  datos: { etiqueta: string; valor: number; nota?: string }[];
  vacio?: string;
}) {
  if (datos.length === 0) {
    return <p className="py-6 text-center text-sm text-tenue">{vacio}</p>;
  }

  const maximo = Math.max(...datos.map((d) => d.valor), 1);

  return (
    <ul className="space-y-2.5">
      {datos.map((d) => (
        <li key={d.etiqueta} className="grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-3">
          <span className="truncate text-xs font-medium text-tenue">
            {d.etiqueta}
          </span>

          <span
            className="h-2.5 w-full overflow-hidden rounded-full bg-grafico-pista"
            title={`${d.etiqueta}: ${d.valor}${d.nota ? ` · ${d.nota}` : ""}`}
          >
            <span
              className="block h-full rounded-full bg-grafico-barra"
              style={{ width: `${Math.max((d.valor / maximo) * 100, 3)}%` }}
            />
          </span>

          <span className="text-right text-sm font-medium tabular-nums">
            {d.valor}
          </span>
        </li>
      ))}
    </ul>
  );
}
