"use client";

import Link from "next/link";
import Carousel from "../components/Carousel";
import Countdown from "../components/Countdown";
import TowerSwingSection from "../components/TowerSwingSection";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["700"] });

const carouselImages = [
  "/assets/optimized/carousel1.jpg",
  "/assets/optimized/carousel2.jpg",
  "/assets/optimized/carousel3.jpg",
  "/assets/optimized/carousel4.jpg",
];

const navLinks = [
  { name: "Venue", href: "/venue" },
  { name: "Register", href: "/register" },
  { name: "Contact", href: "/contact" },
];

export default function LandingPage() {
  return (
    <>
      <Carousel images={carouselImages} navLinks={navLinks}>
        <h1
          className={`text-5xl sm:text-6xl md:text-7xl font-bold text-white drop-shadow-lg mb-4 ${dancingScript.className}`}
        >
          Tower Swing
        </h1>
        <p className="text-xl sm:text-2xl md:text-3xl text-white mb-4 drop-shadow">
          28.6.2025 Helsinki, Finland
        </p>
        <Countdown targetDate="2025-06-28T16:00:00+03:00" />
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Link
            href="/register"
            className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Reserve Your Spot
          </Link>
        </div>
      </Carousel>

      <TowerSwingSection />
    </>
  );
}
