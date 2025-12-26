import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.pageantEvent.findUnique({
      where: { id: params.id },
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

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' }, 
        { 
          status: 404,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          }
        }
      );
    }

    // Calculate rankings
    const contestantScores: { [key: string]: number } = {};

    // First, assign contestant numbers based on alphabetical order (same as public display)
    const contestantsWithNumbers = event.contestants
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
      .map((contestant: any, index: number) => ({
        ...contestant,
        number: index + 1
      }));

    event.contestants.forEach((contestant: any) => {
      let totalScore = 0;

      event.categories.forEach((category: any) => {
        const categoryScores = event.scores.filter(
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
      .map(([contestantId, score]) => {
        const contestant = contestantsWithNumbers.find((c: any) => c.id === contestantId);
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

    // Anonymize judges for privacy in public view
    const anonymizedEvent = {
      ...event,
      judges: event.judges.map((judge, index) => ({
        id: judge.id,
        name: `Judge ${index + 1}`, // Anonymous labeling
        role: judge.role,
      })),
    };

    return NextResponse.json({
      event: anonymizedEvent,
      rankings,
      totalScores: contestantScores,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        }
      }
    );
  }
}

