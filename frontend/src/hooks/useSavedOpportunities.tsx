import { useState, useEffect, useCallback } from 'react';

interface SavedOpportunity {
  id: string;
  type: string;
  subreddit: string;
  title: string;
  author: string;
  content: string;
  score: number;
  commentCount: number;
  postedAgo: string;
  url: string;
  savedAt: string;
  opportunity: {
    type: string;
    reasoning: string;
    strategyFit: string;
    trustBuilding: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    potentialValue: number;
  };
  suggestedAction: {
    type: string;
    content: string;
    timing: string;
    confidence: number;
  };
}

interface UseSavedOpportunitiesReturn {
  savedOpportunities: SavedOpportunity[];
  savedOpportunityIds: Set<string>;
  loading: boolean;
  error: string | null;
  saveOpportunity: (opportunity: any) => Promise<boolean>;
  unsaveOpportunity: (opportunityId: string) => Promise<boolean>;
  isOpportunitySaved: (opportunityId: string) => boolean;
  refreshSavedOpportunities: () => Promise<void>;
}

export const useSavedOpportunities = (): UseSavedOpportunitiesReturn => {
  const [savedOpportunities, setSavedOpportunities] = useState<SavedOpportunity[]>([]);
  const [savedOpportunityIds, setSavedOpportunityIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = () => localStorage.getItem('authToken');

  const fetchSavedOpportunities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        console.warn('No auth token found, using localStorage fallback');
        // Fallback to localStorage for demo purposes
        const savedOpps = JSON.parse(localStorage.getItem('savedOpportunities') || '[]');
        setSavedOpportunities(savedOpps);
        setSavedOpportunityIds(new Set(savedOpps.map((opp: any) => opp.id)));
        setLoading(false);
        return;
      }

      const response = await fetch('/api/saved-opportunities', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch saved opportunities');
      }

      const data = await response.json();
      const opportunities = data.data.opportunities || [];
      
      setSavedOpportunities(opportunities);
      setSavedOpportunityIds(new Set(opportunities.map((opp: SavedOpportunity) => opp.id)));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching saved opportunities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveOpportunity = useCallback(async (opportunity: any): Promise<boolean> => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn('No auth token found, using localStorage fallback');
        // Fallback to localStorage for demo purposes
        const savedOpps = JSON.parse(localStorage.getItem('savedOpportunities') || '[]');
        const newSavedOpp = { ...opportunity, savedAt: new Date().toISOString() };
        savedOpps.push(newSavedOpp);
        localStorage.setItem('savedOpportunities', JSON.stringify(savedOpps));
        
        setSavedOpportunities(prev => [...prev, newSavedOpp]);
        setSavedOpportunityIds(prev => new Set(prev).add(opportunity.id));
        return true;
      }

      const response = await fetch('/api/saved-opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ opportunity })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save opportunity');
      }

      const data = await response.json();
      const savedOpportunity = data.data;

      // Update local state
      setSavedOpportunities(prev => [...prev, savedOpportunity]);
      setSavedOpportunityIds(prev => new Set(prev).add(opportunity.id));

      return true;
    } catch (err) {
      console.error('Error saving opportunity:', err);
      setError(err instanceof Error ? err.message : 'Failed to save opportunity');
      return false;
    }
  }, []);

  const unsaveOpportunity = useCallback(async (opportunityId: string): Promise<boolean> => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn('No auth token found, using localStorage fallback');
        // Fallback to localStorage for demo purposes
        const savedOpps = JSON.parse(localStorage.getItem('savedOpportunities') || '[]');
        const updatedOpps = savedOpps.filter((opp: any) => opp.id !== opportunityId);
        localStorage.setItem('savedOpportunities', JSON.stringify(updatedOpps));
        
        setSavedOpportunities(prev => prev.filter(opp => opp.id !== opportunityId));
        setSavedOpportunityIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(opportunityId);
          return newSet;
        });
        return true;
      }

      const response = await fetch(`/api/saved-opportunities/${opportunityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove saved opportunity');
      }

      // Update local state
      setSavedOpportunities(prev => prev.filter(opp => opp.id !== opportunityId));
      setSavedOpportunityIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(opportunityId);
        return newSet;
      });

      return true;
    } catch (err) {
      console.error('Error removing saved opportunity:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove saved opportunity');
      return false;
    }
  }, []);

  const isOpportunitySaved = useCallback((opportunityId: string): boolean => {
    return savedOpportunityIds.has(opportunityId);
  }, [savedOpportunityIds]);

  const refreshSavedOpportunities = useCallback(async () => {
    await fetchSavedOpportunities();
  }, [fetchSavedOpportunities]);

  // Initial fetch
  useEffect(() => {
    fetchSavedOpportunities();
  }, [fetchSavedOpportunities]);

  return {
    savedOpportunities,
    savedOpportunityIds,
    loading,
    error,
    saveOpportunity,
    unsaveOpportunity,
    isOpportunitySaved,
    refreshSavedOpportunities
  };
};