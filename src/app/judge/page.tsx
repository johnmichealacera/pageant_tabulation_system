'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';

interface JudgeEventData {
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
    categories: Array<{
      id: string;
      name: string;
      maxScore: number;
      weight: number;
    }>;
  };
  judgeId: string;
  scores: Array<{
    contestantId: string;
    categoryId: string;
    score: number;
  }>;
}

export default function JudgeDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [eventData, setEventData] = useState<JudgeEventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'JUDGE') {
      router.push('/auth/signin');
      return;
    }

    fetchJudgeData();
  }, [session, status, router]);

  const fetchJudgeData = async () => {
    try {
      const response = await fetch('/api/judge/event-data');
      if (response.ok) {
        const data = await response.json();
        setEventData(data);
      } else if (response.status === 404) {
        setError('No active event found or you are not assigned as a judge');
      } else {
        setError('Failed to load event data');
      }
    } catch (error) {
      console.error('Error fetching judge data:', error);
      setError('Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  const getScoreForContestantCategory = (contestantId: string, categoryId: string) => {
    const score = eventData?.scores.find(
      s => s.contestantId === contestantId && s.categoryId === categoryId
    );
    return score?.score || 0;
  };

  const getTotalScoresSubmitted = () => {
    if (!eventData) return 0;
    return eventData.scores.length;
  };

  const getTotalPossibleScores = () => {
    if (!eventData) return 0;
    return eventData.event.contestants.length * eventData.event.categories.length;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
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
            {error === 'No active event found or you are not assigned as a judge'
              ? 'You are not currently assigned to judge any active pageant event. Please contact the administrator.'
              : 'Unable to load the event data at this time.'
            }
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const completionPercentage = getTotalPossibleScores() > 0 
    ? Math.round((getTotalScoresSubmitted() / getTotalPossibleScores()) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Judge Dashboard</h1>
              <p className="text-gray-600">{eventData.event.name}</p>
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
        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Scoring Progress</h2>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">{completionPercentage}%</div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {getTotalScoresSubmitted()} of {getTotalPossibleScores()} scores submitted
          </div>
        </div>

        {/* Event Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600">{eventData.event.contestants.length}</div>
            <div className="text-sm text-gray-500">Contestants</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600">{eventData.event.categories.length}</div>
            <div className="text-sm text-gray-500">Categories</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600">{new Date(eventData.event.eventDate).toLocaleDateString()}</div>
            <div className="text-sm text-gray-500">Event Date</div>
          </div>
        </div>

        {/* Contestants Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Score Contestants</h2>
          {eventData.event.contestants.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">No contestants to score yet</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventData.event.contestants.map((contestant) => {
                const contestantScores = eventData.event.categories.map(category => 
                  getScoreForContestantCategory(contestant.id, category.id)
                );
                const hasAllScores = contestantScores.every(score => score > 0);
                
                return (
                  <div key={contestant.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6">
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
                      
                      <div className="space-y-2 mb-4">
                        {eventData.event.categories.map((category) => {
                          const score = getScoreForContestantCategory(contestant.id, category.id);
                          return (
                            <div key={category.id} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">{category.name}</span>
                              <span className={`font-medium ${score > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                {score > 0 ? `${score}/${category.maxScore}` : 'Not scored'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => router.push(`/judge/score/${contestant.id}`)}
                        className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
                          hasAllScores
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {hasAllScores ? 'Review Scores' : 'Score Contestant'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
