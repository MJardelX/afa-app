import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AFA Manager",
  description: "Sistema de gestión de la Academia de Fútbol Amistad",
};

// Se ejecuta antes de pintar: sin esto, quien eligió tema oscuro ve un
// destello blanco en cada carga. Debe quedarse inline y ser síncrono.
const scriptTema = `try{var t=localStorage.getItem("afa-tema");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body className="flex min-h-full flex-col bg-fondo text-texto">
        {children}
      </body>
    </html>
  );
}
