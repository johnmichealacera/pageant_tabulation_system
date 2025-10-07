import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { contestantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;
    if (!session || userRole !== 'Judge') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the judge profile for this user
    const judge = await prisma.judge.findFirst({
      where: {
        userId,
        pageantEvent: {
          isActive: true,
        },
      },
    });

    if (!judge) {
      return NextResponse.json({ error: 'Judge profile not found' }, { status: 404 });
    }

    // Get contestant data
    const contestant = await prisma.contestant.findFirst({
      where: {
        id: params.contestantId,
        pageantEventId: judge.pageantEventId,
      },
    });

    if (!contestant) {
      return NextResponse.json({ error: 'Contestant not found' }, { status: 404 });
    }

    // Get categories for this event
    const categories = await prisma.category.findMany({
      where: {
        pageantEventId: judge.pageantEventId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get existing scores for this judge and contestant
    const existingScores = await prisma.score.findMany({
      where: {
        judgeId: judge.id,
        contestantId: params.contestantId,
      },
      select: {
        categoryId: true,
        score: true,
      },
    });

    return NextResponse.json({
      contestant,
      categories,
      existingScores,
      judgeId: judge.id,
    });
  } catch (error) {
    console.error('Error fetching contestant data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
