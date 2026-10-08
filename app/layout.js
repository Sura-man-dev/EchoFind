import "./globals.css";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import MarketingChrome from "./Components/MarketingChrome";
import { auth } from "@/auth";

export const metadata = {
  title: "EchoFind",
  description: "Find lost items and help return found belongings with EchoFind.",
};

export default async function RootLayout({ children }) {
  const session = await auth().catch(() => null);
  const showMarketingChrome = !session?.user;

  return (
    <html lang="en">
      <body>
        {showMarketingChrome ? (
          <MarketingChrome>
            <Navbar />
          </MarketingChrome>
        ) : null}
        {children}
        {showMarketingChrome ? (
          <MarketingChrome>
            <Footer />
          </MarketingChrome>
        ) : null}
      </body>
    </html>
  );
}
