import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const events = await prisma.pageantEvent.findMany({
      include: {
        _count: {
          select: {
            contestants: true,
            judges: true,
            categories: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, eventDate } = body;

    if (!name || !eventDate) {
      return NextResponse.json({ error: 'Name and event date are required' }, { status: 400 });
    }

    // Deactivate all other events
    await prisma.pageantEvent.updateMany({
      data: { isActive: false },
    });

    const event = await prisma.pageantEvent.create({
      data: {
        name,
        description: description || '',
        eventDate: new Date(eventDate),
        isActive: true,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
