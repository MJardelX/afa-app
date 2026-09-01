import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/ui/logo";
import { TemaToggle } from "@/components/ui/tema-toggle";

export const metadata = { title: "Ingresar · AFA Manager" };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <PanelMarca />

      <section className="relative flex items-center justify-center overflow-hidden px-5 py-12 sm:px-10">
        <Halos />

        <TemaToggle className="absolute right-5 top-5 sm:right-8 sm:top-8" />

        <div className="relative w-full max-w-[23rem]">
          {/* En móvil el panel de marca no se muestra: el logo va aquí. */}
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <Logo className="size-14" />
            <h1 className="mt-3 text-lg font-semibold tracking-tight">
              AFA Manager
            </h1>
            <p className="text-sm text-tenue">Academia de Fútbol Amistad</p>
          </div>

          <div className="vidrio overflow-hidden rounded-2xl p-6 sm:p-7">
            <div className="mb-6 hidden lg:block">
              <h2 className="text-2xl font-semibold tracking-tight">
                Bienvenido de nuevo
              </h2>
              <p className="mt-1.5 text-sm text-tenue">
                Ingresá para administrar la academia.
              </p>
            </div>

            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-tenue">
            Las cuentas las crea la dirección de la academia.
            <br />
            ¿Problemas para ingresar? Consultá con el director.
          </p>
        </div>
      </section>
    </div>
  );
}

/**
 * Manchas de color muy difusas detrás de la tarjeta. No son decoración
 * gratuita: son lo que el desenfoque tiene para refractar. Sin ellas el
 * vidrio no se percibe.
 */
function Halos() {
  return (
    <div aria-hidden className="halos absolute inset-0">
      <div className="halo halo-a -right-20 top-[-10%] size-[26rem]" />
      <div className="halo halo-b -left-24 bottom-[-8%] size-[22rem]" />
      <div className="halo halo-c bottom-[18%] right-[-15%] size-[20rem]" />
    </div>
  );
}

function PanelMarca() {
  return (
    <aside className="relative hidden overflow-hidden bg-celeste-700 lg:flex lg:flex-col lg:justify-between lg:p-12">
      {/* Sin celeste-900 ni 950: por debajo de 800 el azul deja de leerse
          celeste y se vuelve marino, que no es el color de la academia.
          El texto se apoya siempre sobre celeste-700 → 6.1:1 con blanco. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-celeste-500 via-celeste-600 to-celeste-800"
      />
      <div
        aria-hidden
        className="absolute -left-32 -top-40 size-[34rem] rounded-full bg-celeste-300/25 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-56 -right-32 size-[30rem] rounded-full bg-celeste-800/50 blur-3xl"
      />

      {/* Círculo central de cancha, sangrando fuera del borde a propósito:
          así se lee como decisión de diseño y no como recorte accidental. */}
      <svg
        aria-hidden
        viewBox="0 0 500 500"
        className="absolute -bottom-40 -right-40 size-[38rem] text-white/15"
        fill="none"
        stroke="currentColor"
      >
        <circle cx="250" cy="250" r="200" strokeWidth="1.5" />
        <circle cx="250" cy="250" r="140" strokeWidth="1.5" />
        <circle cx="250" cy="250" r="6" fill="currentColor" stroke="none" />
      </svg>

      <div className="relative flex items-center gap-3">
        <Logo className="size-11" />
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
          Amistad
        </span>
      </div>

      <div className="relative">
        <span className="block h-1 w-14 rounded-full bg-amarillo-400" />
        <h1 className="mt-7 text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-white">
          AFA Manager
        </h1>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-white">
          Sistema de gestión de la Academia de Fútbol Amistad. Jugadores,
          asistencia y evaluación en un solo lugar.
        </p>

        <ul className="mt-10 space-y-4">
          {[
            "Ficha completa de cada jugador",
            "Asistencia y ranking automáticos",
            "Evaluación por período con rúbrica",
          ].map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 text-[0.95rem] text-white"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amarillo-400">
                <svg viewBox="0 0 20 20" className="size-3.5 fill-celeste-900">
                  <path d="M7.6 14.2 3.8 10.4l1.4-1.4 2.4 2.4 6.2-6.2 1.4 1.4-7.6 7.6Z" />
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-celeste-100">
        © {new Date().getFullYear()} Academia de Fútbol Amistad
      </p>
    </aside>
  );
}
