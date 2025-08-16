import { useState, useCallback, useEffect } from 'react';

interface TrendingPost {
  id: string;
  title: string;
  score: number;
  // ... other post properties
}

interface Subscription {
  name: string;
  title: string;
  subscribers: number;
  // ... other subscription properties
}

interface TrendingData {
  posts: TrendingPost[];
  subscriptions: Subscription[];
}

interface CachedData {
  data: TrendingData;
  timestamp: number;
}

export const useTrendingData = (userId: string | null, isConnected: boolean) => {
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<CachedData | null>(null);

  const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!isConnected || !userId) return;
    
    // Check cache first
    const now = Date.now();
    if (!forceRefresh && cache && (now - cache.timestamp) < CACHE_TTL) {
      setTrendingPosts(cache.data.posts);
      setSubscriptions(cache.data.subscriptions);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('reddit_auth_token='))
        ?.split('=')[1];
        
      if (!token) {
        setError('Reddit authentication required');
        return;
      }
      
      // Parallel API calls
      const [trendsResponse, subsResponse] = await Promise.all([
        fetch('http://localhost:8000/api/reddit/trending/subscribed?limit=25', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('http://localhost:8000/api/reddit/subscriptions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);
      
      const [trendsResult, subsResult] = await Promise.all([
        trendsResponse.json(),
        subsResponse.json()
      ]);
      
      if (trendsResult.success && subsResult.success) {
        const posts = trendsResult.data.posts;
        const subs = subsResult.data.subreddits;
        
        setTrendingPosts(posts);
        setSubscriptions(subs);
        
        // Update cache
        setCache({
          data: { posts, subscriptions: subs },
          timestamp: now
        });
      } else {
        setError(trendsResult.error || subsResult.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching trending data:', error);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, userId, cache, CACHE_TTL]);

  // Auto-refresh when user connects (background preload)
  useEffect(() => {
    if (isConnected && userId) {
      fetchData();
    }
  }, [isConnected, userId, fetchData]);

  return {
    trendingPosts,
    subscriptions,
    isLoading,
    error,
    fetchData,
    refreshData: () => fetchData(true)
  };
};