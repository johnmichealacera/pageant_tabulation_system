import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const event = await prisma.pageantEvent.findUnique({
    where: { id: params.id },
    include: {
      judges: { select: { id: true, name: true, role: true } },
      contestants: { select: { id: true } },
      scores: { select: { judgeId: true, contestantId: true, categoryId: true } },
      categories: { select: { id: true } },
    },
  });

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const totalContestants = event.contestants.length;
  const totalCategories  = event.categories.length;
  const scoresPerJudge   = totalContestants * totalCategories;

  const judgeProgress = event.judges.map((judge, index) => {
    const judgeScores   = event.scores.filter(s => s.judgeId === judge.id);
    // Count distinct contestants scored (at least 1 category)
    const contestantsDone = new Set(judgeScores.map(s => s.contestantId)).size;
    const totalScored     = judgeScores.length;
    const pct = scoresPerJudge > 0 ? Math.round((totalScored / scoresPerJudge) * 100) : 0;

    return {
      judgeId: judge.id,
      name: `Judge ${index + 1}`,
      role: judge.role,
      contestantsDone,
      totalContestants,
      totalScored,
      totalPossible: scoresPerJudge,
      percentage: pct,
    };
  });

  const overallScored   = event.scores.length;
  const overallPossible = event.judges.length * scoresPerJudge;
  const overallPct      = overallPossible > 0 ? Math.round((overallScored / overallPossible) * 100) : 0;

  return NextResponse.json({
    judgeProgress,
    overall: {
      scored: overallScored,
      possible: overallPossible,
      percentage: overallPct,
    },
  });
}
