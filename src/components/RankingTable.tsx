interface Ranking {
  contestantId: string;
  score: number;
  contestant: any;
  rank: number;
}

interface RankingTableProps {
  rankings: Ranking[];
}

export default function RankingTable({ rankings }: RankingTableProps) {
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
    <div className="space-y-6">
      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rankings.slice(0, 3).map((ranking, index) => (
          <div key={ranking.contestantId} className="card text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-2 mb-4 ${getRankColor(ranking.rank)}`}>
              <span className="text-2xl">{getRankIcon(ranking.rank)}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{ranking.contestant.name}</h3>
            <p className="text-gray-600 mb-2">{ranking.contestant.course}</p>
            <div className="text-3xl font-bold text-primary-600">{ranking.score}</div>
            <p className="text-sm text-gray-500">Total Score</p>
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
                <th className="px-6 py-3 text-left">Contestant</th>
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
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankColor(ranking.rank)}`}>
                        {getRankIcon(ranking.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ranking.contestant.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{ranking.contestant.course}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-lg font-bold text-primary-600">{ranking.score}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-600">{percentage}%</div>
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
