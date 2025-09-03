import { useState } from 'react';
import { Filter, X, MapPin, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SearchFilters as SearchFiltersType } from '@/hooks/useSearch';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: Partial<SearchFiltersType>) => void;
  onClearFilters: () => void;
  searchType: 'jobs' | 'freelancers';
}

const jobCategories = [
  'Web Development',
  'Mobile Development',
  'UI/UX Design',
  'Data Science',
  'Marketing',
  'Writing & Content',
  'Video & Animation',
  'Photography',
  'Consulting',
  'Other'
];

const skills = [
  'React', 'Vue', 'Angular', 'Node.js', 'Python', 'JavaScript', 'TypeScript',
  'PHP', 'Java', 'C#', 'Swift', 'Kotlin', 'Flutter', 'React Native',
  'Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'After Effects',
  'SEO', 'Content Writing', 'Social Media', 'Email Marketing'
];

export const SearchFilters = ({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  searchType 
}: SearchFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [budgetRange, setBudgetRange] = useState([
    filters.budgetMin || 0, 
    filters.budgetMax || 10000
  ]);

  const handleBudgetChange = (values: number[]) => {
    setBudgetRange(values);
    onFiltersChange({
      budgetMin: values[0] > 0 ? values[0] : undefined,
      budgetMax: values[1] < 10000 ? values[1] : undefined
    });
  };

  const handleSkillToggle = (skill: string) => {
    const currentSkills = filters.skills || [];
    const newSkills = currentSkills.includes(skill)
      ? currentSkills.filter(s => s !== skill)
      : [...currentSkills, skill];
    
    onFiltersChange({ skills: newSkills });
  };

  const hasActiveFilters = 
    filters.category || 
    filters.jobType || 
    filters.location || 
    filters.budgetMin || 
    filters.budgetMax ||
    (filters.skills && filters.skills.length > 0);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`relative ${hasActiveFilters ? 'border-primary text-primary' : ''}`}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Filter {searchType === 'jobs' ? 'Jobs' : 'Freelancers'}</span>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Category Filter */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Category
            </label>
            <Select 
              value={filters.category || 'all'} 
              onValueChange={(value) => onFiltersChange({ 
                category: value === 'all' ? undefined : value 
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {jobCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job Type Filter (Jobs only) */}
          {searchType === 'jobs' && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Work Type
              </label>
              <Select 
                value={filters.jobType || 'all'} 
                onValueChange={(value) => onFiltersChange({ 
                  jobType: value === 'all' ? undefined : value 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Location Filter */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <Input
              placeholder="Enter city or region"
              value={filters.location || ''}
              onChange={(e) => onFiltersChange({ location: e.target.value || undefined })}
            />
          </div>

          {/* Budget Range (Jobs only) */}
          {searchType === 'jobs' && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Budget Range
              </label>
              <div className="px-2">
                <Slider
                  value={budgetRange}
                  onValueChange={handleBudgetChange}
                  max={10000}
                  min={0}
                  step={100}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>${budgetRange[0].toLocaleString()}</span>
                  <span>${budgetRange[1].toLocaleString()}+</span>
                </div>
              </div>
            </div>
          )}

          {/* Skills Filter (Freelancers only) */}
          {searchType === 'freelancers' && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Skills
              </label>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {skills.map((skill) => {
                  const isSelected = filters.skills?.includes(skill) || false;
                  return (
                    <button
                      key={skill}
                      onClick={() => handleSkillToggle(skill)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-primary text-white'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
              {filters.skills && filters.skills.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {filters.skills.length} skill{filters.skills.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 pt-4 border-t">
          <Button 
            onClick={() => setIsOpen(false)}
            className="w-full"
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};