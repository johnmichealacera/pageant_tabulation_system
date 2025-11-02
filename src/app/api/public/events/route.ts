import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const events = await prisma.pageantEvent.findMany({
      orderBy: { eventDate: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        eventDate: true,
        isActive: true,
      },
    });

    return NextResponse.json(events, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        }
      }
    );
  }
}

