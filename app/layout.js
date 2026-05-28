import "./globals.css";

export const metadata = {
  title: "Monev Zona Integritas - RSJ Mutiara Sukma",
  description: "Sistem Monitoring & Evaluasi Pembangunan Zona Integritas Menuju WBBM",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
