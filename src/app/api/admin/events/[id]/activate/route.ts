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

    // Deactivate all events first
    await prisma.pageantEvent.updateMany({
      data: { isActive: false },
    });

    // Activate the selected event
    const event = await prisma.pageantEvent.update({
      where: { id: params.id },
      data: { isActive: true },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error activating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
