"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { crearClienteServidor } from "@/lib/supabase/server";

export async function iniciarSesion(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresá tu correo y tu contraseña." };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Al usuario se le da un mensaje genérico a propósito: distinguir
    // "correo inexistente" de "contraseña incorrecta" permitiría averiguar
    // qué correos están registrados.
    //
    // Pero el error real se registra en el servidor. Sin esto, un fallo de
    // configuración (URL mala, stack caído, llave vencida) se ve idéntico a
    // una contraseña equivocada, y se diagnostica a ciegas.
    console.error("[login] fallo de autenticación:", {
      código: error.code,
      estado: error.status,
      mensaje: error.message,
    });

    const esCredencial =
      error.code === "invalid_credentials" ||
      error.code === "email_not_confirmed";

    return {
      error: esCredencial
        ? "Correo o contraseña incorrectos."
        : "No se pudo conectar con el servidor. Avisá a la dirección.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
