"use client";

import Link from "next/link";
import Carousel from "../components/Carousel";
import Countdown from "../components/Countdown";
import TowerSwingSection from "../components/TowerSwingSection";
import ScrollGradient from "../components/ScrollGradient";


const carouselImages = [
  "/assets/optimized/carousel1.jpg",
  "/assets/optimized/carousel2.jpg",
  "/assets/optimized/carousel3.jpg",
  "/assets/optimized/carousel4.jpg",
];

const navLinks = [
  { name: "Find a partner", href: "/partners" },
  { name: "Venue", href: "/venue" },
  { name: "Register", href: "/register" },
  { name: "Contact", href: "/contact" },
];

export default function LandingPage() {
  return (
    <>
      <Carousel images={carouselImages} navLinks={navLinks}>
        <p className="text-xl sm:text-2xl md:text-3xl text-white mb-4 drop-shadow">
          3.7.2027 Helsinki, Finland
        </p>
        <Countdown targetDate="2027-07-03T16:00:00+03:00" />
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Link
            href="/register"
            className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Reserve Your Spot
          </Link>
        </div>
      </Carousel>

      <ScrollGradient>
        <TowerSwingSection />
      </ScrollGradient>
    </>
  );
}
