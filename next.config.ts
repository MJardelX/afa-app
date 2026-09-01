import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El servidor de desarrollo rechaza con 403 los recursos internos (HMR)
  // cuando se navega desde un origen distinto al que espera. Abrir la app en
  // 127.0.0.1 en vez de localhost rompía la recarga en caliente.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
