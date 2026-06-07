import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const template = await prisma.eventTemplate.findUnique({
    where: { id: params.id },
    include: { categories: { orderBy: { weight: 'desc' } } },
  });

  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(template);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, description, categories } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
  }

  // Replace all categories atomically
  await prisma.templateCategory.deleteMany({ where: { templateId: params.id } });

  const template = await prisma.eventTemplate.update({
    where: { id: params.id },
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      categories: {
        create: (categories ?? []).map((c: { name: string; maxScore: number; weight: number }) => ({
          name: c.name,
          maxScore: Number(c.maxScore),
          weight: Number(c.weight),
        })),
      },
    },
    include: { categories: true },
  });

  return NextResponse.json(template);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.eventTemplate.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
