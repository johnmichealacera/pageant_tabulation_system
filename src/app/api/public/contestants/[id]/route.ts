import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const contestant = await prisma.contestant.findUnique({
    where: { id: params.id },
    include: {
      pageantEvent: { select: { id: true, name: true, isActive: true } },
    },
  });

  if (!contestant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    ...contestant,
    achievements: contestant.achievements ? JSON.parse(contestant.achievements) : [],
    socialLinks:  contestant.socialLinks  ? JSON.parse(contestant.socialLinks)  : {},
    gallery:      contestant.gallery      ? JSON.parse(contestant.gallery)       : [],
  });
}
