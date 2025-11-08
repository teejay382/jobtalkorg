# Jobtolk Algorithm System

An intelligent matching and ranking engine for connecting freelancers with clients.

## 📂 Structure

```
algorithm/
├── embeddingsService.ts    # Vector embeddings generation (OpenAI/Hugging Face)
├── jtsAlgorithm.ts         # Jobtolk Score (JTS) calculation engine
├── discoveryFeed.ts        # Personalized feed ranking system
├── rankingLogs.ts          # Explainable AI transparency layer
├── api.ts                  # Client API interface
└── README.md               # This file
```

## 🚀 Quick Start

### 1. Initialize User

```typescript
import { JobtolkAPI } from '@/lib/algorithm/api';

// When user completes onboarding
await JobtolkAPI.initializeUser(userId);
```

### 2. Get Job Matches

```typescript
// Find best freelancers for a job
const matches = await JobtolkAPI.scoring.findMatches(jobId, 50);

console.log(matches[0]);
// {
//   userId: "...",
//   username: "john_dev",
//   jtsScore: {
//     skillMatchScore: 85,
//     engagementScore: 72,
//     credibilityScore: 68,
//     recencyBoost: 10,
//     totalJTS: 75.3
//   },
//   explanation: {
//     summary: "Matched with 75% confidence...",
//     factors: {
//       positive: ["Strong skill match", "High engagement"],
//       negative: [],
//       neutral: []
//     }
//   }
// }
```

### 3. Generate Discovery Feed

```typescript
// Get personalized feed for user
const feed = await JobtolkAPI.feed.blended(userId, 50);

console.log(feed[0]);
// {
//   contentId: "...",
//   contentType: "video",
//   scores: {
//     relevance: 82,
//     engagement: 75,
//     freshness: 90,
//     diversity: 80,
//     local: 95,
//     total: 84.5
//   },
//   isLocal: true,
//   isTrending: false,
//   explanation: "Recommended because it's from your local area..."
// }
```

### 4. Get Ranking Explanations

```typescript
// See why a user was ranked #1
const logs = await JobtolkAPI.logs.getUserLogs(userId, 'job_match');

console.log(logs[0].explanationText);
// "This freelancer was ranked with a Jobtolk Score of 87/100.
//  ✅ Strengths:
//  - Excellent skill match (85%)
//  - High platform engagement (72/100)
//  - Nearby location"
```

## 🧮 JTS Formula

```
JTS = (Skill Match × 0.35) + (Engagement Score × 0.25) + 
      (Credibility Score × 0.25) + (Recency Boost × 0.15)
```

**Components:**
- **Skill Match (35%):** Keyword + semantic similarity
- **Engagement (25%):** Platform activity & content performance
- **Credibility (25%):** Ratings, completion history, verification
- **Recency (15%):** Recent activity boost

## 📊 API Methods

### Embeddings

```typescript
// Generate profile embedding
await JobtolkAPI.embeddings.generateProfile(userId);

// Generate job embedding
await JobtolkAPI.embeddings.generateJob(jobId);

// Generate content embedding
await JobtolkAPI.embeddings.generateContent(contentId, 'video');
```

### JTS Scoring

```typescript
// Calculate JTS
const jts = await JobtolkAPI.scoring.calculate(userId, jobId, requiredSkills);

// Update stored JTS
await JobtolkAPI.scoring.update(userId);

// Find matches
const matches = await JobtolkAPI.scoring.findMatches(jobId, 50);

// Batch update (background job)
await JobtolkAPI.scoring.batchUpdate(100);
```

### Discovery Feed

```typescript
// Generate fresh feed
const feed = await JobtolkAPI.feed.generate(userId, 50);

// Get cached feed (or generate if expired)
const feed = await JobtolkAPI.feed.get(userId, 50);

// Cache feed for later
await JobtolkAPI.feed.cache(userId);

// Get random discovery
const random = await JobtolkAPI.feed.random(10);

// Get blended local/global feed
const blended = await JobtolkAPI.feed.blended(userId, 50);
```

### Ranking Logs

```typescript
// Log job match
await JobtolkAPI.logs.logJobMatch(userId, jobId, jtsScores, locationScore, similarity, position);

// Log feed ranking
await JobtolkAPI.logs.logFeed(userId, contentId, contentType, scores, position, isLocal, isTrending);

// Log search result
await JobtolkAPI.logs.logSearch(userId, targetId, targetType, query, scores, position, filters);

// Get user's logs
const logs = await JobtolkAPI.logs.getUserLogs(userId);

// Get specific explanation
const explanation = await JobtolkAPI.logs.getExplanation(logId);

// Get statistics
const stats = await JobtolkAPI.logs.getStatistics(userId);
```

## 🔧 Configuration

### Environment Variables

```env
# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...

# Or Hugging Face (free alternative)
HUGGINGFACE_API_KEY=hf_...

# Supabase
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Algorithm Weights

Stored in `algorithm_config` table. To update:

```typescript
// Update JTS weights
await supabase
  .from('algorithm_config')
  .update({
    config_value: {
      skill_match: 0.40,  // Changed from 0.35
      engagement: 0.25,
      credibility: 0.20,  // Changed from 0.25
      recency: 0.15
    }
  })
  .eq('config_name', 'jts_weights_v1');
