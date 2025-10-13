import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  Search,
  Star,
  Target,
  TrendingUp,
  Filter,
  ChevronRight,
  Camera
} from 'lucide-react';
import { mockBalletExercises } from '../mock';

const ExerciseSelection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');

  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredExercises = mockBalletExercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'All' || exercise.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-emerald-100 text-emerald-700';
      case 'Intermediate': return 'bg-blue-100 text-blue-700';
      case 'Advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Choose Your Exercise</h1>
          <p className="text-slate-600 text-sm">
            Select a ballet position to practice and evaluate
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 border-slate-200 focus:border-purple-300 focus:ring-purple-200 bg-white/70 backdrop-blur-sm"
          />
        </div>

        {/* Difficulty Filter */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {difficulties.map((difficulty) => (
            <Button
              key={difficulty}
              variant={selectedDifficulty === difficulty ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDifficulty(difficulty)}
              className={`flex-shrink-0 ${
                selectedDifficulty === difficulty
                  ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {difficulty}
            </Button>
          ))}
        </div>
      </div>

      {/* Exercise Grid */}
      <div className="px-6 pb-24 space-y-4">
        {filteredExercises.map((exercise) => (
          <Card key={exercise.id} className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
            <CardContent className="p-0">
              <Link to={`/camera/${exercise.id}`}>
                <div className="flex items-center p-4 hover:bg-gradient-to-r hover:from-rose-50/50 hover:to-purple-50/50 transition-all duration-200">
                  {/* Exercise Image */}
                  <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-purple-100 rounded-xl mr-4 flex items-center justify-center overflow-hidden">
                    <img 
                      src={exercise.image} 
                      alt={exercise.name}
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full hidden items-center justify-center">
                      <Target className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>

                  {/* Exercise Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-800">{exercise.name}</h3>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                      {exercise.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={getDifficultyColor(exercise.difficulty)} variant="secondary">
                          {exercise.difficulty}
                        </Badge>
                        {exercise.averageScore >= 85 && (
                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-500">
                        <span className="flex items-center">
                          <Target className="w-3 h-3 mr-1" />
                          {exercise.averageScore}
                        </span>
                        <span className="flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {exercise.completedTimes}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}

        {filteredExercises.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-600 mb-2">No exercises found</h3>
            <p className="text-sm text-slate-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* Floating Practice Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <Button className="w-14 h-14 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-200">
          <Camera className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default ExerciseSelection;