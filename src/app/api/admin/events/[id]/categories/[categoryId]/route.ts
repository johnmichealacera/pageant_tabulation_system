import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const category = await prisma.category.findUnique({
      where: { id: params.categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Verify category belongs to the event
    if (category.pageantEventId !== params.id) {
      return NextResponse.json({ error: 'Category does not belong to this event' }, { status: 400 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'ADMIN') {
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

    // Verify category exists and belongs to the event
    const existingCategory = await prisma.category.findUnique({
      where: { id: params.categoryId },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (existingCategory.pageantEventId !== params.id) {
      return NextResponse.json({ error: 'Category does not belong to this event' }, { status: 400 });
    }

    // Update the category
    const category = await prisma.category.update({
      where: { id: params.categoryId },
      data: {
        name,
        maxScore: parseInt(maxScore),
        weight: parseFloat(weight),
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify category exists and belongs to the event
    const existingCategory = await prisma.category.findUnique({
      where: { id: params.categoryId },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (existingCategory.pageantEventId !== params.id) {
      return NextResponse.json({ error: 'Category does not belong to this event' }, { status: 400 });
    }

    // Delete the category (cascade will handle scores)
    await prisma.category.delete({
      where: { id: params.categoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

