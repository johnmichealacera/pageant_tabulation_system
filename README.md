# Pageant Tabulation System

A Next.js application for managing and tabulating school college beauty pageant scores and rankings.

## Features

- **Contestant Management**: View all contestants with their details
- **Scoring System**: Display scoring categories and judge panel information
- **Rankings**: View final rankings with podium display and detailed table
- **Category Breakdown**: Analyze performance by category with visual charts
- **Mock Data**: Pre-populated with sample data for testing

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone or navigate to the project directory:
```bash
cd pageant-tabulation
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
pageant-tabulation/
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles with Tailwind
│   │   ├── layout.tsx           # Root layout component
│   │   └── page.tsx             # Main page with tab navigation
│   ├── components/
│   │   ├── ContestantCard.tsx   # Individual contestant display
│   │   ├── ScoreTable.tsx       # Detailed scoring table
│   │   ├── RankingTable.tsx     # Rankings with podium view
│   │   └── CategoryBreakdown.tsx # Category analysis
│   └── lib/
│       └── data.ts              # Mock data and utility functions
├── public/                      # Static assets
├── package.json                 # Dependencies and scripts
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── next.config.js              # Next.js configuration
```

## Mock Data

The application includes sample data for testing:

- **5 Contestants**: Different courses and years
- **5 Categories**: Beauty & Poise, Intelligence & Communication, Talent, Personality, Evening Gown
- **5 Judges**: Various roles (Head Judge, Faculty, Alumni, Industry)
- **Random Scores**: Generated automatically for realistic testing

## Scoring System

- Each category has a maximum score and weight percentage
- Scores are averaged across all judges
- Final score is calculated using weighted averages
- Rankings are determined by total weighted scores

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React** - UI library

## Customization

To customize the application:

1. **Add Real Data**: Replace mock data in `src/lib/data.ts`
2. **Modify Categories**: Update scoring categories and weights
3. **Add Features**: Extend components for additional functionality
4. **Styling**: Customize Tailwind classes in `tailwind.config.js`

## Future Enhancements

- Real-time scoring updates
- Judge login system
- Photo upload functionality
- Export results to PDF
- Admin panel for data management
- Mobile-responsive design improvements
