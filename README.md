# Pageant Tabulation System

A comprehensive Next.js application for managing and tabulating school college beauty pageant scores and rankings with full authentication and real-time scoring capabilities.

## 🎭 Features

### 🔐 **Authentication System**
- **Admin Login**: Complete event management dashboard
- **Judge Login**: Individual judge accounts with scoring interface
- **Role-based Access Control**: Secure access based on user roles
- **Session Management**: Persistent login sessions with NextAuth.js

### 👨‍💼 **Admin Dashboard**
- **Event Management**: Create, edit, delete, and manage pageant events
- **Contestant Management**: Add, edit, delete contestants with cloud-based photo uploads
- **Image Upload**: Cloudinary integration with automatic WebP optimization for better performance
- **Judge Management**: Create, edit, delete judge accounts with login credentials and password updates
- **Category Management**: Add, edit, delete scoring categories with weights and max scores
- **Event Activation**: Set active events visible to public
- **Real-time Monitoring**: View scoring progress and results
- **Comprehensive Reports**: Generate detailed reports with rankings, statistics, and score breakdowns
- **Export Functionality**: Export reports to CSV or print as PDF

### 👩‍⚖️ **Judge Interface**
- **Personal Dashboard**: View assigned events and scoring progress
- **Interactive Scoring**: Score contestants using sliders and number inputs
- **Progress Tracking**: Visual completion percentage and score tracking
- **Contestant Profiles**: View detailed contestant information while scoring
- **Real-time Updates**: Scores update immediately in the system

### 🏆 **Public View**
- **Live Event Display**: Real-time pageant information without login
- **Event Switcher**: Dropdown to view multiple events or switch between them
- **Contestant Profiles**: View all contestants with photos and details
- **Interactive Contestant Cards**: Click to view detailed performance breakdown
- **Live Rankings**: Updated rankings as judges submit scores
- **Scoring System Info**: View categories, judges, and scoring criteria
- **Category Breakdown**: Detailed performance analysis by category
- **Individual Performance**: Per-contestant score breakdown with category details
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop

### 📊 **Database & Data Management**
- **PostgreSQL Database**: Production-ready data storage with Prisma ORM
- **Real-time Calculations**: Automatic score calculations and rankings
- **Data Integrity**: Proper relationships and constraints with cascade deletes
- **Sample Data**: Pre-populated realistic sample data for testing

### 📄 **Reports & Analytics**
- **Comprehensive Reports**: Full event analysis with rankings and statistics
- **Detailed Score Breakdowns**: Per-contestant scores by category and judge
- **CSV Export**: Download complete data for external analysis
- **PDF Export**: Professional print-ready reports
- **Statistics Dashboard**: Completion rates, averages, and performance metrics
- **Transparency**: Full judge-by-judge scoring for accountability

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (or use SQLite for development)

### Installation

1. Clone or navigate to the project directory:
```bash
cd pageant-tabulation-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pageant_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Cloudinary Configuration (for image uploads)
NEXT_PUBLIC_CLOUDINARY_URL="https://api.cloudinary.com/v1_1/your-cloud-name/image/upload"
NEXT_PUBLIC_CLOUDINARY_API_KEY="your-api-key"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your-upload-preset"
```

4. Set up the database:
```bash
npx prisma migrate dev --name init
```

5. Seed the database with sample data:
```bash
npm run db:seed
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

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
│   │   │   ├── admin/          # Admin API endpoints
│   │   │   ├── judge/          # Judge API endpoints
│   │   │   └── public/         # Public API endpoints
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout with favicon
│   │   └── page.tsx            # Public homepage with event switcher
│   ├── components/
│   │   ├── ContestantCard.tsx  # Contestant display component
│   │   ├── ScoreTable.tsx      # Scoring table component
│   │   ├── RankingTable.tsx    # Rankings display
│   │   ├── CategoryBreakdown.tsx # Category analysis
│   │   ├── ImageUpload.tsx     # Cloudinary image upload component
│   │   └── Providers.tsx       # Session provider wrapper
│   └── lib/
│       ├── auth.ts             # NextAuth configuration
│       ├── prisma.ts           # Prisma client setup
│       ├── cloudinary.ts       # Cloudinary upload utilities
│       └── data.ts             # Legacy mock data (reference)
├── public/                     # Static assets
│   └── favicon.svg             # Custom pageant crown favicon
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
- **PostgreSQL** - Production-ready relational database
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
- **Mobile-First Approach**: Fully optimized for all screen sizes
- **Responsive Navigation**: Touch-friendly interface with adaptive layouts
- **Dynamic Content**: Event switcher and content adapts to device
- **Cross-Device Compatibility**: Seamless experience on mobile, tablet, and desktop
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
   - Create judge accounts with login credentials
   - Define scoring categories with weights
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

4. **Reports & Documentation**:
   - Generate comprehensive reports
   - Export data to CSV for analysis
   - Print professional PDF reports
   - View detailed score breakdowns
   - Track statistics and completion rates

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

---

## 🆕 Recent Updates

### Enhanced Public View & UX
- ✅ **Event Switcher**: Dropdown to easily view and switch between multiple events
- ✅ **Interactive Contestant Cards**: Click contestant cards to view detailed performance
- ✅ **Individual Performance Views**: Per-contestant category breakdown with real-time scores
- ✅ **Removed ID Display**: Clean card design without primary key clutter
- ✅ **Custom Favicon**: Professional crown icon displayed in browser tabs
- ✅ **Real-time Data**: No-cache headers for instant updates on event changes
- ✅ **Navigation Flow**: Smooth transitions between contestants and breakdown views

### Complete Mobile Responsiveness
- ✅ **Event Selection Bar**: Responsive layout that adapts to screen size
- ✅ **Header Optimization**: Mobile-friendly title and description display
- ✅ **Navigation Tabs**: Horizontal scroll for mobile, full layout for desktop
- ✅ **Contestant Breakdown**: Optimized spacing and text sizes for all devices
- ✅ **Category Tables**: Word wrapping and responsive padding for readability
- ✅ **Touch-Friendly**: Larger tap targets and improved spacing on mobile
- ✅ **Responsive Typography**: Adaptive font sizes across all components

### Complete Admin Management System
- ✅ Full CRUD operations for contestants, judges, and categories
- ✅ Edit functionality with pre-filled forms
- ✅ Delete functionality with cascade handling
- ✅ Password update capability for judges
- ✅ Role-based authentication fixes

### Professional Reporting System
- ✅ Comprehensive event reports with full data aggregation
- ✅ Detailed score breakdowns by judge and category
- ✅ Rankings with visual podium display
- ✅ Statistics dashboard with completion rates
- ✅ CSV export for data analysis
- ✅ PDF-ready print reports
- ✅ Professional styling and formatting

### Image Upload & Optimization
- ✅ Cloudinary integration for cloud-based image storage
- ✅ Automatic WebP conversion for better performance
- ✅ Image optimization with quality compression
- ✅ Drag-and-drop upload interface
- ✅ Progress tracking and preview functionality
- ✅ Fallback to URL input for flexibility

### Database & Security Improvements
- ✅ PostgreSQL database support for production
- ✅ TypeScript type safety improvements
- ✅ Cascade delete handling for data integrity
- ✅ Enhanced authentication with proper role checks
- ✅ Secure password management with bcrypt
- ✅ API cache control for real-time data updates

---

## 📋 Project Status

✅ **Production Ready** - All core features implemented and tested
✅ **Secure** - Authentication and authorization in place
✅ **Responsive** - Mobile-friendly design
✅ **Documented** - Complete documentation and setup guides
✅ **Maintained** - Clean code with proper error handling