import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { templateId, replace } = await request.json();

  if (!templateId) {
    return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
  }

  const [event, template] = await Promise.all([
    prisma.pageantEvent.findUnique({ where: { id: params.id }, include: { _count: { select: { scores: true } } } }),
    prisma.eventTemplate.findUnique({ where: { id: templateId }, include: { categories: true } }),
  ]);

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

  // If replace=true, delete existing categories only if no scores exist
  if (replace) {
    if (event._count.scores > 0) {
      return NextResponse.json(
        { error: 'Cannot replace categories — scores already exist for this event.' },
        { status: 409 }
      );
    }
    await prisma.category.deleteMany({ where: { pageantEventId: params.id } });
  }

  const created = await prisma.$transaction(
    template.categories.map((tc: { name: string; maxScore: number; weight: number }) =>
      prisma.category.create({
        data: {
          name: tc.name,
          maxScore: tc.maxScore,
          weight: tc.weight,
          pageantEventId: params.id,
        },
      })
    )
  );

  return NextResponse.json({ created: created.length }, { status: 201 });
}
