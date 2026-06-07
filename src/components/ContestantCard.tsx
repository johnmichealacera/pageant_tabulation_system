'use client';

import { motion } from 'framer-motion';

interface Contestant {
  id: string | number;
  name: string;
  age: number;
  course: string;
  year: string;
  photo?: string;
}

interface ContestantCardProps {
  contestant: Contestant;
  candidateNumber?: number;
  onClick?: () => void;
  index?: number;
}

export default function ContestantCard({ contestant, candidateNumber, onClick, index = 0 }: ContestantCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="card-hover cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0 relative">
          {contestant.photo ? (
            <img
              src={contestant.photo}
              alt={contestant.name}
              className="w-16 h-20 rounded-lg object-cover ring-1 ring-[var(--border)] group-hover:ring-gold-400 transition-all duration-200"
            />
          ) : (
            <div className="w-16 h-20 rounded-lg flex items-center justify-center
              bg-gradient-to-br from-gold-100 to-gold-200 dark:from-gold-900/20 dark:to-gold-800/20
              ring-1 ring-[var(--border)] group-hover:ring-gold-400 transition-all duration-200">
              <span className="text-2xl">👸</span>
            </div>
          )}
          {candidateNumber && (
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gold-500 text-white
              flex items-center justify-center text-xs font-bold shadow-sm">
              {candidateNumber}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
            {contestant.name}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{contestant.course}</p>
          <p className="text-xs text-[var(--text-muted)]">{contestant.year} · Age {contestant.age}</p>
        </div>
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
