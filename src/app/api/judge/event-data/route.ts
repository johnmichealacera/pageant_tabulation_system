import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the judge profile for this user
    const judge = await prisma.judge.findFirst({
      where: {
        userId: (session?.user as any)?.id,
        pageantEvent: {
          isActive: true,
        },
      },
      include: {
        pageantEvent: {
          include: {
            contestants: true,
            categories: true,
          },
        },
      },
    });

    if (!judge) {
      return NextResponse.json({ error: 'No active event found or you are not assigned as a judge' }, { status: 404 });
    }

    // Get existing scores for this judge
    const scores = await prisma.score.findMany({
      where: {
        judgeId: judge.id,
        pageantEventId: judge.pageantEventId,
      },
      select: {
        contestantId: true,
        categoryId: true,
        score: true,
      },
    });

    return NextResponse.json({
      event: judge.pageantEvent,
      judgeId: judge.id,
      scores,
    });
  } catch (error) {
    console.error('Error fetching judge event data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
