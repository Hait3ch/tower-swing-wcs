import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "700"] });

/** Text logo: spaced TOWER / SWING under a tilted "roofline" (the REDI canopy). White, for dark backgrounds. */
export default function Wordmark({ large = false }: { large?: boolean }) {
  return (
    <span className={`${montserrat.className} inline-block text-center leading-none text-white`} aria-label="Tower Swing">
      <span className={`block mx-auto mb-1.5 h-[3px] -rotate-[4deg] rounded bg-pink-300 ${large ? "w-24" : "w-16"}`} />
      <span className={`block font-bold tracking-[0.32em] pl-[0.32em] ${large ? "text-2xl" : "text-lg"}`}>TOWER</span>
      <span className={`block font-light tracking-[0.7em] pl-[0.7em] mt-1 ${large ? "text-sm" : "text-[11px]"}`}>SWING</span>
    </span>
  );
}
