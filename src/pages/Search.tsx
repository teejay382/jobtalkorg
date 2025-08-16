import { useState } from 'react';
import { Search as SearchIcon, Filter, Briefcase, User } from 'lucide-react';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const mockResults = [
    {
      id: '1',
      type: 'freelancer',
      name: 'Alex Rivera',
      role: 'Frontend Developer',
      skills: ['React', 'TypeScript', 'Tailwind'],
      rating: 4.9,
      price: '$50/hr',
    },
    {
      id: '2',
      type: 'job',
      company: 'StartupXYZ',
      title: 'Senior React Developer',
      location: 'Remote',
      salary: '$90k-120k',
      skills: ['React', 'Node.js', 'AWS'],
    },
    {
      id: '3',
      type: 'freelancer',
      name: 'Maria Santos',
      role: 'UX Designer',
      skills: ['Figma', 'Prototyping', 'User Research'],
      rating: 4.8,
      price: '$45/hr',
    },
  ];

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'freelancers', label: 'Freelancers' },
    { id: 'jobs', label: 'Jobs' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-20 px-4 max-w-md mx-auto">
        {/* Search bar */}
        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search skills, jobs, or people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-12 h-12 rounded-full border-primary/20 focus:border-primary"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 text-muted-foreground">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === filter.id
                  ? 'bg-gradient-to-r from-primary to-accent text-white'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {mockResults.map((result) => (
            <div
              key={result.id}
              className="bg-card rounded-2xl p-4 shadow-soft border border-border hover:shadow-medium transition-shadow"
            >
              {result.type === 'freelancer' ? (
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary text-white">
                      <User className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{result.name}</h3>
                    <p className="text-sm text-muted-foreground">{result.role}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {result.skills.map((skill, index) => (
                        <span key={index} className="skill-tag text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-success">{result.price}</div>
                    <div className="text-xs text-muted-foreground">⭐ {result.rating}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{result.title}</h3>
                    <p className="text-sm text-muted-foreground">{result.company}</p>
                    <p className="text-sm text-muted-foreground">{result.location}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {result.skills.map((skill, index) => (
                        <span key={index} className="skill-tag text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary">{result.salary}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Search;