import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch complete event data with all relationships
    const event = await prisma.pageantEvent.findUnique({
      where: { id: params.id },
      include: {
        contestants: {
          orderBy: { name: 'asc' }
        },
        judges: {
          orderBy: { name: 'asc' },
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        categories: {
          orderBy: { createdAt: 'asc' }
        },
        scores: {
          include: {
            contestant: true,
            category: true,
            judge: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Calculate rankings
    const contestantScores: { [key: string]: number } = {};

    // First, assign contestant numbers based on alphabetical order (same as public display)
    const contestantsWithNumbers = event.contestants
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((contestant, index) => ({
        ...contestant,
        number: index + 1
      }));

    event.contestants.forEach((contestant) => {
      let totalScore = 0;

      event.categories.forEach((category) => {
        const categoryScores = event.scores.filter(
          (score) => score.contestantId === contestant.id && score.categoryId === category.id
        );

        if (categoryScores.length > 0) {
          const averageScore = categoryScores.reduce((sum, score) => sum + score.score, 0) / categoryScores.length;
          totalScore += averageScore * category.weight;
        }
      });

      contestantScores[contestant.id] = Math.round(totalScore * 100) / 100;
    });

    const rankings = Object.entries(contestantScores)
      .map(([contestantId, score]) => {
        const contestant = contestantsWithNumbers.find((c) => c.id === contestantId);
        return {
          contestantId,
          score,
          contestant,
          number: contestant?.number || 0
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));

    // Calculate detailed scores for each contestant by category
    const detailedScores = event.contestants.map(contestant => {
      const categoryScores = event.categories.map(category => {
        const scores = event.scores.filter(
          s => s.contestantId === contestant.id && s.categoryId === category.id
        );

        const judgeScores = event.judges.map((judge, judgeIndex) => {
          const judgeScore = scores.find(s => s.judgeId === judge.id);
          return {
            judgeId: judge.id,
            judgeName: `Judge ${judgeIndex + 1}`, // Anonymous judge labeling
            score: judgeScore ? judgeScore.score : null
          };
        });
        
        const averageScore = scores.length > 0
          ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
          : 0;
        
        const weightedScore = averageScore * category.weight;
        
        return {
          categoryId: category.id,
          categoryName: category.name,
          maxScore: category.maxScore,
          weight: category.weight,
          judgeScores,
          averageScore: Math.round(averageScore * 100) / 100,
          weightedScore: Math.round(weightedScore * 100) / 100
        };
      });
      
      return {
        contestant,
        categoryScores,
        totalScore: contestantScores[contestant.id] || 0
      };
    });

    // Statistics
    const totalPossibleScore = event.categories.reduce((sum, cat) => sum + cat.maxScore, 0);
    const averageTotalScore = Object.values(contestantScores).length > 0
      ? Object.values(contestantScores).reduce((sum, score) => sum + score, 0) / Object.values(contestantScores).length
      : 0;
    
    const totalScoresSubmitted = event.scores.length;
    const totalPossibleSubmissions = event.contestants.length * event.categories.length * event.judges.length;
    const completionPercentage = totalPossibleSubmissions > 0
      ? Math.round((totalScoresSubmitted / totalPossibleSubmissions) * 100)
      : 0;

    // Anonymize judges for privacy
    const anonymousJudges = event.judges.map((judge, index) => ({
      id: judge.id,
      name: `Judge ${index + 1}`, // Anonymous labeling
      role: judge.role,
      // Remove user email for privacy
    }));

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        eventDate: event.eventDate,
        isActive: event.isActive,
      },
      contestants: event.contestants,
      judges: anonymousJudges,
      categories: event.categories,
      rankings,
      detailedScores,
      statistics: {
        totalContestants: event.contestants.length,
        totalJudges: event.judges.length,
        totalCategories: event.categories.length,
        totalPossibleScore,
        averageTotalScore: Math.round(averageTotalScore * 100) / 100,
        totalScoresSubmitted,
        totalPossibleSubmissions,
        completionPercentage,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

