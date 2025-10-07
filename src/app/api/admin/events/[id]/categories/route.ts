import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, maxScore, weight } = body;

    if (!name || !maxScore || !weight) {
      return NextResponse.json({ error: 'Name, max score, and weight are required' }, { status: 400 });
    }

    if (weight < 0 || weight > 1) {
      return NextResponse.json({ error: 'Weight must be between 0 and 1' }, { status: 400 });
    }

    // Verify event exists
    const event = await prisma.pageantEvent.findUnique({
      where: { id: params.id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        maxScore: parseInt(maxScore),
        weight: parseFloat(weight),
        pageantEventId: params.id,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
