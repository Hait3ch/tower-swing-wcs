"use client";

import Image from "next/image";
import Link from "next/link";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["700"] });

export default function VenuePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl sm:text-5xl font-bold text-blue-900 mb-4 ${dancingScript.className}`}>
            Venue
          </h1>
          <p className="text-xl text-gray-600">
            Join us at the heart of Helsinki for an unforgettable Tower Swing experience
          </p>
        </div>

        {/* Main content */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text content */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-blue-900 mb-4">How to Get There</h2>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    Our venue is conveniently located in the vibrant Kalasatama district, easily accessible by public transportation.
                  </p>
                  
                  <div className="bg-blue-50 rounded-lg p-6 space-y-4 border border-blue-100">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">1</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900">Take the Metro</h3>
                        <p>Board the metro and get off at <strong>Kalasatama station</strong></p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">2</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900">Find the Entrance</h3>
                        <p>Walk to the area between <strong>REDI shopping centre</strong> and <strong>K-Market</strong>. Look for the entrance next to the K-Market.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">3</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900">Enter the Building</h3>
                        <p>We&apos;ll provide you with an access code to enter the building. Use the elevator to go to <strong>floor 33</strong>.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">4</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900">Find the Party</h3>
                        <p>Turn left from the elevators and you&apos;ll find the Tower Swing party waiting for you!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <h3 className="text-xl font-semibold text-blue-900 mb-3">Important Notes</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>You can arrive at any time during the event (16:00 - 23:45)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Access code will be sent to registered participants</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Dress code: Comfortable dancing attire</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  href="/register"
                  className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Register Now
                </Link>
              </div>
            </div>

            {/* Image */}
            <div className="lg:w-1/2 w-full">
              <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/assets/optimized/4.jpg"
                  alt="Tower Swing Venue"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white/90 text-blue-900 px-4 py-2 rounded-full shadow-lg">
                <p className="font-semibold">Floor 33</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-full border-2 border-blue-600 text-blue-600 font-bold text-lg hover:bg-blue-600 hover:text-white transition duration-200"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
} 