import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const activeEvent = await prisma.pageantEvent.findFirst({
      where: { isActive: true },
      include: {
        contestants: true,
        judges: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        categories: true,
        scores: {
          include: {
            contestant: true,
            category: true,
            judge: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!activeEvent) {
      return NextResponse.json({ error: 'No active event found' }, { status: 404 });
    }

    // Calculate rankings
    const contestantScores: { [key: string]: number } = {};
    
    activeEvent.contestants.forEach((contestant: any) => {
      let totalScore = 0;
      
      activeEvent.categories.forEach((category: any) => {
        const categoryScores = activeEvent.scores.filter(
          (score: any) => score.contestantId === contestant.id && score.categoryId === category.id
        );
        
        if (categoryScores.length > 0) {
          const averageScore = categoryScores.reduce((sum: any, score: any) => sum + score.score, 0) / categoryScores.length;
          totalScore += averageScore * category.weight;
        }
      });
      
      contestantScores[contestant.id] = Math.round(totalScore * 100) / 100;
    });

    const rankings = Object.entries(contestantScores)
      .map(([contestantId, score]) => ({
        contestantId,
        score,
        contestant: activeEvent.contestants.find((c: any) => c.id === contestantId)
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));

    return NextResponse.json({
      event: activeEvent,
      rankings,
      totalScores: contestantScores,
    });
  } catch (error) {
    console.error('Error fetching active event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
