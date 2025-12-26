'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ContestantCard from '@/components/ContestantCard';
import ScoreTable from '@/components/ScoreTable';
import RankingTable from '@/components/RankingTable';
import CategoryBreakdown from '@/components/CategoryBreakdown';

interface EventData {
  event: {
    id: string;
    name: string;
    description: string;
    eventDate: string;
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
    }>;
    categories: Array<{
      id: string;
      name: string;
      maxScore: number;
      weight: number;
    }>;
    scores: Array<{
      id: string;
      score: number;
      contestantId: string;
      categoryId: string;
      judgeId: string;
    }>;
  };
  rankings: Array<{
    contestantId: string;
    score: number;
    rank: number;
    number: number;
    contestant: any;
  }>;
  totalScores: { [key: string]: number };
}

interface EventOption {
  id: string;
  name: string;
  description: string;
  eventDate: string;
  isActive: boolean;
}

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'contestants' | 'scoring' | 'rankings' | 'breakdown'>('contestants');
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [allEvents, setAllEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContestantId, setSelectedContestantId] = useState<string | null>(null);

  // Initial load: fetch events and active event only once on mount
  useEffect(() => {
    fetchAllEvents();
    fetchActiveEvent();
  }, []); // Empty dependency array - only run on mount

  // Separate effect for refresh listeners that use the current eventData
  useEffect(() => {
    // Refresh data when user returns to the tab/page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (eventData?.event?.id) {
          fetchEventById(eventData.event.id);
        } else {
          fetchActiveEvent();
        }
      }
    };

    // Refresh data when window gains focus
    const handleFocus = () => {
      if (eventData?.event?.id) {
        fetchEventById(eventData.event.id);
      } else {
        fetchActiveEvent();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [eventData?.event?.id]); // This effect can depend on eventData since it only refreshes, doesn't fetch active event

  const handleRefresh = () => {
    if (eventData?.event?.id) {
      fetchEventById(eventData.event.id);
    } else {
      fetchActiveEvent();
    }
  };

  const fetchAllEvents = async () => {
    try {
      // Add cache-busting query parameter
      const response = await fetch(`/api/public/events?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAllEvents(data);
      }
    } catch (error) {
      console.error('Error fetching all events:', error);
    }
  };

  const fetchActiveEvent = async () => {
    try {
      // Add cache-busting query parameter
      const response = await fetch(`/api/public/active-event?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setEventData(data);
      } else if (response.status === 404) {
        setError('No active pageant event found');
      } else {
        setError('Failed to load event data');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventById = async (eventId: string) => {
    setLoading(true);
    try {
      // Add cache-busting query parameter
      const response = await fetch(`/api/public/events/${eventId}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setEventData(data);
        setError(null);
      } else {
        setError('Failed to load event data');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (eventId: string) => {
    fetchEventById(eventId);
  };

  const handleContestantClick = (contestantId: string) => {
    setSelectedContestantId(contestantId);
    setActiveTab('breakdown');
  };

  const handleBackToContestants = () => {
    setSelectedContestantId(null);
    setActiveTab('contestants');
  };

  const tabs = [
    { id: 'contestants', label: 'Contestants', icon: '👑' },
    { id: 'scoring', label: 'Scoring', icon: '📊' },
    { id: 'rankings', label: 'Rankings', icon: '🏆' },
    { id: 'breakdown', label: 'Category Breakdown', icon: '📈' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-900 mb-2">Loading...</div>
          <div className="text-gray-600">Fetching pageant data</div>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-900 mb-4">
            {error || 'No Event Available'}
          </div>
          <div className="text-gray-600 mb-6">
            {error === 'No active pageant event found' 
              ? 'There is currently no active pageant event. Please check back later or contact the administrator.'
              : 'Unable to load the pageant event data at this time.'
            }
          </div>
          <button
            onClick={() => router.push('/auth/signin')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium"
          >
            Admin/Judge Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Event Selection Bar */}
      {allEvents.length > 1 && (
        <div className="bg-indigo-50 border-b border-indigo-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-3">
                <span className="text-sm font-medium text-indigo-900">View Event:</span>
                <select
                  onChange={(e) => handleEventChange(e.target.value)}
                  value={eventData?.event.id || ''}
                  className="block w-full sm:w-auto px-3 py-1.5 bg-white border border-indigo-200 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  {allEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} {event.isActive && '(Active)'}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-indigo-600">
                {allEvents.length} {allEvents.length === 1 ? 'event' : 'events'} available
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center py-4 md:py-6 gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">{eventData.event.name}</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                {eventData.event.description} • {new Date(eventData.event.eventDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center justify-between md:justify-end space-x-4 sm:space-x-6">
              <div className="text-right">
                <p className="text-xs md:text-sm text-gray-500">Total Contestants</p>
                <p className="text-xl md:text-2xl font-bold text-indigo-600">{eventData.event.contestants.length}</p>
              </div>
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                title="Refresh data"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={() => router.push('/auth/signin')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-1 sm:mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'contestants' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contestants</h2>
            {eventData.event.contestants.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">No contestants have been added yet</div>
                <p className="text-sm text-gray-400">Check back later for contestant information</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventData.event.contestants
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((contestant, index) => (
                    <ContestantCard
                      key={contestant.id}
                      contestant={contestant}
                      candidateNumber={index + 1}
                      onClick={() => handleContestantClick(contestant.id)}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'scoring' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Scoring System</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                {eventData.event.categories.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">No categories defined yet</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {eventData.event.categories.map((category) => (
                      <div key={category.id} className="bg-white p-4 rounded-lg shadow">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-gray-900">{category.name}</h4>
                            <p className="text-sm text-gray-600">Weight: {(category.weight * 100).toFixed(0)}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-indigo-600">{category.maxScore}</p>
                            <p className="text-xs text-gray-500">Max Score</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Judges Panel</h3>
                {eventData.event.judges.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">No judges assigned yet</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {eventData.event.judges.map((judge) => (
                      <div key={judge.id} className="bg-white p-4 rounded-lg shadow">
                        <h4 className="font-medium text-gray-900">{judge.name}</h4>
                        <p className="text-sm text-gray-600">{judge.role}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rankings' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Final Rankings</h2>
            {eventData.rankings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">No scores available yet</div>
                <p className="text-sm text-gray-400">Rankings will appear once judges start scoring contestants</p>
              </div>
            ) : (
              <RankingTable rankings={eventData.rankings} />
            )}
          </div>
        )}

        {activeTab === 'breakdown' && (
          <div>
            {selectedContestantId ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-4">
                    <button
                      onClick={handleBackToContestants}
                      className="text-indigo-600 hover:text-indigo-700 font-medium text-sm sm:text-base"
                    >
                      ← Back to Contestants
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {eventData.event.contestants.find(c => c.id === selectedContestantId)?.name}'s Performance
                    </h2>
                  </div>
                </div>
                
                {/* Contestant-specific breakdown */}
                {(() => {
                  const contestant = eventData.event.contestants.find(c => c.id === selectedContestantId);
                  if (!contestant || !eventData.event.scores.length) {
                    return (
                      <div className="text-center py-12">
                        <div className="text-gray-500 mb-4">No scores available yet</div>
                        <p className="text-sm text-gray-400">Scores will appear once judges start scoring</p>
                      </div>
                    );
                  }

                  // Calculate scores per category for this contestant
                  const categoryScores = eventData.event.categories.map(category => {
                    const catScores = eventData.event.scores.filter(
                      s => s.contestantId === selectedContestantId && s.categoryId === category.id
                    );
                    const avgScore = catScores.length > 0
                      ? catScores.reduce((sum, s) => sum + s.score, 0) / catScores.length
                      : 0;
                    const weightedScore = avgScore * category.weight;
                    
                    return {
                      category,
                      avgScore,
                      weightedScore,
                      count: catScores.length,
                    };
                  });

                  return (
                    <div className="space-y-6">
                      {/* Contestant info card */}
                      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          {contestant.photo ? (
                            <img
                              src={contestant.photo}
                              alt={contestant.name}
                              className="w-20 h-28 sm:w-24 sm:h-32 rounded-lg object-cover mx-auto sm:mx-0"
                            />
                          ) : (
                            <div className="w-20 h-28 sm:w-24 sm:h-32 bg-gray-200 rounded-lg flex items-center justify-center mx-auto sm:mx-0">
                              <span className="text-4xl">👸</span>
                            </div>
                          )}
                          <div className="flex-1 text-center sm:text-left">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{contestant.name}</h3>
                            <p className="text-gray-600">{contestant.course}</p>
                            <p className="text-gray-500">{contestant.year} • Age {contestant.age}</p>
                            <div className="mt-2">
                              <span className="text-base sm:text-lg font-bold text-indigo-600">
                                Total Score: {eventData.totalScores[selectedContestantId]?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Category performance */}
                      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
                        <div className="space-y-4">
                          {categoryScores.map(({ category, avgScore, weightedScore, count }) => (
                            <div key={category.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                                <h4 className="font-medium text-gray-900 text-sm sm:text-base">{category.name}</h4>
                                <div className="text-left sm:text-right">
                                  <div className="text-xs sm:text-sm text-gray-500">Weight: {(category.weight * 100).toFixed(0)}%</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-2">
                                <div>
                                  <div className="text-xl sm:text-2xl font-bold text-primary-600">{avgScore.toFixed(1)}</div>
                                  <div className="text-xs text-gray-500">Avg Score</div>
                                </div>
                                <div>
                                  <div className="text-xl sm:text-2xl font-bold text-indigo-600">{weightedScore.toFixed(1)}</div>
                                  <div className="text-xs text-gray-500">Weighted</div>
                                </div>
                                <div>
                                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{count}</div>
                                  <div className="text-xs text-gray-500">Judges</div>
                                </div>
                              </div>
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${((avgScore / category.maxScore) * 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Category Breakdown</h2>
                {eventData.rankings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">No scores available yet</div>
                    <p className="text-sm text-gray-400">Category breakdown will appear once judges start scoring contestants</p>
                  </div>
                ) : (
                  <CategoryBreakdown 
                    contestants={eventData.event.contestants}
                    categories={eventData.event.categories}
                    totalScores={eventData.totalScores}
                  />
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
