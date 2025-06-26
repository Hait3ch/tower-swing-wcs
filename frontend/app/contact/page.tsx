"use client";

import Link from "next/link";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["700"] });

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className={`text-4xl sm:text-5xl font-bold text-blue-900 mb-8 ${dancingScript.className}`}>
          Contact Us
        </h1>
        <p className="mb-8 text-xl text-gray-600 leading-relaxed">
          Have questions about Tower Swing? We&apos;d love to hear from you!
        </p>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">Get in Touch</h2>
            <p className="mb-6 text-gray-700">
              Connect with us on social media or reach out directly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:towerswingwcs@gmail.com"
                className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Email Us
              </a>
              <a
                href="https://www.instagram.com/haiphan_wcs/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 rounded-full border-2 border-blue-600 text-blue-600 font-bold text-lg hover:bg-blue-600 hover:text-white transition duration-200"
              >
                Instagram
              </a>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200">
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">Project Information</h2>
            <p className="mb-6 text-gray-700">
              This website is open source and available on GitHub.
            </p>
            <a
              href="https://github.com/Hait3ch/tower-swing-wcs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 rounded-full bg-gray-800 text-white font-bold text-lg hover:bg-gray-700 transition duration-200"
            >
              View on GitHub
            </a>
          </div>

          <div className="pt-8 border-t border-gray-200">
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">Hire Me</h2>
            <p className="mb-6 text-gray-700">
              If you like my work and are interested in collaborating on a project, 
              feel free to reach out through LinkedIn.
            </p>
            <a
              href="https://www.linkedin.com/in/haiphanfin/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 rounded-full bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition duration-200"
            >
              Connect on LinkedIn
            </a>
          </div>

          <div className="pt-8 border-t border-gray-200">
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-full border-2 border-blue-600 text-blue-600 font-bold text-lg hover:bg-blue-600 hover:text-white transition duration-200"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
} 