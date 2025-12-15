'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface EventData {
  id: string;
  name: string;
  description: string;
  eventDate: string;
  isActive: boolean;
  contestants: Array<{
    id: string;
    name: string;
    age: number;
    course: string;
    year: string;
    photo?: string;
  }>;
  judges: Array<{
    id: string;
    name: string;
    role: string;
    user?: {
      email: string;
    };
  }>;
  categories: Array<{
    id: string;
    name: string;
    maxScore: number;
    weight: number;
  }>;
  _count: {
    scores: number;
  };
}

export default function EventManagement({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'contestants' | 'judges' | 'categories'>('contestants');

  useEffect(() => {
    if (status === 'loading') return;
    
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'ADMIN') {
      router.push('/auth/signin');
      return;
    }

    fetchEvent();
  }, [session, status, router, params.id]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/admin/events/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      } else if (response.status === 404) {
        router.push('/admin');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContestant = async (contestantId: string) => {
    try {
      const response = await fetch(`/api/admin/events/${params.id}/contestants/${contestantId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchEvent();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete contestant');
      }
    } catch (error) {
      console.error('Error deleting contestant:', error);
      alert('Failed to delete contestant');
    }
  };

  const handleDeleteJudge = async (judgeId: string) => {
    try {
      const response = await fetch(`/api/admin/events/${params.id}/judges/${judgeId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchEvent();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete judge');
      }
    } catch (error) {
      console.error('Error deleting judge:', error);
      alert('Failed to delete judge');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/admin/events/${params.id}/categories/${categoryId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchEvent();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Event not found</div>
      </div>
    );
  }

  const tabs = [
    { id: 'contestants' as const, label: 'Contestants', count: event.contestants.length },
    { id: 'judges' as const, label: 'Judges', count: event.judges.length },
    { id: 'categories' as const, label: 'Categories', count: event.categories.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
              <p className="text-gray-600">
                {event.description} • {new Date(event.eventDate).toLocaleDateString()}
                {event.isActive && (
                  <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Active Event
                  </span>
                )}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/admin')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Back to Dashboard
              </button>
              {event._count.scores > 0 && (
                <>
                  <button
                    onClick={() => router.push(`/admin/events/${event.id}/results`)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    View Results
                  </button>
                  <button
                    onClick={() => router.push(`/admin/events/${event.id}/report`)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v8m5 -4h4" />
                    </svg>
                    Comprehensive Report
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'contestants' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Contestants</h2>
              <button
                onClick={() => router.push(`/admin/events/${event.id}/contestants/new`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Add Contestant
              </button>
            </div>

            {event.contestants.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">No contestants added yet</div>
                <button
                  onClick={() => router.push(`/admin/events/${event.id}/contestants/new`)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium"
                >
                  Add First Contestant
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {event.contestants.map((contestant) => (
                  <div key={contestant.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-center mb-4">
                      <div className="w-24 h-32 mx-auto bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                        {contestant.photo ? (
                          <img
                            src={contestant.photo}
                            alt={contestant.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-gray-400">No Photo</span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{contestant.name}</h3>
                      <p className="text-sm text-gray-600">Age: {contestant.age}</p>
                      <p className="text-sm text-gray-600">{contestant.course}</p>
                      <p className="text-sm text-gray-600">{contestant.year}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/admin/events/${event.id}/contestants/${contestant.id}/edit`)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this contestant? All scores will also be deleted.')) {
                            handleDeleteContestant(contestant.id);
                          }
                        }}
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
        )}

        {activeTab === 'judges' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Judges</h2>
              <button
                onClick={() => router.push(`/admin/events/${event.id}/judges/new`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Add Judge
              </button>
            </div>

            {event.judges.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">No judges added yet</div>
                <button
                  onClick={() => router.push(`/admin/events/${event.id}/judges/new`)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium"
                >
                  Add First Judge
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {event.judges.map((judge) => (
                  <div key={judge.id} className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{judge.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{judge.role}</p>
                    {judge.user && (
                      <p className="text-sm text-gray-500 mb-4">Email: {judge.user.email}</p>
                    )}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/admin/events/${event.id}/judges/${judge.id}/edit`)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this judge? All their scores will also be deleted.')) {
                            handleDeleteJudge(judge.id);
                          }
                        }}
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
        )}

        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Scoring Categories</h2>
              <button
                onClick={() => router.push(`/admin/events/${event.id}/categories/new`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Add Category
              </button>
            </div>

            {event.categories.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">No categories added yet</div>
                <button
                  onClick={() => router.push(`/admin/events/${event.id}/categories/new`)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium"
                >
                  Add First Category
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {event.categories.map((category) => (
                  <div key={category.id} className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">Max Score: {category.maxScore}</p>
                      <p className="text-sm text-gray-600">Weight: {(category.weight * 100).toFixed(0)}%</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/admin/events/${event.id}/categories/${category.id}/edit`)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this category? All scores in this category will also be deleted.')) {
                            handleDeleteCategory(category.id);
                          }
                        }}
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
        )}
      </main>
    </div>
  );
}
