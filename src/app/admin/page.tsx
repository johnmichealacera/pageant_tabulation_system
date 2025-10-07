'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';

interface PageantEvent {
  id: string;
  name: string;
  description: string;
  eventDate: string;
  isActive: boolean;
  _count: {
    contestants: number;
    judges: number;
    categories: number;
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<PageantEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/auth/signin');
      return;
    }

    fetchEvents();
  }, [session, status, router]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (eventId: string) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/activate`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Error activating event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This will delete all associated data.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage Pageant Events</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome, {session?.user?.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Pageant Events</h2>
            <button
              onClick={() => router.push('/admin/events/new')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Create New Event
            </button>
          </div>

          {/* Events Grid */}
          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No pageant events created yet</div>
              <button
                onClick={() => router.push('/admin/events/new')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium"
              >
                Create Your First Event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                    event.isActive ? 'border-green-500' : 'border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                    {event.isActive && (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{event.description}</p>
                  
                  <div className="text-sm text-gray-500 mb-4">
                    <p>Date: {new Date(event.eventDate).toLocaleDateString()}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-indigo-600">{event._count.contestants}</div>
                      <div className="text-xs text-gray-500">Contestants</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-indigo-600">{event._count.judges}</div>
                      <div className="text-xs text-gray-500">Judges</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-indigo-600">{event._count.categories}</div>
                      <div className="text-xs text-gray-500">Categories</div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/admin/events/${event.id}`)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-medium"
                    >
                      Manage
                    </button>
                    {!event.isActive && (
                      <button
                        onClick={() => handleSetActive(event.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
