import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { contestantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'JUDGE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { scores } = body;

    if (!scores || typeof scores !== 'object') {
      return NextResponse.json({ error: 'Scores are required' }, { status: 400 });
    }

    // Find the judge profile for this user
    const judge = await prisma.judge.findFirst({
      where: {
        userId: (session?.user as any)?.id,
        pageantEvent: {
          isActive: true,
        },
      },
    });

    if (!judge) {
      return NextResponse.json({ error: 'Judge profile not found' }, { status: 404 });
    }

    // Verify contestant exists and belongs to the same event
    const contestant = await prisma.contestant.findFirst({
      where: {
        id: params.contestantId,
        pageantEventId: judge.pageantEventId,
      },
    });

    if (!contestant) {
      return NextResponse.json({ error: 'Contestant not found' }, { status: 404 });
    }

    // Get categories for validation
    const categories = await prisma.category.findMany({
      where: {
        pageantEventId: judge.pageantEventId,
      },
    });

    // Validate scores
    for (const [categoryId, score] of Object.entries(scores)) {
      const category = categories.find((c: any) => c.id === categoryId);
      if (!category) {
        return NextResponse.json({ error: `Invalid category: ${categoryId}` }, { status: 400 });
      }
      
      const numScore = Number(score);
      if (isNaN(numScore) || numScore < 0 || numScore > category.maxScore) {
        return NextResponse.json({ 
          error: `Invalid score for ${category.name}: must be between 0 and ${category.maxScore}` 
        }, { status: 400 });
      }
    }

    // Use transaction to update/create scores
    await prisma.$transaction(async (tx: any) => {
      // Delete existing scores for this judge and contestant
      await tx.score.deleteMany({
        where: {
          judgeId: judge.id,
          contestantId: params.contestantId,
        },
      });

      // Create new scores
      const scoreData = Object.entries(scores).map(([categoryId, score]) => ({
        judgeId: judge.id,
        contestantId: params.contestantId,
        categoryId,
        score: Number(score),
        pageantEventId: judge.pageantEventId,
      }));

      await tx.score.createMany({
        data: scoreData,
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving scores:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
