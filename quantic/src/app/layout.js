import "./globals.css";

export const metadata = {
  title: "bored. | Paris Anti-Ennui • Spots, Activités & Carte Interactive",
  description: "Ne reste pas à t'ennuyer. Découvre les meilleurs spots parisiens, parcs, fontaines et activités insolites épinglés sur notre carte interactive Leaflet style bored.com."
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
