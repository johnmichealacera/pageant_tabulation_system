import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((s, v) => s + v, 0) / values.length;
}

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
      contestants: { orderBy: { name: 'asc' } },
      judges:      { select: { id: true, name: true, role: true } },
      categories:  true,
      scores:      true,
    },
  });

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { contestants, judges, categories, scores } = event;

  // ── Heatmap ──────────────────────────────────────────────────────────────
  const heatmap = contestants.map((c, idx) => ({
    contestantId:     c.id,
    contestantName:   c.name,
    contestantNumber: idx + 1,
    cells: categories.map(cat => {
      const catScores = scores.filter(s => s.contestantId === c.id && s.categoryId === cat.id);
      const avg = catScores.length > 0 ? mean(catScores.map(s => s.score)) : null;
      return {
        categoryId:   cat.id,
        categoryName: cat.name,
        avgScore:     avg !== null ? Math.round(avg * 10) / 10 : null,
        maxScore:     cat.maxScore,
        pct:          avg !== null ? Math.round((avg / cat.maxScore) * 100) : null,
        judgeCount:   catScores.length,
      };
    }),
  }));

  // ── Category stats ────────────────────────────────────────────────────────
  const categoryStats = categories.map(cat => {
    const catScores = scores.filter(s => s.categoryId === cat.id).map(s => s.score);
    const avg = catScores.length > 0 ? mean(catScores) : 0;
    return {
      categoryId:   cat.id,
      name:         cat.name,
      maxScore:     cat.maxScore,
      weight:       cat.weight,
      avgScore:     Math.round(avg * 10) / 10,
      avgPct:       cat.maxScore > 0 ? Math.round((avg / cat.maxScore) * 100) : 0,
      highestScore: catScores.length ? Math.max(...catScores) : 0,
      lowestScore:  catScores.length ? Math.min(...catScores) : 0,
      stdDev:       Math.round(stdDev(catScores) * 100) / 100,
      scoreCount:   catScores.length,
    };
  });

  // ── Judge consistency ─────────────────────────────────────────────────────
  const judgeConsistency = judges.map((j, idx) => {
    const judgeScores = scores.filter(s => s.judgeId === j.id).map(s => s.score);
    const avg = judgeScores.length > 0 ? mean(judgeScores) : 0;
    const sd  = stdDev(judgeScores);
    return {
      judgeId:    j.id,
      name:       `Judge ${idx + 1}`,
      role:       j.role,
      avgScore:   Math.round(avg * 10) / 10,
      stdDev:     Math.round(sd * 100) / 100,
      minScore:   judgeScores.length ? Math.min(...judgeScores) : 0,
      maxScore:   judgeScores.length ? Math.max(...judgeScores) : 0,
      scoreCount: judgeScores.length,
      // Bias: positive = lenient (above overall avg), negative = harsh
      bias:       0, // filled below
    };
  });

  const allScoreValues = scores.map(s => s.score);
  const overallAvg = allScoreValues.length > 0 ? mean(allScoreValues) : 0;
  judgeConsistency.forEach(j => {
    j.bias = Math.round((j.avgScore - overallAvg) * 100) / 100;
  });

  // ── Anomaly detection (Z-score per category) ──────────────────────────────
  const anomalies: Array<{
    judgeId: string; judgeName: string;
    contestantId: string; contestantName: string;
    categoryId: string; categoryName: string;
    score: number; categoryAvg: number; zScore: number;
    type: 'high' | 'low';
  }> = [];

  for (const cat of categories) {
    const catScores = scores.filter(s => s.categoryId === cat.id);
    const vals = catScores.map(s => s.score);
    if (vals.length < 3) continue; // need enough data for Z-score to be meaningful
    const avg = mean(vals);
    const sd  = stdDev(vals);
    if (sd === 0) continue;

    for (const score of catScores) {
      const z = (score.score - avg) / sd;
      if (Math.abs(z) >= 1.75) {
        const judge     = judges.findIndex(j => j.id === score.judgeId);
        const contestant = contestants.find(c => c.id === score.contestantId);
        anomalies.push({
          judgeId:       score.judgeId,
          judgeName:     judge >= 0 ? `Judge ${judge + 1}` : 'Unknown',
          contestantId:  score.contestantId,
          contestantName: contestant?.name ?? 'Unknown',
          categoryId:    cat.id,
          categoryName:  cat.name,
          score:         score.score,
          categoryAvg:   Math.round(avg * 10) / 10,
          zScore:        Math.round(z * 100) / 100,
          type:          z > 0 ? 'high' : 'low',
        });
      }
    }
  }

  // Sort anomalies by |z| descending
  anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));

  // ── Overview ─────────────────────────────────────────────────────────────
  const totalScored   = scores.length;
  const totalPossible = contestants.length * judges.length * categories.length;
  const rankingScores = contestants.map(c => {
    let total = 0;
    for (const cat of categories) {
      const cs = scores.filter(s => s.contestantId === c.id && s.categoryId === cat.id);
      if (cs.length > 0) total += mean(cs.map(s => s.score)) * cat.weight;
    }
    return total;
  }).filter(s => s > 0);

  return NextResponse.json({
    heatmap,
    categoryStats,
    judgeConsistency,
    anomalies,
    overview: {
      totalContestants: contestants.length,
      totalJudges:      judges.length,
      totalCategories:  categories.length,
      topScore:         rankingScores.length ? Math.round(Math.max(...rankingScores) * 100) / 100 : 0,
      avgScore:         rankingScores.length ? Math.round(mean(rankingScores) * 100) / 100 : 0,
      completionPct:    totalPossible > 0 ? Math.round((totalScored / totalPossible) * 100) : 0,
      anomalyCount:     anomalies.length,
    },
  });
}
