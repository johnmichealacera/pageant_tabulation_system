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
    const { name, age, course, year, photo } = body;

    if (!name || !age || !course || !year) {
      return NextResponse.json({ error: 'Name, age, course, and year are required' }, { status: 400 });
    }

    // Verify event exists
    const event = await prisma.pageantEvent.findUnique({
      where: { id: params.id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const contestant = await prisma.contestant.create({
      data: {
        name,
        age: parseInt(age),
        course,
        year,
        photo: photo || null,
        pageantEventId: params.id,
      },
    });

    return NextResponse.json(contestant);
  } catch (error) {
    console.error('Error creating contestant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