```

## 🎯 Use Cases

### 1. Job Posting Flow

```typescript
// 1. Client posts a job
const jobId = await createJob(jobData);

// 2. Generate job embedding
await JobtolkAPI.initializeJob(jobId);

// 3. Find matches
const matches = await JobtolkAPI.scoring.findMatches(jobId, 50);

// 4. Show to client
return matches;
```

### 2. User Onboarding

```typescript
// 1. User completes profile
await updateProfile(userId, profileData);

// 2. Initialize algorithm
await JobtolkAPI.initializeUser(userId);

// 3. Generate first feed
const feed = await JobtolkAPI.feed.generate(userId, 50);

// 4. Show personalized feed
return feed;
```

### 3. Content Upload

```typescript
// 1. User uploads video
const videoId = await uploadVideo(videoData);

// 2. Process content
await JobtolkAPI.processContent(videoId, 'video', userId);

// 3. User's JTS updates automatically
// 4. Content appears in relevant feeds
```

### 4. Search Results

```typescript
// 1. User searches for "React developer"
const results = await searchFreelancers(query);

// 2. Rank by JTS
const ranked = results.sort((a, b) => 
  b.jtsScore.totalJTS - a.jtsScore.totalJTS
);

// 3. Log search rankings
for (let i = 0; i < ranked.length; i++) {
  await JobtolkAPI.logs.logSearch(
    userId, 
    ranked[i].id, 
    'profile', 
    query, 
    ranked[i].jtsScore, 
    i + 1
  );
}

return ranked;
```

## 🛠️ Background Jobs

### Daily JTS Updates

```typescript
// Run daily via cron/scheduler
export async function dailyJTSUpdate() {
  // Update all freelancers
  await JobtolkAPI.scoring.batchUpdate(1000);
  
  console.log('JTS scores updated for all users');
}
```

### Feed Cache Refresh

```typescript
// Run hourly
export async function refreshFeedCaches() {
  const { data: users } = await supabase
    .from('profiles')
    .select('user_id')
    .limit(1000);
  
  for (const user of users) {
    await JobtolkAPI.feed.cache(user.user_id);
  }
  
  console.log('Feed caches refreshed');
}
```

### Embedding Generation

```typescript
// Run when new content/users/jobs created
export async function generateMissingEmbeddings() {
  // Check for profiles without embeddings
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id')
    .is('profile_embeddings.user_id', null);
  
  for (const profile of profiles) {
    await JobtolkAPI.embeddings.generateProfile(profile.user_id);
  }
}
```

## 📈 Monitoring

### Key Metrics to Track

```typescript
// 1. Match Acceptance Rate
const acceptanceRate = acceptedMatches / totalMatchesShown;

// 2. Average JTS of Hired Freelancers
const avgHiredJTS = sum(hiredFreelancers.map(f => f.jts)) / hiredFreelancers.length;

// 3. Feed Engagement Rate
const feedEngagement = (feedLikes + feedClicks) / feedImpressions;

// 4. Ranking Log Statistics
const stats = await JobtolkAPI.logs.getStatistics(userId);
```

## 🐛 Debugging

### View Raw Scores

```typescript
const jts = await JobtolkAPI.scoring.calculate(userId);
console.log(jts);
// {
//   skillMatchScore: 75,
//   engagementScore: 60,
//   credibilityScore: 55,
//   recencyBoost: 10,
//   totalJTS: 63.5
// }
```

### Check Embeddings

```typescript
const { data } = await supabase
  .from('profile_embeddings')
  .select('*')
  .eq('user_id', userId)
  .single();

console.log('Has embedding:', !!data?.combined_embedding);
```

### View Ranking Logs

```typescript
const logs = await JobtolkAPI.logs.getUserLogs(userId);
logs.forEach(log => {
  console.log(`${log.logType} - Score: ${log.totalScore}`);
  console.log('Factors:', log.factors);
});
```

## 🔒 Security

- ✅ All operations require authenticated user
- ✅ RLS policies enforce data access control
- ✅ API keys stored in environment variables
- ✅ No user data exposed in ranking logs (only IDs)
- ✅ GDPR-compliant data handling

## 📚 Further Reading

- [Full Documentation](../../JOBTOLK_ALGORITHM_DOCUMENTATION.md)
- [Database Schema](../../supabase/migrations/20251108000000_jobtolk_algorithm_system.sql)
- [Ethical AI Principles](../../JOBTOLK_ALGORITHM_DOCUMENTATION.md#ethical-ai)
- [Phase Roadmap](../../JOBTOLK_ALGORITHM_DOCUMENTATION.md#roadmap)

## 🤝 Support

Questions? Issues? Suggestions?

- **Technical:** Check the full documentation
- **Bugs:** Open an issue
- **Features:** Submit feedback
- **Ethics:** Report concerns to ethics@jobtolk.com
