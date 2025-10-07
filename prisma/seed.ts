import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@pageant.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@pageant.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('Created admin user:', admin)

  // Create sample pageant event
  const event = await prisma.pageantEvent.upsert({
    where: { id: 'sample-event-1' },
    update: {},
    create: {
      id: 'sample-event-1',
      name: 'School College Beauty Pageant 2024',
      description: 'Annual beauty pageant showcasing talent, intelligence, and poise of our college students',
      eventDate: new Date('2024-12-15'),
      isActive: true,
    },
  })

  console.log('Created pageant event:', event)

  // Create sample contestants
  const contestants = [
    {
      id: 'contestant-1',
      name: 'Maria Santos',
      age: 20,
      course: 'BS Computer Science',
      year: '3rd Year',
      photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=200&fit=crop&crop=face',
    },
    {
      id: 'contestant-2', 
      name: 'Ana Rodriguez',
      age: 19,
      course: 'BS Business Administration',
      year: '2nd Year',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=200&fit=crop&crop=face',
    },
    {
      id: 'contestant-3',
      name: 'Carmen Garcia',
      age: 21,
      course: 'BS Psychology',
      year: '4th Year', 
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=200&fit=crop&crop=face',
    },
    {
      id: 'contestant-4',
      name: 'Isabella Martinez',
      age: 18,
      course: 'BS Nursing',
      year: '1st Year',
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=200&fit=crop&crop=face',
    },
    {
      id: 'contestant-5',
      name: 'Sofia Lopez',
      age: 20,
      course: 'BS Education',
      year: '3rd Year',
      photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=200&fit=crop&crop=face',
    },
  ]

  for (const contestantData of contestants) {
    await prisma.contestant.upsert({
      where: { id: contestantData.id },
      update: {},
      create: {
        ...contestantData,
        pageantEventId: event.id,
      },
    })
  }

  console.log('Created contestants')

  // Create sample categories
  const categories = [
    {
      id: 'category-1',
      name: 'Beauty & Poise',
      maxScore: 25,
      weight: 0.25,
    },
    {
      id: 'category-2',
      name: 'Intelligence & Communication',
      maxScore: 25,
      weight: 0.25,
    },
    {
      id: 'category-3',
      name: 'Talent',
      maxScore: 20,
      weight: 0.20,
    },
    {
      id: 'category-4',
      name: 'Personality',
      maxScore: 15,
      weight: 0.15,
    },
    {
      id: 'category-5',
      name: 'Evening Gown',
      maxScore: 15,
      weight: 0.15,
    },
  ]

  for (const categoryData of categories) {
    await prisma.category.upsert({
      where: { id: categoryData.id },
      update: {},
      create: {
        ...categoryData,
        pageantEventId: event.id,
      },
    })
  }

  console.log('Created categories')

  // Create sample judges with login accounts
  const judges = [
    {
      id: 'judge-1',
      name: 'Prof. Elena Cruz',
      role: 'Head Judge',
      email: 'elena.cruz@college.edu',
      password: 'judge123',
    },
    {
      id: 'judge-2',
      name: 'Dr. Roberto Santos',
      role: 'Faculty Judge',
      email: 'roberto.santos@college.edu',
      password: 'judge123',
    },
    {
      id: 'judge-3',
      name: 'Ms. Patricia Reyes',
      role: 'Alumni Judge',
      email: 'patricia.reyes@alumni.edu',
      password: 'judge123',
    },
    {
      id: 'judge-4',
      name: 'Mr. Carlos Mendoza',
      role: 'Industry Judge',
      email: 'carlos.mendoza@industry.com',
      password: 'judge123',
    },
    {
      id: 'judge-5',
      name: 'Prof. Lucia Fernandez',
      role: 'Faculty Judge',
      email: 'lucia.fernandez@college.edu',
      password: 'judge123',
    },
  ]

  for (const judgeData of judges) {
    // Create user account for judge
    const judgePassword = await bcrypt.hash(judgeData.password, 12)
    const judgeUser = await prisma.user.upsert({
      where: { email: judgeData.email },
      update: {},
      create: {
        email: judgeData.email,
        name: judgeData.name,
        password: judgePassword,
        role: 'JUDGE',
      },
    })

    // Create judge profile
    await prisma.judge.upsert({
      where: { id: judgeData.id },
      update: {},
      create: {
        id: judgeData.id,
        name: judgeData.name,
        role: judgeData.role,
        userId: judgeUser.id,
        pageantEventId: event.id,
      },
    })
  }

  console.log('Created judges with login accounts')

  // Create some sample scores to show rankings
  const sampleScores = [
    // Maria Santos scores
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

    // Ana Rodriguez scores
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

    // Carmen Garcia scores (partial - to show mixed progress)
    { contestantId: 'contestant-3', categoryId: 'category-1', judgeId: 'judge-1', score: 25 },
    { contestantId: 'contestant-3', categoryId: 'category-1', judgeId: 'judge-2', score: 24 },
    { contestantId: 'contestant-3', categoryId: 'category-1', judgeId: 'judge-3', score: 25 },
  ]

  for (const scoreData of sampleScores) {
    await prisma.score.upsert({
      where: {
        contestantId_categoryId_judgeId: {
          contestantId: scoreData.contestantId,
          categoryId: scoreData.categoryId,
          judgeId: scoreData.judgeId,
        },
      },
      update: {},
      create: {
        ...scoreData,
        pageantEventId: event.id,
      },
    })
  }

  console.log('Created sample scores')
  console.log('\n🎉 Sample data created successfully!')
  console.log('\n📋 Login Credentials:')
  console.log('👨‍💼 Admin: admin@pageant.com / admin123')
  console.log('👩‍⚖️ Judge 1: elena.cruz@college.edu / judge123')
  console.log('👨‍⚖️ Judge 2: roberto.santos@college.edu / judge123')
  console.log('👩‍⚖️ Judge 3: patricia.reyes@alumni.edu / judge123')
  console.log('👨‍⚖️ Judge 4: carlos.mendoza@industry.com / judge123')
  console.log('👩‍⚖️ Judge 5: lucia.fernandez@college.edu / judge123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
