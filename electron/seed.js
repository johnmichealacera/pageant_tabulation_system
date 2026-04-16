const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@pageant.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('[seed] Created admin user:', admin.email);

  const event = await prisma.pageantEvent.upsert({
    where: { id: 'sample-event-1' },
    update: {},
    create: {
      id: 'sample-event-1',
      name: 'School College Beauty Pageant 2026',
      description: 'Annual beauty pageant showcasing talent, intelligence, and poise of our college students',
      eventDate: new Date('2026-03-31'),
      isActive: true,
    },
  });
  console.log('[seed] Created pageant event:', event.name);

  const contestants = [
    { id: 'contestant-1', name: 'Maria Santos', age: 20, course: 'BS Computer Science', year: '3rd Year' },
    { id: 'contestant-2', name: 'Ana Rodriguez', age: 19, course: 'BS Business Administration', year: '2nd Year' },
    { id: 'contestant-3', name: 'Carmen Garcia', age: 21, course: 'BS Psychology', year: '4th Year' },
    { id: 'contestant-4', name: 'Isabella Martinez', age: 18, course: 'BS Nursing', year: '1st Year' },
    { id: 'contestant-5', name: 'Sofia Lopez', age: 20, course: 'BS Education', year: '3rd Year' },
  ];

  for (const c of contestants) {
    await prisma.contestant.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, pageantEventId: event.id },
    });
  }
  console.log('[seed] Created contestants');

  const categories = [
    { id: 'category-1', name: 'Beauty & Poise', maxScore: 25, weight: 0.25 },
    { id: 'category-2', name: 'Intelligence & Communication', maxScore: 25, weight: 0.25 },
    { id: 'category-3', name: 'Talent', maxScore: 20, weight: 0.20 },
    { id: 'category-4', name: 'Personality', maxScore: 15, weight: 0.15 },
    { id: 'category-5', name: 'Evening Gown', maxScore: 15, weight: 0.15 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: { ...cat, pageantEventId: event.id },
    });
  }
  console.log('[seed] Created categories');

  const judges = [
    { id: 'judge-1', name: 'Prof. Elena Cruz', role: 'Head Judge', email: 'elena.cruz@college.edu', password: 'judge123' },
    { id: 'judge-2', name: 'Dr. Roberto Santos', role: 'Faculty Judge', email: 'roberto.santos@college.edu', password: 'judge123' },
    { id: 'judge-3', name: 'Ms. Patricia Reyes', role: 'Alumni Judge', email: 'patricia.reyes@alumni.edu', password: 'judge123' },
    { id: 'judge-4', name: 'Mr. Carlos Mendoza', role: 'Industry Judge', email: 'carlos.mendoza@industry.com', password: 'judge123' },
    { id: 'judge-5', name: 'Prof. Lucia Fernandez', role: 'Faculty Judge', email: 'lucia.fernandez@college.edu', password: 'judge123' },
  ];

  for (const j of judges) {
    const judgePassword = await bcrypt.hash(j.password, 12);
    const judgeUser = await prisma.user.upsert({
      where: { email: j.email },
      update: {},
      create: {
        email: j.email,
        name: j.name,
        password: judgePassword,
        role: 'JUDGE',
      },
    });

    await prisma.judge.upsert({
      where: { id: j.id },
      update: {},
      create: {
        id: j.id,
        name: j.name,
        role: j.role,
        userId: judgeUser.id,
        pageantEventId: event.id,
      },
    });
  }
  console.log('[seed] Created judges with login accounts');

  const sampleScores = [
    { contestantId: 'contestant-1', categoryId: 'category-1', judgeId: 'judge-1', score: 23 },
    { contestantId: 'contestant-1', categoryId: 'category-1', judgeId: 'judge-2', score: 22 },
    { contestantId: 'contestant-1', categoryId: 'category-1', judgeId: 'judge-3', score: 24 },
    { contestantId: 'contestant-1', categoryId: 'category-1', judgeId: 'judge-4', score: 23 },
    { contestantId: 'contestant-1', categoryId: 'category-1', judgeId: 'judge-5', score: 25 },
    { contestantId: 'contestant-1', categoryId: 'category-2', judgeId: 'judge-1', score: 24 },
    { contestantId: 'contestant-1', categoryId: 'category-2', judgeId: 'judge-2', score: 23 },
    { contestantId: 'contestant-1', categoryId: 'category-2', judgeId: 'judge-3', score: 25 },
    { contestantId: 'contestant-1', categoryId: 'category-2', judgeId: 'judge-4', score: 22 },
    { contestantId: 'contestant-1', categoryId: 'category-2', judgeId: 'judge-5', score: 24 },
    { contestantId: 'contestant-2', categoryId: 'category-1', judgeId: 'judge-1', score: 21 },
    { contestantId: 'contestant-2', categoryId: 'category-1', judgeId: 'judge-2', score: 22 },
    { contestantId: 'contestant-2', categoryId: 'category-1', judgeId: 'judge-3', score: 20 },
    { contestantId: 'contestant-2', categoryId: 'category-1', judgeId: 'judge-4', score: 23 },
    { contestantId: 'contestant-2', categoryId: 'category-1', judgeId: 'judge-5', score: 21 },
    { contestantId: 'contestant-2', categoryId: 'category-2', judgeId: 'judge-1', score: 22 },
    { contestantId: 'contestant-2', categoryId: 'category-2', judgeId: 'judge-2', score: 21 },
    { contestantId: 'contestant-2', categoryId: 'category-2', judgeId: 'judge-3', score: 23 },
    { contestantId: 'contestant-2', categoryId: 'category-2', judgeId: 'judge-4', score: 20 },
    { contestantId: 'contestant-2', categoryId: 'category-2', judgeId: 'judge-5', score: 22 },
    { contestantId: 'contestant-3', categoryId: 'category-1', judgeId: 'judge-1', score: 25 },
    { contestantId: 'contestant-3', categoryId: 'category-1', judgeId: 'judge-2', score: 24 },
    { contestantId: 'contestant-3', categoryId: 'category-1', judgeId: 'judge-3', score: 25 },
  ];

  for (const s of sampleScores) {
    await prisma.score.upsert({
      where: {
        contestantId_categoryId_judgeId: {
          contestantId: s.contestantId,
          categoryId: s.categoryId,
          judgeId: s.judgeId,
        },
      },
      update: {},
      create: { ...s, pageantEventId: event.id },
    });
  }
  console.log('[seed] Created sample scores');

  console.log('\n[seed] Database seeded successfully!');
  console.log('\nLogin Credentials:');
  console.log('  Admin: admin@pageant.com / admin123');
  console.log('  Judge 1: elena.cruz@college.edu / judge123');
  console.log('  Judge 2: roberto.santos@college.edu / judge123');
  console.log('  Judge 3: patricia.reyes@alumni.edu / judge123');
  console.log('  Judge 4: carlos.mendoza@industry.com / judge123');
  console.log('  Judge 5: lucia.fernandez@college.edu / judge123');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('[seed] Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

module.exports = main;
