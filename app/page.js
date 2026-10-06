import Hero from "./Components/HeroSection";
import HomePage from "./Components/Home";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  let session = null;

  try {
    session = await auth();
  } catch (error) {
    console.error("Failed to load current session on home page", error);
  }

  return session?.user ? <HomePage /> : <Hero />;
}
