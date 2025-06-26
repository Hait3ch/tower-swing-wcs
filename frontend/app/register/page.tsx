"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["700"] });

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  experience: "beginner" | "intermediate" | "advanced";
  agreeToTerms: boolean;
}

interface EventData {
  _id: string;
  year: number;
  name: string;
  date: string;
  maxCapacity: number;
  price: number;
  venue: string;
  address: string;
  description?: string;
  registrationOpen: boolean;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    experience: "beginner",
    agreeToTerms: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    isWaitingList?: boolean;
  }>({ type: null, message: '' });
  
  const [showEmailButton, setShowEmailButton] = useState(false);
  const [activeEvent, setActiveEvent] = useState<EventData | null>(null);
  const [eventLoading, setEventLoading] = useState(true);

  // Fetch active event
  useEffect(() => {
    const fetchActiveEvent = async () => {
      try {
        const apiUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:5001/api/events/active'
          : `${process.env.NEXT_PUBLIC_API_URL}/api/events/active`;

        const response = await fetch(apiUrl);
        if (response.ok) {
          const event = await response.json();
          setActiveEvent(event);
        } else {
          console.error('Failed to fetch active event');
        }
      } catch (error) {
        console.error('Error fetching active event:', error);
      } finally {
        setEventLoading(false);
      }
    };

    fetchActiveEvent();
  }, []);

  const handleEmailSupport = () => {
    const subject = encodeURIComponent('Tower Swing Registration - Email Not Received');
    const body = encodeURIComponent(`Hi,\n\nI registered for Tower Swing but haven't received my confirmation email yet.\n\nMy details:\n- Name: ${formData.firstName} ${formData.lastName}\n- Email: ${formData.email}\n- Phone: ${formData.phone}\n- Experience: ${formData.experience}\n\nRegistration time: ${new Date().toLocaleString()}\n\nPlease help!\n\nBest regards,\n${formData.firstName} ${formData.lastName}`);
    
    window.open(`mailto:towerswingwcs@gmail.com?subject=${subject}&body=${body}`, '_blank');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setSubmitStatus({ type: 'error', message: 'First name is required' });
      return false;
    }
    if (!formData.lastName.trim()) {
      setSubmitStatus({ type: 'error', message: 'Last name is required' });
      return false;
    }
    if (!formData.email.trim()) {
      setSubmitStatus({ type: 'error', message: 'Email is required' });
      return false;
    }
    if (!formData.phone.trim()) {
      setSubmitStatus({ type: 'error', message: 'Phone number is required' });
      return false;
    }
    if (!formData.agreeToTerms) {
      setSubmitStatus({ type: 'error', message: 'You must agree to the terms and conditions' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      // In development, use localhost:5001, in production use your Render URL
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5001/api/registrations'
        : `${process.env.NEXT_PUBLIC_API_URL}/api/registrations`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          experience: formData.experience,
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        setSubmitStatus({ 
          type: 'success', 
          message: responseData.message,
          isWaitingList: responseData.isWaitingList
        });
        
        // Show email button after 1 minute
        setTimeout(() => {
          setShowEmailButton(true);
        }, 60000); // 1 minute = 60,000 milliseconds
        
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          experience: "beginner",
          agreeToTerms: false,
        });
      } else {
        const errorData = await response.json();
        setSubmitStatus({ 
          type: 'error', 
          message: errorData.message || 'Registration failed. Please try again.' 
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitStatus({ 
        type: 'error', 
        message: 'Network error. Please check your connection and try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl sm:text-5xl font-bold text-blue-900 mb-4 ${dancingScript.className}`}>
            Reserve Your Spot
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join us for an unforgettable West Coast Swing experience at the highest dance event in Helsinki
          </p>
        </div>

        {/* Event Loading/Error States */}
        {eventLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading event information...</p>
          </div>
        )}

        {!eventLoading && !activeEvent && (
          <div className="text-center py-12">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-md mx-auto">
              <p className="font-semibold">Registration Currently Closed</p>
              <p className="text-sm mt-2">No active event is currently available for registration.</p>
            </div>
          </div>
        )}

        {!eventLoading && activeEvent && !activeEvent.registrationOpen && (
          <div className="text-center py-12">
            <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded-lg max-w-md mx-auto">
              <p className="font-semibold">Registration Temporarily Closed</p>
              <p className="text-sm mt-2">Registration for this event is currently closed.</p>
            </div>
          </div>
        )}

        {!eventLoading && activeEvent && activeEvent.registrationOpen && (
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Registration Form */}
              <div className="lg:col-span-2">
                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                  <h2 className="text-2xl font-bold text-blue-900 mb-6">Registration Form</h2>
                  
                  {/* Event Info Banner */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-2">{activeEvent.name}</h3>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Date:</strong> {new Date(activeEvent.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                      <p><strong>Venue:</strong> {activeEvent.venue}</p>
                      <p><strong>Address:</strong> {activeEvent.address}</p>
                      <p><strong>Price:</strong> €{activeEvent.price}</p>
                    </div>
                  </div>
                  
                  {/* Status Messages */}
                  {submitStatus.type && (
                    <div className={`mb-6 p-4 rounded-lg ${
                      submitStatus.type === 'success' 
                        ? submitStatus.isWaitingList
                          ? 'bg-orange-100 border border-orange-400 text-orange-700'
                          : 'bg-green-100 border border-green-400 text-green-700'
                        : 'bg-red-100 border border-red-400 text-red-700'
                    }`}>
                      <div className="flex items-start">
                        {submitStatus.isWaitingList && (
                          <span className="text-2xl mr-2">⏳</span>
                        )}
                        <div>
                          <div className="font-semibold mb-2">
                            {submitStatus.isWaitingList ? 'Waiting List Registration' : 'Registration Successful'}
                          </div>
                          <div>{submitStatus.message}</div>
                        </div>
                      </div>
                      
                      {/* Email support button that appears after 1 minute */}
                      {submitStatus.type === 'success' && showEmailButton && (
                        <div className={`mt-4 pt-4 border-t ${
                          submitStatus.isWaitingList ? 'border-orange-300' : 'border-green-300'
                        }`}>
                          <p className="text-sm mb-3">
                            Still haven&apos;t received your email? Click below to contact us:
                          </p>
                          <button
                            onClick={handleEmailSupport}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            📧 Contact Support
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="firstName" className="block text-gray-700 font-medium mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your first name"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-gray-700 font-medium mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="your.email@example.com"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="+358 40 123 4567"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="experience" className="block text-gray-700 font-medium mb-2">
                        Dance Experience Level *
                      </label>
                      <select
                        id="experience"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="beginner">Beginner (0-1 years)</option>
                        <option value="intermediate">Intermediate (1-3 years)</option>
                        <option value="advanced">Advanced (3+ years)</option>
                      </select>
                    </div>

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="agreeToTerms"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleInputChange}
                        required
                        className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="agreeToTerms" className="text-gray-700 text-sm">
                        I agree to the terms and conditions and understand that this is a dance event with physical activity. *
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Processing Registration..." : "Complete Registration"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Event Details */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-blue-900 mb-4">Event Details</h3>
                  <div className="space-y-4 text-gray-700">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{new Date(activeEvent.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>16:00 - 23:45</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{activeEvent.venue}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm">{activeEvent.address}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-blue-900 mb-4">Pricing</h3>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-900 mb-2">€{activeEvent.price}</div>
                    <div className="text-gray-600 text-sm mb-4">Event Price</div>
                    <div className="text-gray-500 text-xs mt-2">* Includes access code & refreshments</div>
                  </div>
                </div>

                {/* What's Included */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-blue-900 mb-4">What&apos;s Included</h3>
                  <ul className="space-y-3 text-gray-700 text-sm">
                    <li className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Access to Floor 33 venue</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Hot tub access</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Terrace access</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Refreshments & snacks</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>DJ</span>
                    </li>
                  </ul>
                </div>

                {/* Venue Preview */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-blue-900 mb-4">Venue Preview</h3>
                  <div className="relative h-48 rounded-lg overflow-hidden">
                    <Image
                      src="/assets/optimized/4.jpg"
                      alt="Tower Swing Venue"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  </div>
                  <p className="text-gray-600 text-sm mt-3">
                    Stunning views from floor 33 of REDI shopping centre
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-16">
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">Frequently Asked Questions</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900 mb-2">What should I wear?</h4>
                    <p className="text-gray-700">Comfortable dancing attire. Bring a change of clothes if you plan to use the hot tub.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900 mb-2">Do I need dance experience?</h4>
                    <p className="text-gray-700">All levels are welcome! We&apos;ll have music for everyone from beginners to advanced dancers.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900 mb-2">How do I get the access code?</h4>
                    <p className="text-gray-700">You&apos;ll receive the access code via email 24 hours before the event.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900 mb-2">Can I bring a guest?</h4>
                    <p className="text-gray-700">Each registration is for one person. Guests need their own registration.</p>
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
        )}
      </div>
    </main>
  );
} 