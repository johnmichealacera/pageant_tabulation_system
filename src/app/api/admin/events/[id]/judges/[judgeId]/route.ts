import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; judgeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const judge = await prisma.judge.findUnique({
      where: { id: params.judgeId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!judge) {
      return NextResponse.json({ error: 'Judge not found' }, { status: 404 });
    }

    // Verify judge belongs to the event
    if (judge.pageantEventId !== params.id) {
      return NextResponse.json({ error: 'Judge does not belong to this event' }, { status: 400 });
    }

    return NextResponse.json(judge);
  } catch (error) {
    console.error('Error fetching judge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; judgeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, role, password, updatePassword } = body;

    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role are required' }, { status: 400 });
    }

    // Verify judge exists and belongs to the event
    const existingJudge = await prisma.judge.findUnique({
      where: { id: params.judgeId },
      include: {
        user: true,
      },
    });

    if (!existingJudge) {
      return NextResponse.json({ error: 'Judge not found' }, { status: 404 });
    }

    if (existingJudge.pageantEventId !== params.id) {
      return NextResponse.json({ error: 'Judge does not belong to this event' }, { status: 400 });
    }

    // Update judge profile
    const judge = await prisma.judge.update({
      where: { id: params.judgeId },
      data: {
        name,
        role,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    // Update password if provided and user exists
    if (existingJudge.user && updatePassword && password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { id: existingJudge.user.id },
        data: {
          password: hashedPassword,
        },
      });
    }

    return NextResponse.json(judge);
  } catch (error) {
    console.error('Error updating judge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; judgeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify judge exists and belongs to the event
    const existingJudge = await prisma.judge.findUnique({
      where: { id: params.judgeId },
      include: {
        user: true,
      },
    });

    if (!existingJudge) {
      return NextResponse.json({ error: 'Judge not found' }, { status: 404 });
    }

    if (existingJudge.pageantEventId !== params.id) {
      return NextResponse.json({ error: 'Judge does not belong to this event' }, { status: 400 });
    }

    // Delete the judge (cascade will handle scores)
    // Note: We don't delete the user account as they might be a judge in other events
    await prisma.judge.delete({
      where: { id: params.judgeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting judge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

