import { useState, useEffect, useMemo } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import { Input } from '@/components/ui/input';
import { useSearch } from '@/hooks/useSearch';
import { JobCard } from '@/components/search/JobCard';
import { FreelancerCard } from '@/components/search/FreelancerCard';
import { SearchFilters } from '@/components/search/SearchFilters';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'jobs' | 'freelancers'>('freelancers');
  const { 
    jobs, 
    freelancers, 
    loading, 
    filters, 
    searchJobs, 
    searchFreelancers, 
    updateFilters, 
    clearFilters 
  } = useSearch();

  // Update search query in filters when input changes
  useEffect(() => {
    updateFilters({ query: searchQuery });
  }, [searchQuery, updateFilters]);

  // Perform search when filters change
  useEffect(() => {
    if (filters.query || Object.keys(filters).length > 1) {
      if (activeTab === 'jobs') {
        searchJobs(filters);
      } else {
        searchFreelancers(filters);
      }
    }
  }, [filters, activeTab, searchJobs, searchFreelancers]);

  const handleTabChange = (tab: 'jobs' | 'freelancers') => {
    setActiveTab(tab);
    clearFilters();
    setSearchQuery('');
  };

  const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
    updateFilters(newFilters);
  };

  const tabs = [
    { id: 'freelancers' as const, label: 'Freelancers' },
    { id: 'jobs' as const, label: 'Jobs' },
  ];

  const hasResults = activeTab === 'jobs' ? jobs.length > 0 : freelancers.length > 0;
  const hasSearched = filters.query || Object.keys(filters).length > 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <Header />
      
      <main className="pt-20 pb-20 px-4 max-w-4xl mx-auto animate-fade-in">
        {/* Search Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-4">
            Find Your Perfect {activeTab === 'jobs' ? 'Job' : 'Freelancer'}
          </h1>
          
          {/* Search bar */}
          <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab === 'jobs' ? 'jobs' : 'freelancers'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12 rounded-full border-primary/20 focus:border-primary text-base glass-card-premium backdrop-blur-xl hover:border-primary/40 transition-all duration-300 focus:shadow-glass"
            />
          </div>

          {/* Tabs and Filters */}
          <div className="flex items-center justify-between">
            {/* Tab toggles */}
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary via-accent to-primary text-white shadow-[0_0_20px_hsl(var(--primary)/0.5)] border border-primary/30 scale-105'
                      : 'glass-card-premium text-secondary-foreground hover:bg-secondary/80 border border-border hover:border-primary/20 hover:scale-105 active:scale-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Filters */}
            <SearchFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={clearFilters}
              searchType={activeTab}
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {loading && (
            <div className="text-center py-12">
              <div className="relative w-12 h-12 mx-auto mb-4">
                <div className="animate-spin rounded-full w-12 h-12 border-3 border-primary/30 border-t-primary" style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.5)" }} />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 animate-pulse" style={{ filter: "blur(8px)" }} />
              </div>
              <p className="font-medium text-muted-foreground animate-pulse">Searching...</p>
            </div>
          )}

          {!loading && !hasSearched && (
          <div className="text-center py-12">
            <SearchIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Start Your Search
            </h3>
            <p className="text-muted-foreground">
              Enter keywords to find {activeTab === 'jobs' ? 'amazing opportunities' : 'talented freelancers'}
            </p>
          </div>
          )}

          {!loading && hasSearched && !hasResults && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Results Found
              </h3>
              <p className="text-muted-foreground mb-4">
                Try different keywords or adjust your filters
              </p>
              <button
                onClick={clearFilters}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Job Results */}
          {activeTab === 'jobs' && jobs.length > 0 && (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          {/* Freelancer Results */}
          {activeTab === 'freelancers' && freelancers.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {freelancers.map((freelancer) => (
                <FreelancerCard key={freelancer.id} freelancer={freelancer} />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Search;