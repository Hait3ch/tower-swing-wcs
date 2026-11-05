import "./styles/globals.css";
import { Nunito } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import Footer from "../components/Footer";
import DevelopmentBanner from "../components/DevelopmentBanner";

export const metadata = {
  title: "Tower Swing",
  description: "Tower Swing Dance Event Website",
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icon-192.png',
  },
};

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "700"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={nunito.className}>
        <DevelopmentBanner />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
