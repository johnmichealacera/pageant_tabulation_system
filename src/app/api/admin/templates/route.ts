import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const templates = await prisma.eventTemplate.findMany({
    include: { categories: { orderBy: { weight: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, description, categories } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
  }
  if (!Array.isArray(categories) || categories.length === 0) {
    return NextResponse.json({ error: 'At least one category is required' }, { status: 400 });
  }

  const template = await prisma.eventTemplate.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      categories: {
        create: categories.map((c: { name: string; maxScore: number; weight: number }) => ({
          name: c.name,
          maxScore: Number(c.maxScore),
          weight: Number(c.weight),
        })),
      },
    },
    include: { categories: true },
  });

  return NextResponse.json(template, { status: 201 });
}
