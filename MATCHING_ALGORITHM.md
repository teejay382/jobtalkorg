# Jobtolk Intelligent Matching Algorithm

## Overview

The Jobtolk Matching Algorithm is a sophisticated system that connects freelancers with relevant job opportunities and helps employers discover the best talent. It uses a multi-factor scoring system that considers skills, location, experience, reputation, and user behavior to provide personalized recommendations.

## Architecture

### Core Components

1. **Database Schema** - Tables for jobs, applications, ratings, interactions, and statistics
2. **Matching Functions** - PostgreSQL functions for calculating match scores
3. **Service Layer** - TypeScript service for interacting with the matching system
4. **UI Components** - React components for displaying matches
5. **Learning System** - Tracks user interactions to improve future recommendations

## Matching Algorithm Details

### Scoring Components

The algorithm calculates a total match score (0-100) based on multiple weighted factors:

#### 1. Skill Score (40% weight)
- **Method**: String similarity matching between user skills and job requirements
- **Calculation**: 
  - Compares user's skills and service categories against required job skills
  - Case-insensitive matching
  - Returns percentage of required skills matched
- **Formula**: `(matched_skills / total_required_skills) * 100`
- **Threshold**: Minimum 30-40% skill match required

**Example**:
```
Job requires: ["JavaScript", "React", "TypeScript"]
User has: ["JavaScript", "React", "Node.js"]
Skill Score: (2/3) * 100 = 66.67%
```

#### 2. Location Score (30% weight for local jobs)
- **Method**: Distance-based scoring using Haversine formula
- **Scoring Tiers**:
  - ≤ 10 km: 100% (Excellent)
  - ≤ 25 km: 80% (Good)
  - ≤ 50 km: 50% (Fair)
  - > 50 km: 20% (Poor)
- **Remote Jobs**: Automatic 100% score

#### 3. Reputation Score (30% weight)
- **Method**: Average rating converted to percentage
- **Calculation**: `((avg_rating - 1) / 4) * 100`
- **Boosts**:
  - 10+ ratings: 110% multiplier (confidence boost)
  - 5-9 ratings: 105% multiplier
- **New Users**: Default 50% score (neutral)

**Example**:
```
User rating: 4.5/5 with 12 reviews
Base score: ((4.5 - 1) / 4) * 100 = 87.5%
With boost: 87.5 * 1.1 = 96.25%
```

### Total Score Calculation

```typescript
total_score = (
  (skill_score * 0.40) +
  (location_score * 0.30) +
  (reputation_score * 0.30)
)
```

For users:
```typescript
total_score = (
  (skill_score * 0.60) +
  (location_score * 0.40)
)
```

## Database Schema

