import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; contestantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contestant = await prisma.contestant.findUnique({
      where: { id: params.contestantId },
    });

    if (!contestant) {
      return NextResponse.json({ error: 'Contestant not found' }, { status: 404 });
    }

    // Verify contestant belongs to the event
    if (contestant.pageantEventId !== params.id) {
      return NextResponse.json({ error: 'Contestant does not belong to this event' }, { status: 400 });
    }

    return NextResponse.json(contestant);
  } catch (error) {
    console.error('Error fetching contestant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; contestantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, age, course, year, photo } = body;

    if (!name || !age || !course || !year) {
      return NextResponse.json({ error: 'Name, age, course, and year are required' }, { status: 400 });
    }

    // Verify contestant exists and belongs to the event
    const existingContestant = await prisma.contestant.findUnique({
      where: { id: params.contestantId },
    });

    if (!existingContestant) {
      return NextResponse.json({ error: 'Contestant not found' }, { status: 404 });
    }

    if (existingContestant.pageantEventId !== params.id) {
      return NextResponse.json({ error: 'Contestant does not belong to this event' }, { status: 400 });
    }

    // Update the contestant
    const contestant = await prisma.contestant.update({
      where: { id: params.contestantId },
      data: {
        name,
        age: parseInt(age),
        course,
        year,
        photo: photo || null,
      },
    });

    return NextResponse.json(contestant);
  } catch (error) {
    console.error('Error updating contestant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; contestantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify contestant exists and belongs to the event
    const existingContestant = await prisma.contestant.findUnique({
      where: { id: params.contestantId },
    });

    if (!existingContestant) {
      return NextResponse.json({ error: 'Contestant not found' }, { status: 404 });
    }

    if (existingContestant.pageantEventId !== params.id) {
      return NextResponse.json({ error: 'Contestant does not belong to this event' }, { status: 400 });
    }

    // Delete the contestant (cascade will handle scores)
    await prisma.contestant.delete({
      where: { id: params.contestantId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contestant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

