'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ContestantData {
  contestant: {
    id: string;
    name: string;
    age: number;
    course: string;
    year: string;
    photo?: string;
  };
  categories: Array<{
    id: string;
    name: string;
    maxScore: number;
    weight: number;
  }>;
  existingScores: Array<{
    categoryId: string;
    score: number;
  }>;
  judgeId: string;
}

export default function ScoreContestant({ params }: { params: { contestantId: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contestantData, setContestantData] = useState<ContestantData | null>(null);
  const [scores, setScores] = useState<{ [categoryId: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'JUDGE') {
      router.push('/auth/signin');
      return;
    }

    fetchContestantData();
  }, [session, status, router, params.contestantId]);

  const fetchContestantData = async () => {
    try {
      const response = await fetch(`/api/judge/contestant/${params.contestantId}`);
      if (response.ok) {
        const data = await response.json();
        setContestantData(data);
        
        // Initialize scores with existing scores
        const initialScores: { [categoryId: string]: number } = {};
        data.existingScores.forEach((score: any) => {
          initialScores[score.categoryId] = score.score;
        });
        setScores(initialScores);
      } else if (response.status === 404) {
        setError('Contestant not found or you are not authorized to score this contestant');
      } else {
        setError('Failed to load contestant data');
      }
    } catch (error) {
      console.error('Error fetching contestant data:', error);
      setError('Failed to load contestant data');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (categoryId: string, score: number) => {
    setScores(prev => ({
      ...prev,
      [categoryId]: score
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/judge/contestant/${params.contestantId}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scores }),
      });

      if (response.ok) {
        router.push('/judge');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save scores');
      }
    } catch (error) {
      console.error('Error saving scores:', error);
      alert('Failed to save scores');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !contestantData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-900 mb-4">
            {error || 'Contestant Not Found'}
          </div>
          <button
            onClick={() => router.push('/judge')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const allScoresEntered = contestantData.categories.every(category => 
    scores[category.id] && scores[category.id] > 0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Score Contestant</h1>
              <p className="text-gray-600">Enter your scores for {contestantData.contestant.name}</p>
            </div>
            <button
              onClick={() => router.push('/judge')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contestant Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <div className="text-center">
                <div className="w-32 h-40 mx-auto bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  {contestantData.contestant.photo ? (
                    <img
                      src={contestantData.contestant.photo}
                      alt={contestantData.contestant.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-gray-400">No Photo</span>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {contestantData.contestant.name}
                </h2>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Age: {contestantData.contestant.age}</p>
                  <p>{contestantData.contestant.course}</p>
                  <p>{contestantData.contestant.year}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scoring Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <form onSubmit={handleSubmit} className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Scoring Categories</h3>
                
                <div className="space-y-6">
                  {contestantData.categories.map((category) => (
                    <div key={category.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-md font-medium text-gray-900">{category.name}</h4>
                        <div className="text-sm text-gray-500">
                          Max Score: {category.maxScore} • Weight: {(category.weight * 100).toFixed(0)}%
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          min="0"
                          max={category.maxScore}
                          step="0.5"
                          value={scores[category.id] || 0}
                          onChange={(e) => handleScoreChange(category.id, parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max={category.maxScore}
                            step="0.5"
                            value={scores[category.id] || ''}
                            onChange={(e) => handleScoreChange(category.id, parseFloat(e.target.value) || 0)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="0"
                          />
                          <span className="text-sm text-gray-500">/ {category.maxScore}</span>
                        </div>
                      </div>
                      
                      {scores[category.id] > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          Score: {scores[category.id]} ({((scores[category.id] / category.maxScore) * 100).toFixed(1)}%)
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => router.push('/judge')}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !allScoresEntered}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Scores'}
                  </button>
                </div>

                {!allScoresEntered && (
                  <div className="mt-4 text-sm text-amber-600">
                    Please enter scores for all categories before saving.
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
