'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

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

export default function ComprehensiveReport({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'ADMIN') {
      router.push('/auth/signin');
      return;
    }

    fetchReport();
  }, [session, status, router, params.id]);

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

    // Create comprehensive CSV with all sections
    let csv = `"${reportData.event.name} - Comprehensive Report"\n`;
    csv += `"Generated: ${new Date(reportData.statistics.generatedAt).toLocaleString()}"\n\n`;
    
    // Event Information
    csv += '"EVENT INFORMATION"\n';
    csv += `"Event Name","${reportData.event.name}"\n`;
    csv += `"Event Date","${new Date(reportData.event.eventDate).toLocaleDateString()}"\n`;
    csv += `"Description","${reportData.event.description}"\n\n`;
    
    // Statistics
    csv += '"STATISTICS"\n';
    csv += `"Total Contestants","${reportData.statistics.totalContestants}"\n`;
    csv += `"Total Judges","${reportData.statistics.totalJudges}"\n`;
    csv += `"Total Categories","${reportData.statistics.totalCategories}"\n`;
    csv += `"Completion Percentage","${reportData.statistics.completionPercentage}%"\n`;
    csv += `"Average Total Score","${reportData.statistics.averageTotalScore}"\n\n`;
    
    // Rankings
    csv += '"FINAL RANKINGS"\n';
    csv += '"Rank","Contestant Name","Course","Year","Age","Total Score","Percentage"\n';
    reportData.rankings.forEach(ranking => {
      const percentage = ((ranking.score / reportData.statistics.totalPossibleScore) * 100).toFixed(1);
      csv += `"${ranking.rank}","${ranking.contestant.name}","${ranking.contestant.course}","${ranking.contestant.year}","${ranking.contestant.age}","${ranking.score}","${percentage}%"\n`;
    });
    csv += '\n';

    // Detailed Scores by Contestant
    csv += '"DETAILED SCORES BY CONTESTANT"\n\n';
    reportData.detailedScores.forEach(contestantData => {
      csv += `"Contestant: ${contestantData.contestant.name} (${contestantData.contestant.course})"\n`;
      csv += '"Category","Max Score","Weight",';
      
      // Add judge headers
      reportData.judges.forEach(judge => {
        csv += `"${judge.name}",`;
      });
      csv += '"Average","Weighted Score"\n';
      
      // Add category scores
      contestantData.categoryScores.forEach(cat => {
        csv += `"${cat.categoryName}","${cat.maxScore}","${(cat.weight * 100).toFixed(0)}%",`;
        cat.judgeScores.forEach(judgeScore => {
          csv += `"${judgeScore.score !== null ? judgeScore.score : '-'}",`;
        });
        csv += `"${cat.averageScore}","${cat.weightedScore}"\n`;
      });
      csv += `"TOTAL SCORE","","","","","${contestantData.totalScore}"\n\n`;
    });

    // Judges Panel
    csv += '"JUDGES PANEL"\n';
    csv += '"Name","Role","Email"\n';
    reportData.judges.forEach(judge => {
      csv += `"${judge.name}","${judge.role}","${judge.user?.email || 'N/A'}"\n`;
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportData.event.name.replace(/[^a-z0-9]/gi, '_')}_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    setExportingPDF(true);
    
    // Add print-specific class to body
    document.body.classList.add('printing');
    
    // Trigger print dialog
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printing');
      setExportingPDF(false);
    }, 500);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">👑</div>
          <div className="text-xl font-semibold text-gray-900 mb-2">Loading Report...</div>
          <div className="text-gray-600">Generating comprehensive report</div>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center bg-white rounded-lg shadow-xl p-8">
          <div className="text-xl font-semibold text-gray-900 mb-4">
            {error || 'Report Not Available'}
          </div>
          <button
            onClick={() => router.push(`/admin/events/${params.id}`)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-md font-medium"
          >
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  const topThree = reportData.rankings.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white print:text-sm report-container" ref={reportRef}>
      {/* Header with Export Options */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg print:bg-white print:text-black print:shadow-none print:py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:px-2">
          <div className="flex justify-between items-center py-4 print:py-1">
            <div>
              <h1 className="text-2xl print:text-xl font-bold flex items-center gap-2">
                <span className="text-3xl print:text-2xl">👑</span>
                Comprehensive Event Report
              </h1>
              <p className="text-indigo-100 print:text-gray-600 print:text-sm">{reportData.event.name}</p>
            </div>
            <div className="flex space-x-3 print:hidden">
              <button
                onClick={() => router.push(`/admin/events/${params.id}`)}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md text-sm font-medium backdrop-blur-sm"
              >
                ← Back
              </button>
              <button
                onClick={exportToCSV}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <button
                onClick={exportToPDF}
                disabled={exportingPDF}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {exportingPDF ? 'Preparing...' : 'Export PDF'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 print:py-2 print:px-2">
        {/* Event Information Card */}
        <div className="bg-white rounded-lg shadow-lg p-4 print:p-2 mb-4 print:shadow-none print:border print:border-gray-300 print:mb-2">
          <div className="flex items-center gap-3 mb-4 print:mb-2">
            <div className="w-10 h-10 print:w-8 print:h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl print:text-sm">📋</span>
            </div>
            <h2 className="text-xl print:text-lg font-bold text-gray-900">Event Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Event Name</p>
              <p className="text-lg font-semibold text-gray-900">{reportData.event.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Event Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(reportData.event.eventDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500 uppercase tracking-wide">Description</p>
              <p className="text-lg text-gray-700">{reportData.event.description}</p>
            </div>
          </div>
        </div>

        {/* Top 3 Podium Display */}
        {topThree.length >= 3 && (
          <div className="bg-gradient-to-br from-yellow-50 via-gray-50 to-orange-50 rounded-lg shadow-lg p-4 print:p-2 mb-4 print:mb-2 print:bg-white print:shadow-none print:border print:border-gray-300">
            <div className="flex items-center gap-3 mb-4 print:mb-2">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl print:text-lg">🏆</span>
              </div>
              <h2 className="text-xl print:text-lg font-bold text-gray-900">Winners Podium</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              {/* 2nd Place */}
              <div className="text-center order-2 sm:order-1">
                {/* Profile Picture - Hidden in print */}
                <div className="flex justify-center mb-4 print:hidden">
                  {topThree[1].contestant.photo ? (
                    <img
                      src={topThree[1].contestant.photo}
                      alt={topThree[1].contestant.name}
                      className="w-16 sm:w-20 h-20 sm:h-24 rounded-lg object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-16 sm:w-20 h-20 sm:h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-2xl sm:text-3xl">👸</span>
                    </div>
                  )}
                </div>
                <div className="bg-gray-100 rounded-t-lg p-3 print:p-2 border-2 border-gray-300 h-28 sm:h-32 print:h-20 flex flex-col justify-end">
                  <div className="text-base sm:text-lg print:text-base font-bold mb-1 text-center">1ST RUNNER-UP</div>
                  <h3 className="text-xs sm:text-sm print:text-xs font-semibold text-gray-900 truncate">{topThree[1].contestant.name}</h3>
                  <p className="text-xs print:text-xs text-gray-600 truncate">{topThree[1].contestant.course}</p>
                  <div className="text-base sm:text-lg print:text-sm font-bold text-gray-700 print:text-gray-900">{topThree[1].score}</div>
                </div>
                <div className="bg-gray-200 h-16 sm:h-20 print:h-12 rounded-b-lg flex items-center justify-center">
                  <span className="text-xl sm:text-2xl print:text-lg font-bold text-gray-600">2</span>
                </div>
              </div>

              {/* 1st Place */}
              <div className="text-center order-1 sm:order-2">
                {/* Profile Picture - Hidden in print */}
                <div className="flex justify-center mb-4 print:hidden">
                  {topThree[0].contestant.photo ? (
                    <img
                      src={topThree[0].contestant.photo}
                      alt={topThree[0].contestant.name}
                      className="w-20 sm:w-24 h-24 sm:h-28 rounded-lg object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-20 sm:w-24 h-24 sm:h-28 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-3xl sm:text-4xl">👸</span>
                    </div>
                  )}
                </div>
                <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-t-lg p-3 sm:p-4 print:p-2 border-2 border-yellow-400 h-32 sm:h-36 print:h-24 flex flex-col justify-end">
                  <div className="text-lg sm:text-xl print:text-lg font-bold mb-1 text-center">WINNER</div>
                  <h3 className="text-sm sm:text-base print:text-sm font-semibold text-gray-900 truncate">{topThree[0].contestant.name}</h3>
                  <p className="text-xs sm:text-sm print:text-xs text-gray-600 truncate">{topThree[0].contestant.course}</p>
                  <div className="text-lg sm:text-xl print:text-base font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent print:text-yellow-800 print:bg-none">
                    {topThree[0].score}
                  </div>
                </div>
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-20 sm:h-24 print:h-16 rounded-b-lg flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl print:text-xl font-bold text-white">1</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="text-center order-3">
                {/* Profile Picture - Hidden in print */}
                <div className="flex justify-center mb-4 print:hidden">
                  {topThree[2].contestant.photo ? (
                    <img
                      src={topThree[2].contestant.photo}
                      alt={topThree[2].contestant.name}
                      className="w-16 sm:w-20 h-20 sm:h-24 rounded-lg object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-16 sm:w-20 h-20 sm:h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-2xl sm:text-3xl">👸</span>
                    </div>
                  )}
                </div>
                <div className="bg-orange-50 rounded-t-lg p-3 print:p-2 border-2 border-orange-300 h-28 sm:h-32 print:h-20 flex flex-col justify-end">
                  <div className="text-base sm:text-lg print:text-base font-bold mb-1 text-center">2ND RUNNER-UP</div>
                  <h3 className="text-xs sm:text-sm print:text-xs font-semibold text-gray-900 truncate">{topThree[2].contestant.name}</h3>
                  <p className="text-xs print:text-xs text-gray-600 truncate">{topThree[2].contestant.course}</p>
                  <div className="text-base sm:text-lg print:text-sm font-bold text-orange-700 print:text-orange-900">{topThree[2].score}</div>
                </div>
                <div className="bg-orange-200 h-16 sm:h-20 print:h-12 rounded-b-lg flex items-center justify-center">
                  <span className="text-xl sm:text-2xl print:text-lg font-bold text-orange-700">3</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Summary */}
        <div className="bg-white rounded-lg shadow-lg p-4 print:p-2 mb-4 print:mb-2 print:shadow-none print:border print:border-gray-300">
          <div className="flex items-center gap-3 mb-4 print:mb-2">
            <div className="w-10 h-10 print:w-8 print:h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl print:text-sm">📊</span>
            </div>
            <h2 className="text-xl print:text-lg font-bold text-gray-900">Statistics Summary</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {reportData.statistics.totalContestants}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Contestants</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {reportData.statistics.totalJudges}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Judges</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {reportData.statistics.completionPercentage}%
              </p>
              <p className="text-sm text-gray-600 mt-1">Completion Rate</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {reportData.statistics.averageTotalScore}
              </p>
              <p className="text-sm text-gray-600 mt-1">Average Score</p>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Categories:</span>
                <span className="ml-2 font-semibold">{reportData.statistics.totalCategories}</span>
              </div>
              <div>
                <span className="text-gray-500">Scores Submitted:</span>
                <span className="ml-2 font-semibold">{reportData.statistics.totalScoresSubmitted}/{reportData.statistics.totalPossibleSubmissions}</span>
              </div>
              <div>
                <span className="text-gray-500">Max Possible Score:</span>
                <span className="ml-2 font-semibold">{reportData.statistics.totalPossibleScore}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-right text-xs text-gray-500">
            Report Generated: {new Date(reportData.statistics.generatedAt).toLocaleString()}
          </div>
        </div>

        {/* Complete Rankings Table */}
        <div className="bg-white rounded-lg shadow-lg p-4 print:p-2 mb-4 print:mb-2 print:shadow-none print:border print:border-gray-300 print:break-inside-avoid">
          <div className="flex items-center gap-3 mb-4 print:mb-2">
            <div className="w-10 h-10 print:w-8 print:h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl print:text-sm">📈</span>
            </div>
            <h2 className="text-xl print:text-lg font-bold text-gray-900">Complete Rankings</h2>
          </div>
          
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden hidden sm:table-cell">Photo</th>
                <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Candidate</th>
                <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Course</th>
                <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Age</th>
                <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">%</th>
              </tr>
            </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.rankings.map((ranking, index) => {
                  const percentage = ((ranking.score / reportData.statistics.totalPossibleScore) * 100).toFixed(1);
                  const isTopThree = ranking.rank <= 3;
                  
                  return (
                    <tr key={ranking.contestantId} className={`hover:bg-gray-50 ${isTopThree ? 'bg-gradient-to-r from-yellow-50/50 to-transparent' : ''}`}>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10 rounded-full font-bold text-xs ${
                          ranking.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' :
                          ranking.rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                          ranking.rank === 3 ? 'bg-gradient-to-r from-orange-300 to-orange-400 text-white' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {ranking.rank === 1 ? 'WINNER' : ranking.rank === 2 ? '1ST RUNNER-UP' : ranking.rank === 3 ? '2ND RUNNER-UP' : `${ranking.rank - 1}TH RUNNER-UP`}
                        </div>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap print:hidden hidden sm:table-cell">
                        <div className="flex-shrink-0">
                          {ranking.contestant.photo ? (
                            <img
                              src={ranking.contestant.photo}
                              alt={ranking.contestant.name}
                              className="w-8 sm:w-12 h-10 sm:h-16 rounded-lg object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-8 sm:w-12 h-10 sm:h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg flex items-center justify-center border border-gray-200">
                              <span className="text-lg sm:text-xl">👸</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-xs sm:text-sm font-bold text-indigo-600">Candidate {ranking.number}</div>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{ranking.contestant.name}</div>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-xs sm:text-sm text-gray-600">{ranking.contestant.course}</div>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-center hidden xl:table-cell">
                        <div className="text-xs sm:text-sm text-gray-600">{ranking.contestant.age}</div>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-center">
                        <div className={`text-sm sm:text-lg font-bold ${isTopThree ? 'text-indigo-600' : 'text-gray-900'}`}>
                          {ranking.score}
                        </div>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-center hidden md:table-cell">
                        <div className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
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

        {/* Detailed Score Breakdown - Hidden in print for single page */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4 print:hidden">
          <div className="flex items-center gap-3 mb-4 print:mb-2">
            <div className="w-10 h-10 print:w-8 print:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl print:text-sm">📝</span>
            </div>
            <h2 className="text-xl print:text-lg font-bold text-gray-900">Detailed Score Breakdown</h2>
          </div>
          
          {reportData.detailedScores.map((contestantData, idx) => {
            const ranking = reportData.rankings.find(r => r.contestantId === contestantData.contestant.id);
            
            return (
              <div key={contestantData.contestant.id} className={`mb-8 ${idx > 0 ? 'pt-8 border-t-2 border-gray-200' : ''} print:break-inside-avoid`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                    {ranking && ranking.rank <= 3 && (
                      <span className="text-sm font-bold px-2 py-1 rounded bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800">
                        {ranking.rank === 1 ? 'WINNER' : ranking.rank === 2 ? '1ST RUNNER-UP' : '2ND RUNNER-UP'}
                      </span>
                    )}
                    {contestantData.contestant.name}
                    <span className="text-sm font-normal text-gray-600">
                      ({contestantData.contestant.course} - Year {contestantData.contestant.year})
                    </span>
                  </h3>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Score</p>
                    <p className="text-2xl font-bold text-indigo-600">{contestantData.totalScore}</p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Max</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Weight</th>
                        {reportData.judges.map(judge => (
                          <th key={judge.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                            {judge.name.split(' ')[0]}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-indigo-50">Avg</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-purple-50">Weighted</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contestantData.categoryScores.map((cat) => (
                        <tr key={cat.categoryId} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {cat.categoryName}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                            {cat.maxScore}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {(cat.weight * 100).toFixed(0)}%
                            </span>
                          </td>
                          {cat.judgeScores.map((judgeScore) => (
                            <td key={judgeScore.judgeId} className="px-4 py-4 whitespace-nowrap text-center text-sm">
                              {judgeScore.score !== null ? (
                                <span className="font-medium text-gray-900">{judgeScore.score}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          ))}
                          <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-semibold text-indigo-600 bg-indigo-50">
                            {cat.averageScore}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-bold text-purple-600 bg-purple-50">
                            {cat.weightedScore}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Judges Panel Information - Hidden in print for single page */}
        <div className="bg-white rounded-lg shadow-lg p-4 print:hidden">
          <div className="flex items-center gap-3 mb-4 print:mb-2">
            <div className="w-10 h-10 print:w-8 print:h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl print:text-sm">⚖️</span>
            </div>
            <h2 className="text-xl print:text-lg font-bold text-gray-900">Judges Panel</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportData.judges.map((judge) => (
              <div key={judge.id} className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 text-lg">{judge.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{judge.role}</p>
                {judge.user && (
                  <p className="text-sm text-gray-500 mt-2">
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {judge.user.email}
                    </span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Report Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 print:mt-12">
          <p>This is an official report generated by the Pageant Tabulation System</p>
          <p className="mt-1">Generated on {new Date(reportData.statistics.generatedAt).toLocaleString()}</p>
          <p className="mt-2 font-semibold">{reportData.event.name}</p>
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          body.printing {
            background: white !important;
            font-size: 12px !important;
            line-height: 1.2 !important;
          }

          /* Make everything fit on one page */
          html, body {
            height: auto !important;
            overflow: visible !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:shadow-none {
            box-shadow: none !important;
          }

          .print\\:bg-white {
            background-color: white !important;
          }

          .print\\:text-black {
            color: black !important;
          }

          .print\\:border {
            border-width: 1px !important;
          }

          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }

          .print\\:break-inside-avoid {
            break-inside: avoid !important;
          }

          .print\\:mt-12 {
            margin-top: 1rem !important;
          }

          .shadow-lg, .shadow {
            box-shadow: none !important;
          }

          .bg-gradient-to-r, .bg-gradient-to-br {
            background: white !important;
          }

          .text-white {
            color: black !important;
          }

          .bg-gradient-to-r.from-indigo-600.to-purple-600 {
            background: white !important;
            color: black !important;
          }

          /* Ensure score values are visible in print */
          .print\\:text-yellow-800 {
            color: rgb(154 52 18) !important;
            background: none !important;
            -webkit-text-fill-color: rgb(154 52 18) !important;
          }
          .print\\:text-gray-900 {
            color: rgb(17 24 39) !important;
            background: none !important;
            -webkit-text-fill-color: rgb(17 24 39) !important;
          }
          .print\\:text-orange-900 {
            color: rgb(124 45 18) !important;
            background: none !important;
            -webkit-text-fill-color: rgb(124 45 18) !important;
          }

          /* Compact spacing for single page */
          .mb-8, .mb-6, .mb-4, .mb-3, .mb-2 {
            margin-bottom: 0.5rem !important;
          }

          .mt-8, .mt-6, .mt-4, .mt-3, .mt-2 {
            margin-top: 0.5rem !important;
          }

          .py-8, .py-6, .py-4, .py-3, .py-2 {
            padding-top: 0.25rem !important;
            padding-bottom: 0.25rem !important;
          }

          .px-8, .px-6, .px-4, .px-3, .px-2 {
            padding-left: 0.25rem !important;
            padding-right: 0.25rem !important;
          }

          .p-8, .p-6, .p-4, .p-3, .p-2 {
            padding: 0.25rem !important;
          }

          /* Smaller text for tables */
          table {
            font-size: 10px !important;
          }

          th, td {
            padding: 4px 6px !important;
          }

          /* Compact header */
          header {
            padding: 1rem 0 !important;
          }

          h1 {
            font-size: 24px !important;
          }

          h2 {
            font-size: 18px !important;
          }

          h3 {
            font-size: 14px !important;
          }

          /* Reduce image sizes */
          img {
            max-height: 80px !important;
            max-width: 80px !important;
          }

          /* Compact grid layouts */
          .grid-cols-3 {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.25rem !important;
          }

          .grid-cols-2 {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.25rem !important;
          }

          .grid-cols-4 {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 0.125rem !important;
          }

          /* Compact spacing for all elements */
          .gap-6 {
            gap: 0.5rem !important;
          }

          .gap-4 {
            gap: 0.25rem !important;
          }

          .gap-3 {
            gap: 0.125rem !important;
          }

          /* Reduce podium dimensions */
          .min-height-120px {
            min-height: 80px !important;
          }

          /* Ensure no page breaks inside sections */
          .print\\:break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Compact table cells */
          tbody tr {
            height: 24px !important;
          }

          /* Smaller font sizes for all text */
          .text-xs { font-size: 9px !important; }
          .text-sm { font-size: 10px !important; }
          .text-base { font-size: 11px !important; }
          .text-lg { font-size: 12px !important; }
          .text-xl { font-size: 14px !important; }
          .text-2xl { font-size: 16px !important; }
          .text-3xl { font-size: 18px !important; }
          .text-4xl { font-size: 20px !important; }

          /* Force single page layout */
          html, body {
            height: 100% !important;
            max-height: 100% !important;
            overflow: visible !important;
          }

          /* Ensure report container fits on one page */
          .report-container {
            max-height: 100vh !important;
            height: 100vh !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Scale down all elements proportionally for single page */
          * {
            transform-origin: top left !important;
          }

          /* Reduce line heights for more compact text */
          p, div, span, h1, h2, h3, h4, h5, h6 {
            line-height: 1.1 !important;
          }

          /* Reduce podium heights */
          .h-56, .h-48, .h-40 {
            height: auto !important;
            min-height: 120px !important;
          }

          /* Compact main content */
          main {
            padding: 0.5rem 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
