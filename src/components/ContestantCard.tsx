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
}

export default function ContestantCard({ contestant, candidateNumber, onClick }: ContestantCardProps) {
  return (
    <div 
      className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {contestant.photo ? (
            <img
              src={contestant.photo}
              alt={contestant.name}
              className="w-16 h-20 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👸</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {candidateNumber && (
            <div className="text-2xl font-bold text-indigo-600 mb-1">
              Candidate {candidateNumber}
            </div>
          )}
          <h3 className="text-sm font-medium text-gray-700 truncate mb-1">
            {contestant.name}
          </h3>
          <p className="text-xs text-gray-600">{contestant.course}</p>
          <p className="text-xs text-gray-500">{contestant.year} • Age {contestant.age}</p>
        </div>
      </div>
    </div>
  );
}
