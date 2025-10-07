import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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
    const { name, role, email, password, createAccount } = body;

    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role are required' }, { status: 400 });
    }

    if (createAccount && (!email || !password)) {
      return NextResponse.json({ error: 'Email and password are required when creating account' }, { status: 400 });
    }

    // Verify event exists
    const event = await prisma.pageantEvent.findUnique({
      where: { id: params.id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    let userId = null;

    if (createAccount) {
      // Check if user with email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
      }

      // Create user account
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'JUDGE',
        },
      });
      userId = user.id;
    }

    const judge = await prisma.judge.create({
      data: {
        name,
        role,
        pageantEventId: params.id,
        userId,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    return NextResponse.json(judge);
  } catch (error) {
    console.error('Error creating judge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
