import { useState } from 'react';

interface RedditUser {
  redditUsername: string;
  postKarma: number;
  commentKarma: number;
  accountHealth: number;
  connected: boolean;
}

export const useRedditUser = () => {
  // Use static mock data for now to ensure fast loading
  // TODO: Add background fetching of real data in next iteration
  const [redditUser] = useState<RedditUser>({
    redditUsername: 'automator',
    postKarma: 1250,
    commentKarma: 3890,
    accountHealth: 95,
    connected: true
  });

  return { 
    redditUser, 
    loading: false, 
    error: null, 
    refetch: () => window.location.reload() 
  };
};