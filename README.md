# Pageant Tabulation System

A comprehensive Next.js application for managing and tabulating school college beauty pageant scores and rankings with full authentication and real-time scoring capabilities.

## 🎭 Features

### 🔐 **Authentication System**
- **Admin Login**: Complete event management dashboard
- **Judge Login**: Individual judge accounts with scoring interface
- **Role-based Access Control**: Secure access based on user roles
- **Session Management**: Persistent login sessions with NextAuth.js

### 👨‍💼 **Admin Dashboard**
- **Event Management**: Create, edit, and manage pageant events
- **Contestant Management**: Add contestants with photos, course info, and details
- **Judge Management**: Create judge accounts with login credentials
- **Category Management**: Define scoring categories with weights and max scores
- **Event Activation**: Set active events visible to public
- **Real-time Monitoring**: View scoring progress and results

### 👩‍⚖️ **Judge Interface**
- **Personal Dashboard**: View assigned events and scoring progress
- **Interactive Scoring**: Score contestants using sliders and number inputs
- **Progress Tracking**: Visual completion percentage and score tracking
- **Contestant Profiles**: View detailed contestant information while scoring
- **Real-time Updates**: Scores update immediately in the system

### 🏆 **Public View**
- **Live Event Display**: Real-time pageant information without login
- **Contestant Profiles**: View all contestants with photos and details
- **Live Rankings**: Updated rankings as judges submit scores
- **Scoring System Info**: View categories, judges, and scoring criteria
- **Category Breakdown**: Detailed performance analysis by category

### 📊 **Database & Data Management**
- **SQLite Database**: Persistent data storage with Prisma ORM
- **Real-time Calculations**: Automatic score calculations and rankings
- **Data Integrity**: Proper relationships and constraints
- **Sample Data**: Pre-populated realistic sample data for testing

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone or navigate to the project directory:
```bash
cd pageant-tabulation-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma migrate dev --name init
```

4. Seed the database with sample data:
```bash
npm run db:seed
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Login Credentials

### Admin Account
- **Email**: `admin@pageant.com`
- **Password**: `admin123`

### Judge Accounts
- **Judge 1**: `elena.cruz@college.edu` / `judge123`
- **Judge 2**: `roberto.santos@college.edu` / `judge123`
- **Judge 3**: `patricia.reyes@alumni.edu` / `judge123`
- **Judge 4**: `carlos.mendoza@industry.com` / `judge123`
- **Judge 5**: `lucia.fernandez@college.edu` / `judge123`

## 📁 Project Structure

```
pageant-tabulation-system/
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Sample data seeding
│   └── migrations/             # Database migrations
├── src/
│   ├── app/
│   │   ├── admin/              # Admin dashboard pages
│   │   ├── judge/              # Judge interface pages
│   │   ├── auth/               # Authentication pages
│   │   ├── api/                # API routes
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Public homepage
│   ├── components/
│   │   ├── ContestantCard.tsx  # Contestant display component
│   │   ├── ScoreTable.tsx      # Scoring table component
│   │   ├── RankingTable.tsx    # Rankings display
│   │   ├── CategoryBreakdown.tsx # Category analysis
│   │   └── Providers.tsx       # Session provider wrapper
│   └── lib/
│       ├── auth.ts             # NextAuth configuration
│       ├── prisma.ts           # Prisma client setup
│       └── data.ts             # Legacy mock data (reference)
├── public/                     # Static assets
├── .env                        # Environment variables
├── package.json                # Dependencies and scripts
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── next.config.js              # Next.js configuration
```

## 🎯 Sample Data

The application includes comprehensive sample data:

### 📅 **Active Event**
- **Name**: "School College Beauty Pageant 2024"
- **Date**: December 15, 2024
- **Status**: Active and visible to public

### 👑 **5 Contestants**
- **Maria Santos** (Computer Science, 3rd Year)
- **Ana Rodriguez** (Business Administration, 2nd Year)
- **Carmen Garcia** (Psychology, 4th Year)
- **Isabella Martinez** (Nursing, 1st Year)
- **Sofia Lopez** (Education, 3rd Year)

### 📊 **5 Scoring Categories**
- **Beauty & Poise** (25 points, 25% weight)
- **Intelligence & Communication** (25 points, 25% weight)
- **Talent** (20 points, 20% weight)
- **Personality** (15 points, 15% weight)
- **Evening Gown** (15 points, 15% weight)

### 👩‍⚖️ **5 Judges**
- **Prof. Elena Cruz** (Head Judge)
- **Dr. Roberto Santos** (Faculty Judge)
- **Ms. Patricia Reyes** (Alumni Judge)
- **Mr. Carlos Mendoza** (Industry Judge)
- **Prof. Lucia Fernandez** (Faculty Judge)

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed database with sample data
- `npx prisma studio` - Open Prisma database browser
- `npx prisma migrate dev` - Run database migrations

## 💻 Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better development experience
- **Tailwind CSS** - Utility-first CSS framework for styling
- **NextAuth.js** - Authentication and session management
- **Prisma** - Modern database toolkit and ORM
- **SQLite** - Lightweight database for development
- **bcryptjs** - Password hashing and security
- **React** - UI library for building components

## 🎨 Key Features Explained

### Real-time Scoring System
- Judges can score contestants across multiple categories
- Scores are immediately calculated and reflected in rankings
- Weighted scoring system for fair evaluation
- Progress tracking for judges and administrators

### Secure Authentication
- Password hashing with bcrypt
- Session-based authentication
- Role-based access control
- Secure API endpoints

### Responsive Design
- Mobile-friendly interface
- Modern UI with Tailwind CSS
- Intuitive navigation and user experience
- Professional styling throughout

### Database Management
- Relational database design with proper constraints
- Automatic score calculations
- Data integrity and validation
- Easy data seeding and migration

## 🔄 Usage Workflow

1. **Admin Setup**:
   - Login as admin
   - Create a new pageant event
   - Add contestants with their information
   - Create judge accounts
   - Define scoring categories
   - Activate the event

2. **Judge Scoring**:
   - Judges login with their credentials
   - View their assigned event
   - Score contestants across all categories
   - Track their progress

3. **Public Viewing**:
   - Anyone can view the active event
   - See live rankings and scores
   - View contestant profiles
   - No login required

## 🚀 Deployment

For production deployment:

1. Set up a production database (PostgreSQL recommended)
2. Update the `DATABASE_URL` in your environment
3. Set a secure `NEXTAUTH_SECRET`
4. Run `npm run build`
5. Deploy to your preferred platform (Vercel, Netlify, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🎉 Acknowledgments

Built with modern web technologies for educational institutions to manage their pageant events efficiently and professionally.