# JobTolk Algorithm System

Complete algorithm infrastructure for intelligent job matching, user scoring, and discovery feed ranking.

## Table of Contents
- [Overview](#overview)
- [Quick Start](#quick-start)
- [Setup Required](#setup-required)
- [File Structure](#file-structure)
- [Usage](#usage)
- [JTS Score Components](#jts-score-components)
- [Database Tables](#database-tables)
- [Configuration](#configuration)
- [Integration with Search](#integration-with-search)
- [Next Steps](#next-steps)
- [Production Considerations](#production-considerations)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Implementation Checklist](#implementation-checklist)
- [Dependencies](#dependencies)
- [Support](#support)

## Overview

The JobTolk Algorithm System provides:
- **JTS (JobTolk Score)**: Comprehensive user and job-match scoring
- **Embeddings**: Vector representations for semantic matching
- **Discovery Feed**: Personalized content ranking
- **Explainable AI**: Transparent ranking with explanations

## Quick Start

**Current Status**: 📋 Planning & Design Phase

1. ✅ Database schema ready - Run migrations
2. ⚠️ Service files need implementation
3. ⏳ Integration pending service completion

**To get started**:
```bash
# Step 1: Apply database migrations
supabase db push

# Step 2: Regenerate types
npm run generate-types

# Step 3: Implement service files (see Implementation Checklist)
```

## Setup Required

### 1. Run Database Migrations

The algorithm system requires new database tables. Run the migrations:

```bash
# Using Supabase CLI
supabase db push

# Or apply the specific migration
supabase migration up 20251108000000_jobtolk_algorithm_system
```

### 2. Regenerate TypeScript Types

After running migrations, regenerate Supabase types:

```bash
npm run generate-types
# or
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### 3. Implementation Status

⚠️ **IMPORTANT**: The algorithm service implementation is **in progress**. Currently:
- ✅ Database schema is complete (migration file ready)
- ✅ Documentation is complete
- ⚠️ Service implementation files need to be created:
  - `embeddingsService.ts`
  - `jtsService.ts`
  - `index.ts`
  - Complete `api.ts`

### 4. TypeScript Errors (Expected)

The current TypeScript errors you're seeing are **EXPECTED** and will resolve after:
1. Running the database migrations
2. Regenerating the Supabase TypeScript types

The errors indicate that the new tables (`profile_embeddings`, `job_embeddings`, `user_jts_scores`, etc.) don't exist in the current type definitions yet.

## File Structure

### Current State
```
src/lib/algorithm/
├── api.ts                   # Main API interface (empty - needs implementation)
└── README.md               # This file
```

### Planned Structure
```
src/lib/algorithm/
├── api.ts                   # Main API interface
├── embeddingsService.ts     # Vector embeddings generation (TODO)
├── jtsService.ts           # JTS score calculation (TODO)
├── index.ts                # Package exports (TODO)
└── README.md               # This file
```

## Usage

⚠️ **Note**: The following examples show the intended API. Implementation is pending.

### Initialize User Embeddings

When a user completes their profile or updates skills:

```typescript
import { initializeUserEmbeddings } from '@/lib/algorithm';

// After profile update
await initializeUserEmbeddings(userId);
```

### Initialize Job Embeddings

When a job is posted:

```typescript
import { initializeJobEmbeddings } from '@/lib/algorithm';

// After job creation
await initializeJobEmbeddings(jobId);
```

### Calculate Job Match Score

Get JTS score for a user-job match:

```typescript
import { scoreJobMatch, getJobMatchScore } from '@/lib/algorithm';

// Calculate fresh score
const jts = await scoreJobMatch(userId, jobId);

// Or get cached score (faster)
const cachedJts = await getJobMatchScore(userId, jobId);

console.log(jts.totalJTS); // Overall score (0-100)
console.log(jts.skillMatchScore); // Skill match component
console.log(jts.engagementScore); // Engagement component
console.log(jts.credibilityScore); // Credibility component
console.log(jts.recencyBoost); // Recency boost
```

### Update User's Overall JTS

Refresh a user's overall score:

```typescript
import { refreshUserScore } from '@/lib/algorithm';

// After user completes a job, gets a rating, posts content, etc.
await refreshUserScore(userId);
```

### Initialize Content Embeddings

For discovery feed:

```typescript
import { initializeContentEmbeddings } from '@/lib/algorithm';

// After video upload
await initializeContentEmbeddings(videoId, 'video');
```

## JTS Score Components

### 1. Skill Match Score (35% weight)
- Compares user skills with job requirements
- Exact matches score higher than partial matches
- Fuzzy matching included

### 2. Engagement Score (25% weight)
- Calculated from user's content engagement
- Includes: views, likes, comments, shares
- Based on last 30 days

### 3. Credibility Score (25% weight)
- Profile completion
- Average rating
- Jobs completed
- Total ratings received

### 4. Recency Boost (15% weight)
- Recent activity gets higher score
- Last 24 hours: 15 points
- Last 7 days: 10 points
- Last 30 days: 5 points
- Older: 0 points

## Database Tables

### Embeddings Tables
- `skill_embeddings` - Skill vector representations
- `profile_embeddings` - User profile vectors
- `job_embeddings` - Job requirement vectors
- `content_embeddings` - Video/post vectors

### JTS Tables
- `user_jts_scores` - Overall user scores
- `job_match_jts` - Cached job-user match scores
- `algorithm_config` - Configurable weights

### Supporting Tables
- `engagement_events` - User interaction tracking
- `feed_rankings` - Personalized feed cache
- `ranking_logs` - Explainable AI logs

## Configuration

Adjust JTS weights in the database:

```sql
UPDATE algorithm_config
SET config_value = '{"skill_match": 0.40, "engagement": 0.30, "credibility": 0.20, "recency": 0.10}'::jsonb
WHERE config_name = 'jts_weights_v1';
```

## Integration with Search

### Current Search Capabilities
The existing search in `useSearch.ts` provides:
- ✅ Fuzzy skill matching
- ✅ Service category matching
- ✅ Client-side relevance scoring

### Algorithm System Enhancements
Once implemented, the algorithm system will add:
- 🔄 **Semantic similarity** via embeddings (understands intent, not just keywords)
- 🔄 **User credibility scoring** (prioritizes verified/highly-rated users)
- 🔄 **Engagement-based ranking** (surfaces popular and trending content)
- 🔄 **Personalized recommendations** (matches based on user preferences)

### Integration Points
1. **Search Results**: Sort by JTS score
2. **Job Recommendations**: Use `job_match_jts` table
3. **Discovery Feed**: Use `feed_rankings` table
4. **User Profiles**: Display overall JTS score

## Next Steps

### Phase 1: Setup (Ready)
1. **Run Migrations**: Apply the algorithm system migration
   ```bash
   supabase db push
   ```
2. **Regenerate Types**: Update Supabase TypeScript types
   ```bash
   npm run generate-types
   ```

### Phase 2: Implementation (TODO)
1. **Create Service Files**:
   - `embeddingsService.ts` - Vector embedding generation
   - `jtsService.ts` - JTS score calculations
   - `index.ts` - Public API exports
   - Complete `api.ts` - Main interface implementation

2. **Implement Core Functions**:
   - `initializeUserEmbeddings()`
   - `initializeJobEmbeddings()`
   - `scoreJobMatch()`
   - `getJobMatchScore()`
   - `refreshUserScore()`
   - `initializeContentEmbeddings()`

### Phase 3: Integration
1. **Add Algorithm Calls**:
   - Profile update hooks → `initializeUserEmbeddings`
   - Job creation → `initializeJobEmbeddings`
   - Job matching page → `scoreJobMatch`
   - Discovery feed → Use `feed_rankings` table

2. **Testing**: Verify scores make sense for your data

## Production Considerations

### Embeddings
When implementing `embeddingsService.ts`, you'll need to choose an embedding provider:

#### Option 1: OpenAI API (Recommended)
```bash
# Install dependency
npm install openai
```

```typescript
// In embeddingsService.ts
import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: process.env.VITE_OPENAI_API_KEY 
});

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small', // or 'text-embedding-ada-002'
    input: text,
  });
  return response.data[0].embedding;
}
```

#### Option 2: Alternative Embedding Services
- **Cohere** - Good performance, competitive pricing
- **Hugging Face** - Open source models
- **Sentence Transformers** - Self-hosted option
- **Voyage AI** - Optimized for retrieval

#### Option 3: Mock Embeddings (Development Only)
For testing without API costs:
```typescript
function generateMockEmbedding(text: string, dimensions = 1536): number[] {
  // Deterministic mock based on text hash
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const rng = () => {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
  
  return Array.from({ length: dimensions }, () => rng() * 2 - 1);
}
```

### Performance Optimization
1. **Async Processing**: Generate embeddings in background jobs
2. **Caching**: Use `getJobMatchScore()` for cached results
3. **Batch Operations**: Bulk update scores for multiple users/jobs
4. **Database Indexes**: Already configured in migration (ivfflat for vector search)
5. **Rate Limiting**: Implement API rate limits for embedding providers

### Monitoring & Analytics
1. **Score Distribution**: Track JTS score ranges across users
2. **Embedding Quality**: Monitor generation success/failure rates
3. **Ranking Explanations**: Use `ranking_logs` table for debugging
4. **A/B Testing**: Experiment with different algorithm weights
5. **Performance Metrics**: Track query response times

### Security & Environment Variables
Add to your `.env` file:
```bash
# Embedding Provider (choose one)
VITE_OPENAI_API_KEY=sk-...
VITE_COHERE_API_KEY=...

# Feature Flags
VITE_ENABLE_EMBEDDINGS=true
VITE_ENABLE_JTS_SCORING=true
```

## API Reference

### Main Functions

#### `initializeUserEmbeddings(userId: string): Promise<void>`
Generate and store embeddings for a user profile.

#### `initializeJobEmbeddings(jobId: string): Promise<void>`
Generate and store embeddings for a job posting.

#### `scoreJobMatch(userId: string, jobId: string): Promise<JTSComponents>`
Calculate and store JTS score for a user-job match.

#### `getJobMatchScore(userId: string, jobId: string): Promise<JTSComponents>`
Get cached JTS score, or calculate if not available.

#### `refreshUserScore(userId: string): Promise<void>`
Update user's overall JTS score based on recent activity.

#### `initializeContentEmbeddings(contentId: string, contentType: 'video' | 'post' | 'portfolio'): Promise<void>`
Generate embeddings for content (discovery feed).

### Types

```typescript
interface JTSComponents {
  skillMatchScore: number;      // 0-100
  engagementScore: number;       // 0-100
  credibilityScore: number;      // 0-100
  recencyBoost: number;          // 0-15
  totalJTS: number;              // 0-100 (weighted average)
}

interface JTSWeights {
  skill_match: number;    // Default: 0.35
  engagement: number;     // Default: 0.25
  credibility: number;    // Default: 0.25
  recency: number;        // Default: 0.15
}
```

## Troubleshooting

### TypeScript Errors
**Problem**: Type errors for `profile_embeddings`, `job_embeddings`, etc.

**Solution**: Run migrations and regenerate types:
```bash
supabase db push
npm run generate-types
```

### "Table does not exist" errors
**Problem**: Database queries fail with table not found.

**Solution**: Apply the migration:
```bash
supabase db push
```

### Implementation Files Missing
**Problem**: Cannot import functions from `@/lib/algorithm`.

**Solution**: This is expected. Service files need to be created (see Implementation Checklist).

### Embeddings API Errors
**Problem**: Rate limits or API key errors.

**Solution**:
- Verify API key is set in `.env`
- Implement rate limiting and retry logic
- Consider using batch embedding endpoints
- For development, use mock embeddings

### JTS Scores Seem Incorrect
**Problem**: Scores don't reflect actual user quality.

**Solution**:
1. Check if all score components are calculated
2. Adjust weights in `algorithm_config` table
3. Verify engagement data is being tracked
4. Review the scoring logic in `jtsService.ts`

### Performance Issues
**Problem**: Slow query responses or timeouts.

**Solution**:
- Verify indexes exist: `\d+ profile_embeddings` in psql
- Use cached scores (`getJobMatchScore` vs `scoreJobMatch`)
- Implement background jobs for embedding generation
- Consider pagination for large result sets

## Implementation Checklist

### Phase 1: Foundation (Completed)
- [x] Database schema design
- [x] Migration file created (`20251108000000_jobtolk_algorithm_system.sql`)
- [x] Documentation written
- [x] Algorithm folder structure

### Phase 2: Core Services (TODO)
- [ ] Create `embeddingsService.ts`
  - [ ] Implement embedding generation (OpenAI/Cohere/Mock)
  - [ ] Add error handling and retries
  - [ ] Implement batch processing
- [ ] Create `jtsService.ts`
  - [ ] Implement skill matching algorithm
  - [ ] Calculate engagement scores
  - [ ] Calculate credibility scores
  - [ ] Calculate recency boost
  - [ ] Combine into total JTS
- [ ] Create `index.ts`
  - [ ] Export all public APIs
  - [ ] Add TypeScript types
- [ ] Complete `api.ts`
  - [ ] Implement all documented functions
  - [ ] Add input validation
  - [ ] Add error handling

### Phase 3: Testing
- [ ] Unit tests for scoring algorithms
- [ ] Integration tests with database
- [ ] Mock API tests
- [ ] Performance benchmarks

### Phase 4: Integration
- [ ] Hook into profile update flows
- [ ] Hook into job creation flows
- [ ] Update search to use JTS scores
- [ ] Update discovery feed ranking

### Phase 5: Production
- [ ] Add monitoring and logging
- [ ] Set up environment variables
- [ ] Deploy database migrations
- [ ] Enable feature flags
- [ ] Monitor performance and scores

## Dependencies

Required npm packages (add as needed):
```bash
# For OpenAI embeddings
npm install openai

# For Cohere embeddings (alternative)
npm install cohere-ai

# Already installed in project
# - @supabase/supabase-js (database access)
# - zod (input validation - recommended)
```

## Support

For issues or questions:
1. Check this README first
2. Review the migration file: `supabase/migrations/20251108000000_jobtolk_algorithm_system.sql`
3. Verify tables exist:
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename LIKE '%embedding%' OR tablename LIKE '%jts%';
   ```
4. Check Supabase logs for errors
5. Review the implementation checklist above
