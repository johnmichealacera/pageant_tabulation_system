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
    contestant: any;
  }>;
  totalScores: { [key: string]: number };
}

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'contestants' | 'scoring' | 'rankings' | 'breakdown'>('contestants');
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveEvent();
  }, []);

  const fetchActiveEvent = async () => {
    try {
      const response = await fetch('/api/public/active-event');
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{eventData.event.name}</h1>
              <p className="text-gray-600">
                {eventData.event.description} • {new Date(eventData.event.eventDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Contestants</p>
                <p className="text-2xl font-bold text-indigo-600">{eventData.event.contestants.length}</p>
              </div>
              <button
                onClick={() => router.push('/auth/signin')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Login
              </button>
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
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
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
                {eventData.event.contestants.map((contestant) => (
                  <ContestantCard key={contestant.id} contestant={contestant} />
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
          </div>
        )}
      </main>
    </div>
  );
}
