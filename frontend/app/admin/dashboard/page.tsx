"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["700"] });

// Interface matching the backend Registration model
interface Registration {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  experience: 'beginner' | 'intermediate' | 'advanced';
  paymentStatus: 'pending' | 'paid' | 'cancelled' | 'waiting';
  registrationDate: string;
  eventDate: string;
  price: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  event?: {
    _id: string;
    name: string;
    year: number;
    date: string;
  };
}

interface Event {
  _id: string;
  name: string;
  year: number;
  date: string;
  maxCapacity: number;
  isActive: boolean;
}

export default function DashboardPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const router = useRouter();

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const adminToken = sessionStorage.getItem("adminToken");
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5001/api/registrations'
        : `${process.env.NEXT_PUBLIC_API_URL}/api/registrations`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        // Token expired or invalid
        sessionStorage.removeItem("adminAuthenticated");
        sessionStorage.removeItem("adminToken");
        router.push("/admin");
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch registrations');
      }

      const data = await response.json();
      setRegistrations(data.registrations || []);
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setError('Failed to load registrations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchEvents = useCallback(async () => {
    try {
      const adminToken = sessionStorage.getItem("adminToken");
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5001/api/events'
        : `${process.env.NEXT_PUBLIC_API_URL}/api/events`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        sessionStorage.removeItem("adminAuthenticated");
        sessionStorage.removeItem("adminToken");
        router.push("/admin");
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      // Don't set error for events as it's not critical for dashboard functionality
    }
  }, [router]);

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("adminAuthenticated");
    const adminToken = sessionStorage.getItem("adminToken");
    
    if (!isAuthenticated || !adminToken) {
      router.push("/admin");
      return;
    }

    // Fetch both registrations and events
    fetchRegistrations();
    fetchEvents();
  }, [router, fetchRegistrations, fetchEvents]);

  const updatePaymentStatus = async (registrationId: string, newStatus: 'paid' | 'pending' | 'cancelled' | 'waiting') => {
    try {
      const adminToken = sessionStorage.getItem("adminToken");
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? `http://localhost:5001/api/registrations/${registrationId}/status`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/registrations/${registrationId}/status`;

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });

      if (response.status === 401) {
        sessionStorage.removeItem("adminAuthenticated");
        sessionStorage.removeItem("adminToken");
        router.push("/admin");
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to update payment status');
      }

      // Update the local state
      setRegistrations(prev => 
        prev.map(reg => 
          reg._id === registrationId 
            ? { ...reg, paymentStatus: newStatus }
            : reg
        )
      );

    } catch (err) {
      console.error('Error updating payment status:', err);
      setError('Failed to update payment status. Please try again.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuthenticated");
    sessionStorage.removeItem("adminToken");
    router.push("/admin");
  };

  const filteredRegistrations = registrations.filter(registration => {
    const matchesSearch = 
      registration.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || registration.paymentStatus === statusFilter;
    
    const matchesEvent = eventFilter === "all" || registration.event?._id === eventFilter;
    
    return matchesSearch && matchesStatus && matchesEvent;
  });

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      waiting: "bg-orange-100 text-orange-800"
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || statusClasses.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getExperienceBadge = (experience: string) => {
    const experienceClasses = {
      beginner: "bg-blue-100 text-blue-800",
      intermediate: "bg-purple-100 text-purple-800",
      advanced: "bg-orange-100 text-orange-800"
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${experienceClasses[experience as keyof typeof experienceClasses] || experienceClasses.beginner}`}>
        {experience.charAt(0).toUpperCase() + experience.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading registrations...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchRegistrations}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className={`text-3xl font-bold text-blue-900 ${dancingScript.className}`}>
                Tower Swing Admin
              </h1>
              <p className="text-gray-600">Registration Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                {filteredRegistrations.length} registrations
              </span>
              <button
                onClick={fetchRegistrations}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4">
            <Link
              href="/admin/dashboard"
              className="px-3 py-2 text-blue-600 border-b-2 border-blue-600 font-medium"
            >
              Registrations
            </Link>
            <Link
              href="/admin/events"
              className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300 font-medium"
            >
              Events
            </Link>
          </nav>
        </div>
      </div>

      {/* Payment Statistics */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{filteredRegistrations.length}</div>
            <div className="text-sm text-gray-600">Total Registrations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredRegistrations.filter(r => r.paymentStatus === 'paid').length}
            </div>
            <div className="text-sm text-gray-600">Paid</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredRegistrations.filter(r => r.paymentStatus === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {filteredRegistrations.filter(r => r.paymentStatus === 'waiting').length}
            </div>
            <div className="text-sm text-gray-600">Waiting</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {filteredRegistrations.filter(r => r.paymentStatus === 'cancelled').length}
            </div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="waiting">Waiting</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event
              </label>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="all">All Events</option>
                {events.map(event => (
                  <option key={event._id} value={event._id}>{event.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Link
                href="/"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
              >
                Back to Site
              </Link>
            </div>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRegistrations.map((registration) => (
                  <tr key={registration._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {registration.firstName} {registration.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {registration._id.slice(-8)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{registration.email}</div>
                        <div className="text-sm text-gray-500">{registration.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getExperienceBadge(registration.experience)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {registration.event?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(registration.paymentStatus)}
                      <div className="mt-2 space-x-1">
                        {registration.paymentStatus !== 'paid' && (
                          <button
                            onClick={() => updatePaymentStatus(registration._id, 'paid')}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                            title="Mark as Paid"
                          >
                            ✓ Paid
                          </button>
                        )}
                        {registration.paymentStatus !== 'pending' && (
                          <button
                            onClick={() => updatePaymentStatus(registration._id, 'pending')}
                            className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors"
                            title="Mark as Pending"
                          >
                            ⏳ Pending
                          </button>
                        )}
                        {registration.paymentStatus !== 'waiting' && (
                          <button
                            onClick={() => updatePaymentStatus(registration._id, 'waiting')}
                            className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors"
                            title="Mark as Waiting"
                          >
                            ⏳ Waiting
                          </button>
                        )}
                        {registration.paymentStatus !== 'cancelled' && (
                          <button
                            onClick={() => updatePaymentStatus(registration._id, 'cancelled')}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                            title="Mark as Cancelled"
                          >
                            ✗ Cancel
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(registration.registrationDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredRegistrations.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {registrations.length === 0 
                ? "No registrations found in the database." 
                : "No registrations found matching your criteria."
              }
            </p>
          </div>
        )}
      </div>
    </main>
  );
} 