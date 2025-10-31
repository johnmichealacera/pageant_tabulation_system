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
}

export default function ContestantCard({ contestant }: ContestantCardProps) {
  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-2xl">👸</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {contestant.name}
          </h3>
          <p className="text-sm text-gray-600">{contestant.course}</p>
          <p className="text-sm text-gray-500">{contestant.year} • Age {contestant.age}</p>
        </div>
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-primary-600">#{contestant.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
