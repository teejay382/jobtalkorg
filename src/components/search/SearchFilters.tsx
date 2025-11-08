import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SearchFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  searchType: 'jobs' | 'freelancers';
}

export function SearchFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  searchType,
}: SearchFiltersProps) {
  const hasActiveFilters = Object.keys(filters).length > 1 || 
    (Object.keys(filters).length === 1 && !filters.query);

  const jobCategories = [
    'Web Development',
    'Mobile Development',
    'UI/UX Design',
    'Data Science',
    'Writing',
    'Marketing',
    'Video Editing',
    'Translation',
  ];

  const freelancerSkills = [
    'React',
    'Node.js',
    'Python',
    'JavaScript',
    'TypeScript',
    'UI/UX',
    'Figma',
    'Photoshop',
  ];

  const experienceLevels = ['Entry', 'Intermediate', 'Expert'];
  const jobTypes = ['Remote', 'Local', 'Hybrid'];

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="glass-card-premium border-primary/20 hover:border-primary/40 transition-all duration-300"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/20 rounded-full">
                {Object.keys(filters).filter(k => k !== 'query').length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56 glass-card-premium">
          <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {searchType === 'jobs' ? (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Categories
              </DropdownMenuLabel>
              {jobCategories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={filters.categories?.includes(category)}
                  onCheckedChange={(checked) => {
                    const current = filters.categories || [];
                    onFiltersChange({
                      categories: checked
                        ? [...current, category]
                        : current.filter((c: string) => c !== category),
                    });
                  }}
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Job Type
              </DropdownMenuLabel>
              {jobTypes.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={filters.jobType?.includes(type)}
                  onCheckedChange={(checked) => {
                    const current = filters.jobType || [];
                    onFiltersChange({
                      jobType: checked
                        ? [...current, type]
                        : current.filter((t: string) => t !== type),
                    });
                  }}
                >
                  {type}
                </DropdownMenuCheckboxItem>
              ))}
            </>
          ) : (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Skills
              </DropdownMenuLabel>
              {freelancerSkills.map((skill) => (
                <DropdownMenuCheckboxItem
                  key={skill}
                  checked={filters.skills?.includes(skill)}
                  onCheckedChange={(checked) => {
                    const current = filters.skills || [];
                    onFiltersChange({
                      skills: checked
                        ? [...current, skill]
                        : current.filter((s: string) => s !== skill),
                    });
                  }}
                >
                  {skill}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Experience Level
              </DropdownMenuLabel>
              {experienceLevels.map((level) => (
                <DropdownMenuCheckboxItem
                  key={level}
                  checked={filters.experienceLevel?.includes(level)}
                  onCheckedChange={(checked) => {
                    const current = filters.experienceLevel || [];
                    onFiltersChange({
                      experienceLevel: checked
                        ? [...current, level]
                        : current.filter((l: string) => l !== level),
                    });
                  }}
                >
                  {level}
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
