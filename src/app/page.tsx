'use client';

import { useState } from 'react';
import { mockContestants, mockCategories, mockJudges, getRankings, calculateTotalScores } from '@/lib/data';
import ContestantCard from '@/components/ContestantCard';
import ScoreTable from '@/components/ScoreTable';
import RankingTable from '@/components/RankingTable';
import CategoryBreakdown from '@/components/CategoryBreakdown';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'contestants' | 'scoring' | 'rankings' | 'breakdown'>('contestants');
  const rankings = getRankings();
  const totalScores = calculateTotalScores();

  const tabs = [
    { id: 'contestants', label: 'Contestants', icon: '👑' },
    { id: 'scoring', label: 'Scoring', icon: '📊' },
    { id: 'rankings', label: 'Rankings', icon: '🏆' },
    { id: 'breakdown', label: 'Category Breakdown', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pageant Tabulation System</h1>
              <p className="text-gray-600">School College Beauty Pageant 2024</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Contestants</p>
              <p className="text-2xl font-bold text-primary-600">{mockContestants.length}</p>
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
                    ? 'border-primary-500 text-primary-600'
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockContestants.map((contestant) => (
                <ContestantCard key={contestant.id} contestant={contestant} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'scoring' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Scoring System</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                <div className="space-y-3">
                  {mockCategories.map((category) => (
                    <div key={category.id} className="card">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-900">{category.name}</h4>
                          <p className="text-sm text-gray-600">Weight: {(category.weight * 100).toFixed(0)}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary-600">{category.maxScore}</p>
                          <p className="text-xs text-gray-500">Max Score</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Judges Panel</h3>
                <div className="space-y-3">
                  {mockJudges.map((judge) => (
                    <div key={judge.id} className="card">
                      <h4 className="font-medium text-gray-900">{judge.name}</h4>
                      <p className="text-sm text-gray-600">{judge.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rankings' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Final Rankings</h2>
            <RankingTable rankings={rankings} />
          </div>
        )}

        {activeTab === 'breakdown' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Category Breakdown</h2>
            <CategoryBreakdown 
              contestants={mockContestants}
              categories={mockCategories}
              totalScores={totalScores}
            />
          </div>
        )}
      </main>
    </div>
  );
}
