"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, ReactNode } from "react";

type CarouselProps = {
  images: string[];
  navLinks: { name: string; href: string }[];
  children?: ReactNode;
};

export default function Carousel({ images, navLinks, children }: CarouselProps) {
  const [current, setCurrent] = useState(0);
  const length = images.length;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Helper to clear and restart interval
  const restartInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % length);
    }, 5000);
  };

  useEffect(() => {
    restartInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length]);

  return (
    <div className="relative w-screen h-screen min-h-[100dvh] overflow-hidden">
      {/* Logo and nav at the top */}
      <div className="absolute top-0 left-0 z-50 p-4 flex flex-row items-center w-full">
        <Image
          src="/assets/optimized/logo.png"
          alt="Tower Swing Logo"
          width={80}
          height={80}
          className="h-16 w-auto object-contain"
          priority
        />
        {/* Desktop Navigation links */}
        <nav className="ml-auto hidden sm:flex flex-row gap-6 items-center w-full sm:w-auto">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white text-white text-base font-bold transition-all duration-200 hover:bg-white hover:text-blue-900 hover:shadow-lg"
            >
              {link.name}
            </Link>
          ))}
        </nav>
        {/* Hamburger for mobile */}
        <button
          className="sm:hidden ml-auto p-2 rounded-full border border-white text-white z-50"
          aria-label="Open menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-start pt-32 gap-6 sm:hidden"
          onClick={() => setMenuOpen(false)}
        >
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="px-8 py-4 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white text-white text-xl font-bold transition-all duration-200 hover:bg-white hover:text-blue-900 hover:shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
              }}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
      {/* Carousel fills the whole viewport */}
      {images.map((src, idx) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-700 ${
            idx === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <Image
            src={src}
            alt={`Carousel ${idx + 1}`}
            fill
            className="object-cover w-full h-full"
            sizes="100vw"
            priority={idx === 0}
          />
          {/* Overlay gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        </div>
      ))}
      {/* Centered overlay content (children) */}
      {children && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-4">
          {children}
        </div>
      )}
      {/* Subtle fade-out gradient at the bottom */}
      <div className="absolute bottom-0 left-0 w-full h-16 z-40 pointer-events-none bg-gradient-to-t from-white/90 via-white/60 to-transparent" />
    </div>
  );
}
