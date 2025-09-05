import { mockScores, mockCategories, mockContestants, mockJudges } from '@/lib/data';

export default function ScoreTable() {
  // Group scores by contestant and category
  const scoreData = mockContestants.map(contestant => {
    const contestantScores = mockCategories.map(category => {
      const categoryScores = mockScores.filter(
        score => score.contestantId === contestant.id && score.categoryId === category.id
      );
      
      const judgeScores = mockJudges.map(judge => {
        const judgeScore = categoryScores.find(score => score.judgeId === judge.id);
        return judgeScore ? judgeScore.score : 0;
      });
      
      const averageScore = categoryScores.length > 0 
        ? categoryScores.reduce((sum, score) => sum + score.score, 0) / categoryScores.length 
        : 0;
      
      return {
        category,
        judgeScores,
        averageScore: Math.round(averageScore * 100) / 100
      };
    });
    
    return {
      contestant,
      scores: contestantScores
    };
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead>
          <tr className="table-header">
            <th className="px-6 py-3 text-left">Contestant</th>
            {mockCategories.map(category => (
              <th key={category.id} className="px-4 py-3 text-center">
                {category.name}
                <br />
                <span className="text-xs font-normal">(Max: {category.maxScore})</span>
              </th>
            ))}
            <th className="px-6 py-3 text-center">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {scoreData.map(({ contestant, scores }) => (
            <tr key={contestant.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{contestant.name}</div>
                  <div className="text-sm text-gray-500">{contestant.course}</div>
                </div>
              </td>
              {scores.map(({ category, judgeScores, averageScore }) => (
                <td key={category.id} className="px-4 py-4 text-center">
                  <div className="text-lg font-semibold text-primary-600">{averageScore}</div>
                  <div className="text-xs text-gray-500">
                    {judgeScores.join(' | ')}
                  </div>
                </td>
              ))}
              <td className="px-6 py-4 text-center">
                <div className="text-lg font-bold text-gray-900">
                  {scores.reduce((sum, { averageScore }) => sum + averageScore, 0).toFixed(1)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
