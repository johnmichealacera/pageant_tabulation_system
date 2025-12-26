'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ReportData {
  event: {
    id: string;
    name: string;
    description: string;
    eventDate: string;
    isActive: boolean;
  };
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
  rankings: Array<{
    contestantId: string;
    score: number;
    rank: number;
    number: number;
    contestant: any;
  }>;
  detailedScores: Array<{
    contestant: any;
    categoryScores: Array<{
      categoryId: string;
      categoryName: string;
      maxScore: number;
      weight: number;
      judgeScores: Array<{
        judgeId: string;
        judgeName: string;
        score: number | null;
      }>;
      averageScore: number;
      weightedScore: number;
    }>;
    totalScore: number;
  }>;
  statistics: {
    totalContestants: number;
    totalJudges: number;
    totalCategories: number;
    totalPossibleScore: number;
    averageTotalScore: number;
    totalScoresSubmitted: number;
    totalPossibleSubmissions: number;
    completionPercentage: number;
    generatedAt: string;
  };
}

export default function EventResults({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'ADMIN') {
      router.push('/auth/signin');
      return;
    }

    fetchReport();
  }, [session, status, router]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/admin/events/${params.id}/report`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        setError('Failed to load report data');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    // Rankings CSV
    let csv = 'Event Report - Rankings\n\n';
    csv += 'Rank,Contestant,Course,Total Score\n';
    reportData.rankings.forEach(ranking => {
      csv += `${ranking.rank},${ranking.contestant.name},${ranking.contestant.course},${ranking.score}\n`;
    });

    // Detailed scores CSV
    csv += '\n\nDetailed Scores by Category\n\n';
    reportData.contestants.forEach(contestant => {
      const contestantData = reportData.detailedScores.find(d => d.contestant.id === contestant.id);
      if (contestantData) {
        csv += `\nContestant: ${contestant.name}\n`;
        csv += 'Category,Max Score,Weight,Average Score,Weighted Score\n';
        contestantData.categoryScores.forEach(cat => {
          csv += `${cat.categoryName},${cat.maxScore},${cat.weight},${cat.averageScore},${cat.weightedScore}\n`;
        });
        csv += `Total Score:,${contestantData.totalScore}\n`;
      }
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.event.name.replace(/[^a-z0-9]/gi, '_')}_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-900 mb-4">
            {error || 'Report Not Available'}
          </div>
          <button
            onClick={() => router.push(`/admin/events/${params.id}`)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium"
          >
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2: return 'bg-gray-100 text-gray-800 border-gray-200';
      case 3: return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow print:shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Event Results Report</h1>
              <p className="text-gray-600">{reportData.event.name}</p>
            </div>
            <div className="flex space-x-3 print:hidden">
              <button
                onClick={() => router.push(`/admin/events/${params.id}`)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Back to Event
              </button>
              <button
                onClick={exportToCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Export CSV
              </button>
              <button
                onClick={printReport}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Print Report
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-8 print:shadow-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Event Name</p>
              <p className="text-lg font-semibold text-gray-900">{reportData.event.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Event Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(reportData.event.eventDate).toLocaleDateString()}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-lg font-semibold text-gray-900">{reportData.event.description}</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-lg shadow p-4 print:p-2 mb-4 print:shadow-none">
          <h2 className="text-xl print:text-lg font-bold text-gray-900 mb-3 print:mb-1">Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{reportData.statistics.totalContestants}</p>
              <p className="text-sm text-gray-500">Contestants</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{reportData.statistics.totalJudges}</p>
              <p className="text-sm text-gray-500">Judges</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{reportData.statistics.completionPercentage}%</p>
              <p className="text-sm text-gray-500">Completion</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{reportData.statistics.averageTotalScore}</p>
              <p className="text-sm text-gray-500">Avg Score</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Report Generated: {new Date(reportData.statistics.generatedAt).toLocaleString()}
          </div>
        </div>

        {/* Rankings */}
        <div className="bg-white rounded-lg shadow p-4 print:p-2 mb-4 print:shadow-none">
          <h2 className="text-xl print:text-lg font-bold text-gray-900 mb-4 print:mb-2">Final Rankings</h2>
          
          {/* Top 3 Podium */}
          {reportData.rankings.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 print:gap-1 print:mb-2">
              {reportData.rankings.slice(0, 3).map((ranking) => (
                <div key={ranking.contestantId} className="text-center p-4 print:p-2 border-2 rounded-lg bg-gradient-to-br from-gray-50 to-white">
                  {/* Profile Picture - Hidden in print */}
                  <div className="flex justify-center mb-2 print:hidden">
                    {ranking.contestant.photo ? (
                      <img
                        src={ranking.contestant.photo}
                        alt={ranking.contestant.name}
                        className="w-16 h-20 rounded-lg object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center border-4 border-white shadow-lg">
                        <span className="text-2xl">👸</span>
                      </div>
                    )}
                  </div>

                  {/* Rank Icon */}
                  <div className={`inline-flex items-center justify-center w-12 h-12 print:w-10 print:h-10 rounded-full border-2 mb-2 print:mb-1 ${getRankColor(ranking.rank)}`}>
                    <span className="text-lg print:text-sm">{getRankIcon(ranking.rank)}</span>
                  </div>

                  {/* Candidate Number */}
                  <div className="text-base print:text-sm font-bold text-indigo-600 mb-1">
                    Candidate {ranking.number}
                  </div>

                  {/* Name */}
                  <h3 className="text-base print:text-sm font-semibold text-gray-900 mb-1">{ranking.contestant.name}</h3>
                  <p className="text-xs print:text-xs text-gray-600 mb-2 print:mb-1">{ranking.contestant.course}</p>
                  <div className="text-xl print:text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{ranking.score}</div>
                  <p className="text-xs text-gray-500">Total Score</p>
                </div>
              ))}
            </div>
          )}

          {/* Full Rankings Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Rank</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden w-16">Photo</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Candidate</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Course</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Total Score</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Percentage</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.rankings.map((ranking) => {
                  const percentage = ((ranking.score / reportData.statistics.totalPossibleScore) * 100).toFixed(1);
                  return (
                    <tr key={ranking.contestantId} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className={`inline-flex items-center justify-center w-8 h-8 print:w-6 print:h-6 rounded-full text-xs print:text-xs font-bold ${getRankColor(ranking.rank)}`}>
                          {getRankIcon(ranking.rank)}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap print:hidden">
                        <div className="flex-shrink-0">
                          {ranking.contestant.photo ? (
                            <img
                              src={ranking.contestant.photo}
                              alt={ranking.contestant.name}
                              className="w-8 h-10 rounded-lg object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-8 h-10 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg flex items-center justify-center border border-gray-200">
                              <span className="text-sm">👸</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm font-bold text-indigo-600">Candidate {ranking.number}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{ranking.contestant.name}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{ranking.contestant.course}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <div className="text-base print:text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{ranking.score}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {percentage}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Scores - Hidden in print for single page */}
        <div className="bg-white rounded-lg shadow p-6 mb-8 print:hidden">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Detailed Scores</h2>
          
          {reportData.detailedScores.map((contestantData) => (
            <div key={contestantData.contestant.id} className="mb-8 border-b border-gray-200 pb-8 last:border-b-0">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {contestantData.contestant.name} - {contestantData.contestant.course}
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Max</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Weight</th>
                      {reportData.judges.map(judge => (
                        <th key={judge.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          {judge.name}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Weighted</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contestantData.categoryScores.map((cat) => (
                      <tr key={cat.categoryId}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {cat.categoryName}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {cat.maxScore}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {(cat.weight * 100).toFixed(0)}%
                        </td>
                        {cat.judgeScores.map((judgeScore) => (
                          <td key={judgeScore.judgeId} className="px-4 py-4 whitespace-nowrap text-center text-sm">
                            {judgeScore.score !== null ? judgeScore.score : '-'}
                          </td>
                        ))}
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-semibold text-gray-900">
                          {cat.averageScore}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-bold text-indigo-600">
                          {cat.weightedScore}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan={4 + reportData.judges.length} className="px-4 py-4 text-right text-sm text-gray-900">
                        Total Score:
                      </td>
                      <td colSpan={2} className="px-4 py-4 text-center text-lg font-bold text-indigo-600">
                        {contestantData.totalScore}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Judges Information - Hidden in print for single page */}
        <div className="bg-white rounded-lg shadow p-6 print:hidden">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Judges Panel</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportData.judges.map((judge) => (
              <div key={judge.id} className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900">{judge.name}</h4>
                <p className="text-sm text-gray-600">{judge.role}</p>
                {judge.user && (
                  <p className="text-sm text-gray-500">{judge.user.email}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Print Styles - Aggressive single-page optimization */}
      <style jsx global>{`
        @media print {
          /* Hide non-essential sections */
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }

          /* Force white background */
          body {
            background: white !important;
            font-size: 10px !important;
            line-height: 1.1 !important;
          }
          .bg-gray-50 {
            background: white !important;
          }
          .shadow {
            box-shadow: none !important;
          }

          /* Aggressive spacing reduction */
          .mb-8, .mb-6, .mb-4, .mb-3, .mb-2 {
            margin-bottom: 2px !important;
          }
          .mt-8, .mt-6, .mt-4, .mt-3, .mt-2 {
            margin-top: 2px !important;
          }
          .py-8, .py-6, .py-4, .py-3, .py-2 {
            padding-top: 2px !important;
            padding-bottom: 2px !important;
          }
          .px-8, .px-6, .px-4, .px-3, .px-2 {
            padding-left: 2px !important;
            padding-right: 2px !important;
          }
          .p-8, .p-6, .p-4, .p-3, .p-2 {
            padding: 2px !important;
          }

          /* Compact headers */
          h1 { font-size: 18px !important; margin-bottom: 2px !important; }
          h2 { font-size: 14px !important; margin-bottom: 2px !important; }
          h3 { font-size: 12px !important; margin-bottom: 2px !important; }

          /* Ultra-compact tables */
          table {
            font-size: 8px !important;
            margin-bottom: 2px !important;
            table-layout: fixed !important;
            width: 100% !important;
          }
          th, td {
            padding: 2px 3px !important;
            line-height: 1 !important;
          }

          /* Compact grid layouts */
          .grid-cols-3 {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 1px !important;
          }
          .grid-cols-2 {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1px !important;
          }
          .grid-cols-4 {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 1px !important;
          }

          /* Reduce podium dimensions aggressively */
          .h-48, .h-40, .h-32, .h-24 {
            height: 50px !important;
          }

          /* Minimal main content spacing */
          main {
            padding: 4px !important;
          }

          /* Remove all borders and shadows for space */
          .border, .border-2, .shadow, .shadow-lg, .rounded-lg {
            border: none !important;
            box-shadow: none !important;
            border-radius: 1px !important;
          }

          /* Smaller icons and emojis */
          .text-2xl, .text-3xl, .text-4xl, .text-5xl, .text-6xl, .text-7xl {
            font-size: 10px !important;
          }

          /* Prevent page breaks */
          .card, .bg-white, div {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Force single page layout */
          .min-h-screen {
            min-height: 100vh !important;
            height: 100vh !important;
            page-break-after: avoid !important;
          }

          /* Compact text scaling */
          .text-xs { font-size: 8px !important; }
          .text-sm { font-size: 9px !important; }
          .text-base { font-size: 10px !important; }
          .text-lg { font-size: 11px !important; }
          .text-xl { font-size: 12px !important; }
          .text-2xl { font-size: 13px !important; }
          .text-3xl { font-size: 14px !important; }
          .text-4xl { font-size: 15px !important; }
        }
      `}</style>
    </div>
  );
}

