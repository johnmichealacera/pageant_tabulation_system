interface Contestant {
  id: string | number;
  name: string;
  age: number;
  course: string;
  year: string;
  photo?: string;
}

interface Category {
  id: string | number;
  name: string;
  maxScore: number;
  weight: number;
}

interface CategoryBreakdownProps {
  contestants: Contestant[];
  categories: Category[];
  totalScores: { [key: string | number]: number };
}

export default function CategoryBreakdown({ contestants, categories, totalScores }: CategoryBreakdownProps) {
  return (
    <div className="space-y-6">
      {/* Category Performance Chart */}
      <div className="card">
        <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-4">Category Performance Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => {
            const categoryScores = contestants.map(contestant => {
              const baseScore = totalScores[contestant.id] || 0;
              return baseScore * category.weight;
            });
            const averageScore = categoryScores.length
              ? categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length
              : 0;
            const percentage = category.maxScore > 0
              ? ((averageScore / category.maxScore) * 100).toFixed(1)
              : '0.0';

            return (
              <div key={category.id} className="p-3 sm:p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-base)]">
                <h4 className="font-medium text-[var(--text-primary)] mb-2 text-sm break-words">{category.name}</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-gold-500">{averageScore.toFixed(1)}</div>
                    <div className="text-xs text-[var(--text-muted)]">Avg Score</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">{percentage}%</div>
                    <div className="text-xs text-[var(--text-muted)]">of Max</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-[var(--bg-muted)] rounded-full h-2">
                    <div
                      className="bg-gold-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contestant Performance by Category */}
      <div className="card overflow-hidden">
        <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-4">Contestant Performance by Category</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: '500px' }}>
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left whitespace-nowrap">Contestant</th>
                {categories.map(category => (
                  <th key={category.id} className="px-3 py-3 text-center">
                    <div className="text-xs font-semibold whitespace-nowrap">
                      {category.name}
                    </div>
                    <div className="text-xs font-normal text-[var(--text-muted)]">({(category.weight * 100).toFixed(0)}%)</div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center whitespace-nowrap">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {contestants.map((contestant) => {
                const contestantScore = totalScores[contestant.id] || 0;
                const categoryBreakdown = categories.map(category => ({
                  category,
                  score: contestantScore * category.weight,
                  percentage: category.maxScore > 0
                    ? ((contestantScore * category.weight / category.maxScore) * 100).toFixed(1)
                    : '0.0',
                }));

                return (
                  <tr key={contestant.id} className="hover:bg-[var(--bg-muted)] transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-[var(--text-primary)]">{contestant.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{contestant.course}</div>
                    </td>
                    {categoryBreakdown.map(({ category, score, percentage }) => (
                      <td key={category.id} className="px-3 py-3 text-center">
                        <div className="text-base font-semibold text-gold-500">{score.toFixed(1)}</div>
                        <div className="text-xs text-[var(--text-muted)]">{percentage}%</div>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      <div className="text-base font-bold text-[var(--text-primary)]">{contestantScore.toFixed(1)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Contestants', value: contestants.length },
          { label: 'Categories', value: categories.length },
          {
            label: 'Average Score',
            value: Object.keys(totalScores).length > 0
              ? (Object.values(totalScores).reduce((s, v) => s + v, 0) / Object.keys(totalScores).length).toFixed(1)
              : '—',
          },
        ].map(stat => (
          <div key={stat.label} className="card text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gold-500">{stat.value}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
