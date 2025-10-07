export interface Contestant {
  id: number;
  name: string;
  age: number;
  course: string;
  year: string;
  photo?: string;
}

export interface Category {
  id: number;
  name: string;
  maxScore: number;
  weight: number;
}

export interface Score {
  contestantId: number;
  categoryId: number;
  score: number;
  judgeId: number;
}

export interface Judge {
  id: number;
  name: string;
  role: string;
}

// Mock Data
export const mockContestants: Contestant[] = [
  {
    id: 1,
    name: "Maria Santos",
    age: 20,
    course: "BS Computer Science",
    year: "3rd Year",
    photo: "/api/placeholder/150/200"
  },
  {
    id: 2,
    name: "Ana Rodriguez",
    age: 19,
    course: "BS Business Administration",
    year: "2nd Year",
    photo: "/api/placeholder/150/200"
  },
  {
    id: 3,
    name: "Carmen Garcia",
    age: 21,
    course: "BS Psychology",
    year: "4th Year",
    photo: "/api/placeholder/150/200"
  },
  {
    id: 4,
    name: "Isabella Martinez",
    age: 18,
    course: "BS Nursing",
    year: "1st Year",
    photo: "/api/placeholder/150/200"
  },
  {
    id: 5,
    name: "Sofia Lopez",
    age: 20,
    course: "BS Education",
    year: "3rd Year",
    photo: "/api/placeholder/150/200"
  }
];

export const mockCategories: Category[] = [
  {
    id: 1,
    name: "Beauty & Poise",
    maxScore: 25,
    weight: 0.25
  },
  {
    id: 2,
    name: "Intelligence & Communication",
    maxScore: 25,
    weight: 0.25
  },
  {
    id: 3,
    name: "Talent",
    maxScore: 20,
    weight: 0.20
  },
  {
    id: 4,
    name: "Personality",
    maxScore: 15,
    weight: 0.15
  },
  {
    id: 5,
    name: "Evening Gown",
    maxScore: 15,
    weight: 0.15
  }
];

export const mockJudges: Judge[] = [
  {
    id: 1,
    name: "Prof. Elena Cruz",
    role: "Head Judge"
  },
  {
    id: 2,
    name: "Dr. Roberto Santos",
    role: "Faculty Judge"
  },
  {
    id: 3,
    name: "Ms. Patricia Reyes",
    role: "Alumni Judge"
  },
  {
    id: 4,
    name: "Mr. Carlos Mendoza",
    role: "Industry Judge"
  },
  {
    id: 5,
    name: "Prof. Lucia Fernandez",
    role: "Faculty Judge"
  }
];

// Generate mock scores
export const generateMockScores = (): Score[] => {
  const scores: Score[] = [];
  
  mockContestants.forEach(contestant => {
    mockCategories.forEach(category => {
      mockJudges.forEach(judge => {
        // Generate random scores between 70% and 100% of max score
        const minScore = Math.floor(category.maxScore * 0.7);
        const maxScore = category.maxScore;
        const score = Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;
        
        scores.push({
          contestantId: contestant.id,
          categoryId: category.id,
          score: score,
          judgeId: judge.id
        });
      });
    });
  });
  
  return scores;
};

export const mockScores = generateMockScores();

// Calculate total scores for each contestant
export const calculateTotalScores = () => {
  const contestantScores: { [key: number]: number } = {};
  
  mockContestants.forEach(contestant => {
    let totalScore = 0;
    
    mockCategories.forEach(category => {
      const categoryScores = mockScores.filter(
        score => score.contestantId === contestant.id && score.categoryId === category.id
      );
      
      if (categoryScores.length > 0) {
        const averageScore = categoryScores.reduce((sum, score) => sum + score.score, 0) / categoryScores.length;
        totalScore += averageScore * category.weight;
      }
    });
    
    contestantScores[contestant.id] = Math.round(totalScore * 100) / 100;
  });
  
  return contestantScores;
};

// Get rankings
export const getRankings = () => {
  const totalScores = calculateTotalScores();
  const rankings = Object.entries(totalScores)
    .map(([contestantId, score]) => ({
      contestantId: parseInt(contestantId),
      score,
      contestant: mockContestants.find(c => c.id === parseInt(contestantId))
    }))
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  
  return rankings;
};
