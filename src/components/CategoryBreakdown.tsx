import { Contestant, Category } from '@/lib/data';

interface CategoryBreakdownProps {
  contestants: Contestant[];
  categories: Category[];
  totalScores: { [key: number]: number };
}

export default function CategoryBreakdown({ contestants, categories, totalScores }: CategoryBreakdownProps) {
  return (
    <div className="space-y-6">
      {/* Category Performance Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => {
            // Calculate average score for this category across all contestants
            const categoryScores = contestants.map(contestant => {
              // This is a simplified calculation - in a real app you'd get actual scores
              const baseScore = totalScores[contestant.id] || 0;
              const categoryWeight = category.weight;
              return (baseScore * categoryWeight);
            });
            
            const averageScore = categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length;
            const percentage = ((averageScore / category.maxScore) * 100).toFixed(1);
            
            return (
              <div key={category.id} className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{category.name}</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-primary-600">{averageScore.toFixed(1)}</div>
                    <div className="text-sm text-gray-500">Avg Score</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">{percentage}%</div>
                    <div className="text-sm text-gray-500">of Max</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contestant Performance by Category */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contestant Performance by Category</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">Contestant</th>
                {categories.map(category => (
                  <th key={category.id} className="px-4 py-3 text-center">
                    {category.name}
                    <br />
                    <span className="text-xs font-normal">({(category.weight * 100).toFixed(0)}%)</span>
                  </th>
                ))}
                <th className="px-6 py-3 text-center">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contestants.map((contestant) => {
                const contestantScore = totalScores[contestant.id] || 0;
                const categoryBreakdown = categories.map(category => {
                  const categoryScore = contestantScore * category.weight;
                  return {
                    category,
                    score: categoryScore,
                    percentage: ((categoryScore / category.maxScore) * 100).toFixed(1)
                  };
                });
                
                return (
                  <tr key={contestant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{contestant.name}</div>
                        <div className="text-sm text-gray-500">{contestant.course}</div>
                      </div>
                    </td>
                    {categoryBreakdown.map(({ category, score, percentage }) => (
                      <td key={category.id} className="px-4 py-4 text-center">
                        <div className="text-lg font-semibold text-primary-600">{score.toFixed(1)}</div>
                        <div className="text-xs text-gray-500">{percentage}%</div>
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center">
                      <div className="text-lg font-bold text-gray-900">{contestantScore.toFixed(1)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">
            {contestants.length}
          </div>
          <div className="text-sm text-gray-500">Total Contestants</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">
            {categories.length}
          </div>
          <div className="text-sm text-gray-500">Categories</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">
            {Object.values(totalScores).reduce((sum, score) => sum + score, 0) / Object.keys(totalScores).length}
          </div>
          <div className="text-sm text-gray-500">Average Score</div>
        </div>
      </div>
    </div>
  );
}
