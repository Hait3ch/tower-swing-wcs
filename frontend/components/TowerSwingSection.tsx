"use client";

import Image from "next/image";
import Link from "next/link";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["700"] });

export default function TowerSwingSection() {
  return (
    <section className="w-full bg-gradient-to-br from-white via-blue-50 to-purple-50 py-16 md:py-24 px-4 sm:px-8 md:px-16 lg:px-32">
      {/* Section Header */}
      <div className="text-center mb-16">
        <h2 className={`text-4xl md:text-5xl font-bold text-blue-900 mb-4 ${dancingScript.className}`}>
          Tower Swing Experience
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-16">
        {/* First Row - Main Introduction */}
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="lg:w-1/2 space-y-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-blue-900">The Highest WCS Event</h3>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">
              Welcome to the highest West Coast Swing event in Helsinki, and we dare to say the highest in Europe! 
              Equipped with a hot tub and a magnificent terrace, this venue offers an unparalleled dancing experience 
              with music playing both inside and outside.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Hot Tub</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">Terrace</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Indoor/Outdoor Music</span>
            </div>
          </div>
          <div className="lg:w-1/2 w-full">
            <div className="relative h-80 lg:h-96 rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <Image 
                src="/assets/optimized/1.jpg" 
                alt="Tower Swing Venue" 
                fill 
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Second Row - Venue Details */}
        <div className="flex flex-col lg:flex-row-reverse gap-12 items-center">
          <div className="lg:w-1/2 space-y-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-blue-900">REDI Shopping Centre</h3>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">
              An exceptional venue: REDI is a premier shopping centre in Kalasatama, Helsinki, Finland. 
              As the eighth largest shopping centre in Finland, it offers a unique urban setting for our 
              elevated dance experience.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
              <p className="text-blue-800 font-medium">📍 Located in the heart of Kalasatama district</p>
            </div>
          </div>
          <div className="lg:w-1/2 w-full">
            <div className="relative h-80 lg:h-96 rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <Image 
                src="/assets/optimized/2.jpg" 
                alt="REDI Shopping Centre" 
                fill 
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Third Row - Flexible Schedule */}
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="lg:w-1/2 space-y-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-blue-900">Flexible Schedule</h3>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">
              Join us from 16:00 until 23:45 with complete flexibility. Whether you&apos;re an early bird wanting 
              to dance and leave early, or a night owl ready to party until the end - the choice is yours! 
              Or why not stay for the entire experience and maximize your time in the heights?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">16:00</div>
                <div className="text-sm text-green-700">Early Start</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">23:45</div>
                <div className="text-sm text-purple-700">Late Finish</div>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 w-full">
            <div className="relative h-80 lg:h-96 rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <Image 
                src="/assets/optimized/3.jpg" 
                alt="Dancing at Tower Swing" 
                fill 
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Fourth Row - Social Experience */}
        <div className="flex flex-col lg:flex-row-reverse gap-12 items-center">
          <div className="lg:w-1/2 space-y-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-blue-900">Connect & Dance</h3>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">
              Meet new people or enjoy the company of old friends - the choice is yours! 
              We keep the party atmosphere alive throughout the entire event, creating 
              the perfect environment for both socializing and dancing.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">New Friends</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Old Buddies</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600">Non-stop Party</span>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 w-full">
            <div className="relative h-80 lg:h-96 rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <Image 
                src="/assets/optimized/5.jpg" 
                alt="Social dancing at Tower Swing" 
                fill 
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Final Call to Action */}
        <div className="text-center py-12">
          <div className="max-w-3xl mx-auto">
            <h3 className={`text-3xl font-bold text-blue-900 mb-6 ${dancingScript.className}`}>
              Pure Dancing Joy
            </h3>
            <p className="text-gray-700 text-xl leading-relaxed mb-8">
              Tower Swing is created purely for the pleasure of dancing and sharing unforgettable moments 
              with fellow West Coast Swing enthusiasts in the most spectacular setting Helsinki has to offer.
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Join the Experience
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
} 