# Jobtolk Algorithm System

Complete algorithm infrastructure for intelligent job matching, user scoring, and discovery feed ranking.

## Overview

The Jobtolk Algorithm System provides:
- **JTS (Jobtolk Score)**: Comprehensive user and job-match scoring
- **Embeddings**: Vector representations for semantic matching
- **Discovery Feed**: Personalized content ranking
- **Explainable AI**: Transparent ranking with explanations

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

### 3. TypeScript Errors (Expected)

The current TypeScript errors you're seeing are **EXPECTED** and will resolve after:
1. Running the database migrations
2. Regenerating the Supabase TypeScript types

The errors indicate that the new tables (`profile_embeddings`, `job_embeddings`, `user_jts_scores`, etc.) don't exist in the current type definitions yet.

## File Structure

```
src/lib/algorithm/
├── api.ts                   # Main API interface (use this!)
├── embeddingsService.ts     # Vector embeddings generation
├── jtsService.ts           # JTS score calculation
├── index.ts                # Package exports
└── README.md               # This file
```

## Usage

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

The enhanced search functionality in `useSearch.ts` already includes:
- Fuzzy skill matching
- Service category matching
- Client-side relevance scoring

The algorithm system adds:
- Semantic similarity via embeddings
- User credibility scoring
- Engagement-based ranking

## Next Steps

1. **Run Migrations**: Apply the algorithm system migration
2. **Regenerate Types**: Update Supabase TypeScript types
3. **Integration**: Add algorithm calls to your app:
   - Profile update hooks → `initializeUserEmbeddings`
   - Job creation → `initializeJobEmbeddings`
   - Job matching page → `scoreJobMatch`
   - Discovery feed → Use `feed_rankings` table
4. **Testing**: Verify scores make sense for your data

## Production Considerations

### Embeddings
The current implementation uses **mock embeddings**. For production:

1. **Use OpenAI API**:
```typescript
// In embeddingsService.ts, replace generateMockEmbedding with:
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  return response.data[0].embedding;
}
```

2. **Or use alternative embedding services**:
   - Cohere
   - Hugging Face
   - Sentence Transformers (self-hosted)

### Performance
- Embeddings generation can be async (background jobs)
- Cache JTS scores (already implemented)
- Use batch operations for bulk updates
- Index properly for fast queries

### Monitoring
- Track JTS score distribution
- Monitor embedding generation failures
- Log ranking explanations for debugging
- A/B test algorithm weights

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
✅ **Solution**: Run migrations and regenerate types (see Setup section)

### "Table does not exist" errors
✅ **Solution**: Run `supabase db push` to create tables

### Embeddings not working
✅ **Solution**: Currently using mock embeddings. For production, integrate OpenAI API or similar

### JTS scores seem off
✅ **Solution**: Adjust weights in `algorithm_config` table

### Performance issues
✅ **Solution**: 
- Enable proper indexes (already in migration)
- Use cached scores (`getJobMatchScore` instead of `scoreJobMatch`)
- Batch operations for bulk updates

## Support

For issues or questions:
1. Check this README
2. Review the migration file: `supabase/migrations/20251108000000_jobtolk_algorithm_system.sql`
3. Check database logs for errors
4. Verify all tables exist: `SELECT * FROM pg_tables WHERE schemaname = 'public'`