### Jobs Table
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  employer_id UUID REFERENCES profiles(user_id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  job_type TEXT CHECK (job_type IN ('remote', 'local', 'hybrid')),
  
  -- Skills
  required_skills TEXT[] NOT NULL,
  optional_skills TEXT[],
  experience_level TEXT,
  
  -- Location (for local jobs)
  location_city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  max_distance_km DOUBLE PRECISION,
  
  -- Compensation
  pay_rate_min DECIMAL(10, 2),
  pay_rate_max DECIMAL(10, 2),
  pay_rate_type TEXT,
  
  -- Metadata
  urgency_level TEXT,
  status TEXT DEFAULT 'open',
  applications_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
```

### User Statistics Table
```sql
CREATE TABLE user_statistics (
  user_id UUID PRIMARY KEY,
  
  -- Profile metrics
  profile_completeness_score DECIMAL(5, 2) DEFAULT 0,
  
  -- Activity metrics
  total_jobs_completed INTEGER DEFAULT 0,
  total_applications_sent INTEGER DEFAULT 0,
  response_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- Reputation metrics
  avg_rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  trust_score DECIMAL(5, 2) DEFAULT 50,
  
  last_active_at TIMESTAMPTZ
);
```

### User Interactions Table (Learning System)
```sql
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(user_id),
  target_type TEXT CHECK (target_type IN ('job', 'profile', 'video')),
  target_id UUID,
  interaction_type TEXT CHECK (interaction_type IN (
    'view', 'click', 'apply', 'save', 'contact', 'hire', 'accept'
  )),
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Matching Functions

### 1. Skill Similarity Calculator
```sql
CREATE FUNCTION calculate_skill_similarity(
  user_skills TEXT[],
  required_skills TEXT[]
)
RETURNS DECIMAL(5, 2)
```

**Purpose**: Calculates percentage of required skills that match user's skills
**Algorithm**: String array intersection with case-insensitive comparison
**Returns**: Score from 0 to 100

### 2. Find Matches for User
```sql
CREATE FUNCTION find_matches_for_user(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (job_id, title, skill_score, location_score, total_score, ...)
```

**Purpose**: Find and rank jobs that match a user's profile
**Process**:
1. Fetch all open jobs
2. Calculate skill score for each
3. Calculate location score based on distance
4. Combine scores with weights
5. Filter by minimum skill threshold
6. Sort by total score descending
7. Return top N results

### 3. Find Matches for Job
```sql
CREATE FUNCTION find_matches_for_job(
  p_job_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (user_id, username, skill_score, reputation_score, total_score, ...)
```

**Purpose**: Find and rank freelancers that match a job's requirements
**Process**:
1. Fetch all active freelancers
2. Calculate skill match score
3. Calculate location score (if local job)
4. Include reputation score from ratings
5. Combine scores with weights
6. Sort by total score
7. Return top N candidates

## Service Layer API

### TypeScript Service (`matchingService.ts`)

```typescript
// Find matching jobs for a user
async function findMatchesForUser(
  userId: string,
  limit: number = 50
): Promise<JobMatch[]>

// Find matching talent for a job
async function findMatchesForJob(
  jobId: string,
  limit: number = 50
): Promise<TalentMatch[]>

// Track user interaction
async function trackInteraction(
  userId: string,
  targetType: 'job' | 'profile' | 'video',
  targetId: string,
  interactionType: string,
  source?: string,
  metadata?: object
): Promise<void>

// Apply to a job
async function applyToJob(
  jobId: string,
  applicantId: string,
  coverLetter?: string,
  proposedRate?: number
): Promise<Application>

// Submit a rating
async function submitRating(
  jobId: string,
  ratedUserId: string,
  raterUserId: string,
  rating: number,
  reviewText?: string
): Promise<Rating>
```

## Learning System

### How It Works

The system tracks all user interactions to learn preferences and improve matches over time:

1. **Interaction Tracking**
   - Every click, view, application tracked
   - Stores context (source, timestamp, metadata)
   - Links user to target (job/profile)

2. **Behavioral Signals**
   - **Strong signals**: Apply, Hire, Accept
   - **Medium signals**: Save, Contact
   - **Weak signals**: Click, View

3. **Future Enhancements** (not yet implemented)
   - Collaborative filtering (users like you also liked...)
   - Preference learning (adjust weights based on accepted jobs)
   - A/B testing different scoring formulas
   - Time-decay for old interactions

### Interaction Types

| Type | Weight | Description |
|------|--------|-------------|
| `apply` | High | User applied to job |
| `hire` | High | Employer hired user |
| `accept` | High | User accepted offer |
| `contact` | Medium | User contacted employer |
| `save` | Medium | User saved job |
| `click` | Low | User clicked on job |
| `view` | Low | User viewed job details |

## Trust Score System

A composite score (0-100) that represents user credibility:

### Components

1. **Base Score**: 50 (neutral starting point)

2. **Rating Bonus** (±25 points):
   ```
   bonus = ((avg_rating - 3.0) / 2.0) * 25
   ```
   - 5-star avg: +25 points
   - 3-star avg: 0 points
   - 1-star avg: -25 points (capped at -15)

3. **Completion Bonus** (+15 points):
   ```
   bonus = (accepted_apps / total_apps) * 15
   ```

4. **Response Bonus** (+10 points):
   ```
   bonus = (response_rate / 100) * 10
   ```

5. **Verification Bonus** (+10 points):
   - Verified users get flat +10 boost

**Example Calculation**:
```
User: 4.5 rating, 20 applications (15 accepted), 80% response rate, verified
Base: 50
Rating: ((4.5 - 3) / 2) * 25 = +18.75
Completion: (15/20) * 15 = +11.25
Response: 0.80 * 10 = +8
Verification: +10
Total: 50 + 18.75 + 11.25 + 8 + 10 = 98
```

## Usage Examples

### For Freelancers

```typescript
import { findMatchesForUser, trackInteraction, applyToJob } from '@/lib/matchingService';

// Get personalized job recommendations
const { data: matches } = await findMatchesForUser(userId, 50);

// Track when user views a job
await trackInteraction(userId, 'job', jobId, 'view', 'matches');

// Apply to a job
await applyToJob(jobId, userId, coverLetter, proposedRate);
```

### For Employers

```typescript
import { findMatchesForJob, submitRating } from '@/lib/matchingService';

// Find best talent for a job
const { data: candidates } = await findMatchesForJob(jobId, 30);

// Rate a freelancer after job completion
await submitRating(jobId, freelancerId, employerId, 5, "Excellent work!");
```

## Performance Optimization

### Indexes

```sql
-- Skills search
CREATE INDEX idx_jobs_required_skills ON jobs USING GIN(required_skills);

-- Location queries
CREATE INDEX idx_jobs_location ON jobs(latitude, longitude);

-- Status filtering
CREATE INDEX idx_jobs_status ON jobs(status) WHERE status = 'open';

-- Interactions analysis
CREATE INDEX idx_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_interactions_target ON user_interactions(target_type, target_id);
```

### Caching Strategy

1. **Match Scores Cache Table**:
   - Pre-calculate and store match scores
   - Refresh periodically or on profile updates
   - Reduces real-time computation

2. **User Statistics Cache**:
   - Store aggregated metrics
   - Update on rating/application changes
   - Faster lookup than calculating on-the-fly

## Testing Recommendations

1. **Unit Tests**
   - Test skill similarity calculations
   - Test score weighting logic
   - Test edge cases (empty skills, no ratings)

2. **Integration Tests**
   - Test end-to-end matching flow
   - Test interaction tracking
   - Test rating system updates

3. **Performance Tests**
   - Benchmark matching queries
   - Test with large datasets (10K+ users, 1K+ jobs)
   - Monitor query execution plans

## Future Enhancements

### Phase 2: AI-Powered Matching

1. **Semantic Skill Matching**
   ```typescript
   // Use embeddings for skill similarity
   // "React Developer" matches "Frontend Engineer"
   const embedding = await getSkillEmbedding(skill);
   const similarity = cosineSimilarity(embedding1, embedding2);
   ```

2. **Collaborative Filtering**
   ```
   Users similar to you also applied to:
   - Job X (85% match)
   - Job Y (80% match)
   ```

3. **Preference Learning**
   ```
   Learn from accepted/rejected jobs:
   - Increase weight for preferred job types
   - Adjust location preferences
   - Learn pay rate expectations
   ```

### Phase 3: Advanced Features

1. **Personalized Weight Adjustment**
   - Each user has custom scoring weights
   - Adjust based on interaction patterns

2. **Time-Based Decay**
   - Recent interactions weighted more
   - Old preferences gradually forgotten

3. **A/B Testing Framework**
   - Test different scoring formulas
   - Measure conversion rates
   - Optimize for applications/hires

4. **Explainable Recommendations**
   ```
   "This job matches you because:
   - 95% skill match (React, TypeScript)
   - Only 5km away
   - Employer rated 4.8/5"
   ```

## Monitoring & Analytics

### Key Metrics

1. **Match Quality**
   - Application rate per match shown
   - Hire rate from matches
   - User satisfaction scores

2. **System Performance**
   - Average query time
   - Cache hit rates
   - Database load

3. **User Engagement**
   - Matches clicked vs shown
   - Time spent on match pages
   - Return rate to match page

### Dashboard Queries

```sql
-- Match conversion rate
SELECT 
  COUNT(*) FILTER (WHERE interaction_type = 'apply') * 100.0 / 
  COUNT(*) FILTER (WHERE interaction_type = 'view') as conversion_rate
FROM user_interactions
WHERE target_type = 'job' AND source = 'matches';

-- Average match score for successful hires
SELECT AVG(ms.total_score)
FROM match_scores ms
JOIN job_applications ja ON ja.job_id = ms.job_id AND ja.applicant_id = ms.user_id
WHERE ja.status = 'accepted';
```

## Deployment Checklist

- [ ] Run database migrations
- [ ] Verify indexes created
- [ ] Test matching functions
- [ ] Populate initial user statistics
- [ ] Set up monitoring dashboards
- [ ] Configure cache refresh schedules
- [ ] Test with production-like data volume
- [ ] Document API endpoints
- [ ] Train support team on system

## Troubleshooting

### Common Issues

1. **No matches found**
   - Check skill overlap between users and jobs
   - Verify minimum threshold not too high
   - Ensure user profile complete

2. **Slow queries**
   - Check index usage with EXPLAIN ANALYZE
   - Consider materializing match scores
   - Reduce result limit

3. **Stale matches**
   - Refresh user statistics
   - Recalculate cached scores
   - Check for outdated job listings

## License

Same as main Jobtolk project.
