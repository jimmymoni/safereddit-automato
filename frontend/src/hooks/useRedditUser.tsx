import { useState, useEffect } from 'react';

interface RedditUser {
  redditUsername: string;
  postKarma: number;
  commentKarma: number;
  accountHealth: number;
  connected: boolean;
}

export const useRedditUser = () => {
  const [redditUser, setRedditUser] = useState<RedditUser>({
    redditUsername: '',
    postKarma: 0,
    commentKarma: 0,
    accountHealth: 0,
    connected: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // First, try to get JWT token from cookie
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('reddit_auth_token='))
        ?.split('=')[1];

      if (!token) {
        // No token found, user not authenticated
        setRedditUser({
          redditUsername: '',
          postKarma: 0,
          commentKarma: 0,
          accountHealth: 0,
          connected: false
        });
        setLoading(false);
        return;
      }

      // Fetch user data from backend
      const response = await fetch('http://localhost:8000/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        setRedditUser({
          redditUsername: data.user.redditUsername || 'Unknown',
          postKarma: data.user.postKarma || 0,
          commentKarma: data.user.commentKarma || 0,
          accountHealth: data.user.accountHealth || 100,
          connected: true
        });
      } else {
        throw new Error(data.message || 'Invalid user data');
      }
    } catch (err) {
      console.error('Error fetching Reddit user data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Fall back to disconnected state
      setRedditUser({
        redditUsername: '',
        postKarma: 0,
        commentKarma: 0,
        accountHealth: 0,
        connected: false
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return { 
    redditUser, 
    loading, 
    error, 
    refetch: fetchUserData 
  };
};