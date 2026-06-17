import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sixtencom | Ventas y facturación DIAN Colombia",
  description: "Sistema de ventas, POS e inventario con facturación electrónica DIAN para negocios en Colombia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CO">
      <body>{children}</body>
    </html>
  );
}
