import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const event = await prisma.pageantEvent.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const body: { type: 'contestants' | 'judges'; rows: Record<string, string>[] } = await request.json();
  const { type, rows } = body;

  if (!type || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Invalid import data' }, { status: 400 });
  }

  const results: { success: number; errors: string[] } = { success: 0, errors: [] };

  if (type === 'contestants') {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name  = String(row.name  ?? '').trim();
      const age   = parseInt(row.age  ?? '0', 10);
      const course = String(row.course ?? '').trim();
      const year  = String(row.year  ?? '').trim();

      if (!name || !course || !year || isNaN(age) || age <= 0) {
        results.errors.push(`Row ${i + 2}: Missing or invalid name, age, course, or year`);
        continue;
      }
      try {
        await prisma.contestant.create({
          data: { name, age, course, year, pageantEventId: params.id },
        });
        results.success++;
      } catch (e: any) {
        results.errors.push(`Row ${i + 2}: ${e.message}`);
      }
    }
  }

  if (type === 'judges') {
    for (let i = 0; i < rows.length; i++) {
      const row  = rows[i];
      const name  = String(row.name  ?? '').trim();
      const role  = String(row.role  ?? 'Judge').trim();
      const email = String(row.email ?? '').trim().toLowerCase();
      const password = String(row.password ?? '').trim();

      if (!name) {
        results.errors.push(`Row ${i + 2}: Missing name`);
        continue;
      }
      try {
        if (email && password) {
          // Create user account + judge profile
          const existing = await prisma.user.findUnique({ where: { email } });
          if (existing) {
            results.errors.push(`Row ${i + 2}: Email ${email} already in use`);
            continue;
          }
          const hashed = await bcrypt.hash(password, 12);
          const user = await prisma.user.create({
            data: { email, password: hashed, name, role: 'JUDGE' },
          });
          await prisma.judge.create({
            data: { name, role, userId: user.id, pageantEventId: params.id },
          });
        } else {
          // Judge without login
          await prisma.judge.create({
            data: { name, role, pageantEventId: params.id },
          });
        }
        results.success++;
      } catch (e: any) {
        results.errors.push(`Row ${i + 2}: ${e.message}`);
      }
    }
  }

  return NextResponse.json(results);
}
