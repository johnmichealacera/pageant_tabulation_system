interface Ranking {
  contestantId: string;
  score: number;
  contestant: any;
  rank: number;
  number: number;
}

interface RankingTableProps {
  rankings: Ranking[];
}

export default function RankingTable({ rankings }: RankingTableProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return 'WINNER';
      case 2: return '1ST RUNNER-UP';
      case 3: return '2ND RUNNER-UP';
      default: return `${rank - 1}TH RUNNER-UP`;
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
    <div className="space-y-6">
      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rankings.slice(0, 3).map((ranking, index) => (
          <div key={ranking.contestantId} className="card text-center">
            {/* Profile Picture */}
            <div className="flex justify-center mb-4">
              {ranking.contestant.photo ? (
                <img
                  src={ranking.contestant.photo}
                  alt={ranking.contestant.name}
                  className="w-20 h-24 rounded-lg object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-20 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-3xl">👸</span>
                </div>
              )}
            </div>

            {/* Rank Icon */}
            <div className={`inline-flex items-center justify-center w-24 h-16 rounded-full border-2 mb-3 px-2 ${getRankColor(ranking.rank)}`}>
              <span className="text-xs font-bold text-center leading-tight">{getRankIcon(ranking.rank)}</span>
            </div>

            {/* Candidate Number */}
            <div className="text-lg font-bold text-indigo-600 mb-1">
              Candidate {ranking.number}
            </div>

            {/* Name */}
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{ranking.contestant.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{ranking.contestant.course}</p>
            <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{ranking.score}</div>
            <p className="text-xs text-gray-500">Total Score</p>
          </div>
        ))}
      </div>

      {/* Full Rankings Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Rankings</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">Rank</th>
                <th className="px-6 py-3 text-left">Photo</th>
                <th className="px-6 py-3 text-left">Candidate</th>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Course</th>
                <th className="px-6 py-3 text-center">Total Score</th>
                <th className="px-6 py-3 text-center">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rankings.map((ranking) => {
                const percentage = ((ranking.score / 100) * 100).toFixed(1);
                return (
                  <tr key={ranking.contestantId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center justify-center w-20 h-8 rounded-full text-xs font-bold px-2 ${getRankColor(ranking.rank)}`}>
                        {getRankIcon(ranking.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex-shrink-0">
                        {ranking.contestant.photo ? (
                          <img
                            src={ranking.contestant.photo}
                            alt={ranking.contestant.name}
                            className="w-12 h-16 rounded-lg object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg flex items-center justify-center border border-gray-200">
                            <span className="text-xl">👸</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-indigo-600">Candidate {ranking.number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ranking.contestant.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{ranking.contestant.course}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{ranking.score}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
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
    </div>
  );
}
