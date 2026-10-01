import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { PrototypeSwitcher } from "@/components/PrototypeSwitcher";
import "./globals.css";
import "./prototype.css";

export const metadata: Metadata = {
  title: "DIIP Asistencia",
  description: "Validación y seguimiento de asistencia para proyectos ferroviarios.",
  applicationName: "DIIP Asistencia",
  icons: { apple: "/icon-192.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "DIIP Asistencia" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#123b5d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="prototype-mode">
        {children}
        <PrototypeSwitcher />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
