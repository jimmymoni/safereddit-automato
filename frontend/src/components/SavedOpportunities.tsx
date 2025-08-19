import React, { useState, useEffect } from 'react';
import { OpportunityGrid, OpportunityGridVertical } from './ui/OpportunityGrid';
import { 
  OpportunityCard, 
  OpportunityCardHeader, 
  OpportunityCardTitle, 
  OpportunityCardMetrics, 
  OpportunityCardTags, 
  OpportunityCardActions 
} from './ui/OpportunityCard';

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

interface SavedOpportunitiesProps {
  className?: string;
}

export const SavedOpportunities: React.FC<SavedOpportunitiesProps> = ({ className = '' }) => {
  const [savedOpportunities, setSavedOpportunities] = useState<SavedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedOpportunities();
  }, []);

  const fetchSavedOpportunities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/saved-opportunities', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch saved opportunities');
      }

      const data = await response.json();
      setSavedOpportunities(data.data.opportunities || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveOpportunity = async (opportunityId: string) => {
    try {
      const response = await fetch(`/api/saved-opportunities/${opportunityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove saved opportunity');
      }

      // Remove from local state
      setSavedOpportunities(prev => prev.filter(opp => opp.id !== opportunityId));
    } catch (err) {
      console.error('Error removing saved opportunity:', err);
    }
  };

  const handleViewStrategy = (opportunity: SavedOpportunity) => {
    // Create a basic strategy view for now - later we can make this a proper modal
    const strategy = `
📋 AI ENGAGEMENT STRATEGY for "${opportunity.title}"

🎯 OPPORTUNITY TYPE: ${opportunity.opportunity.type.replace('_', ' ').toUpperCase()}

💡 REASONING:
${opportunity.opportunity.reasoning}

🚀 SUGGESTED ACTION:
${opportunity.suggestedAction.content}

⏰ TIMING: ${opportunity.suggestedAction.timing}
📊 CONFIDENCE: ${opportunity.suggestedAction.confidence}%
🎢 RISK LEVEL: ${opportunity.opportunity.riskLevel.toUpperCase()}

💰 POTENTIAL VALUE: ${opportunity.opportunity.potentialValue}/100

🎯 STRATEGY FIT:
${opportunity.opportunity.strategyFit}

📍 SUBREDDIT: ${opportunity.subreddit}
👤 ORIGINAL AUTHOR: u/${opportunity.author}
`;
    
    alert(strategy);
  };

  const handleOpenThread = (opportunity: SavedOpportunity) => {
    window.open(opportunity.url, '_blank');
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-notion-text-medium">Loading saved opportunities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-status-alert">Error: {error}</div>
      </div>
    );
  }

  if (savedOpportunities.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
        <div className="text-6xl mb-4">📌</div>
        <h3 className="text-notion-lg text-notion-text-dark mb-2">No Saved Opportunities</h3>
        <p className="text-notion-text-medium max-w-md">
          Start exploring opportunities and save the ones you find interesting to access them later.
        </p>
      </div>
    );
  }

  const recentlySaved = savedOpportunities
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
    .slice(0, 6);

  const bySubreddit = savedOpportunities.reduce((acc, opp) => {
    const subreddit = opp.subreddit.replace('r/', '');
    if (!acc[subreddit]) {
      acc[subreddit] = [];
    }
    acc[subreddit].push(opp);
    return acc;
  }, {} as Record<string, SavedOpportunity[]>);

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-notion-xl text-notion-text-dark mb-2">Saved Opportunities</h1>
          <p className="text-notion-text-medium">
            {savedOpportunities.length} saved opportunity{savedOpportunities.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Recently Saved */}
      <OpportunityGrid title="Recently Saved" subtitle="Your most recently saved opportunities">
        {recentlySaved.map((opportunity) => (
          <div key={opportunity.id} className="min-w-[400px]">
            <OpportunityCard>
              <OpportunityCardHeader
                subreddit={opportunity.subreddit.replace('r/', '')}
                timestamp={`Saved ${new Date(opportunity.savedAt).toLocaleDateString()}`}
                status={opportunity.opportunity.riskLevel === 'low' ? 'fresh' : 'hot'}
              />
              <OpportunityCardTitle>{opportunity.title}</OpportunityCardTitle>
              <OpportunityCardMetrics
                upvotes={opportunity.score}
                comments={opportunity.commentCount}
                engagementRate={`${opportunity.suggestedAction.confidence}% confidence`}
              />
              <OpportunityCardTags
                opportunityType={opportunity.opportunity.type.replace('_', ' ')}
                competition={opportunity.opportunity.riskLevel}
                timing={opportunity.suggestedAction.timing}
              />
              <OpportunityCardActions
                onViewStrategy={() => handleViewStrategy(opportunity)}
                onOpenThread={() => handleOpenThread(opportunity)}
                onUnsave={() => handleUnsaveOpportunity(opportunity.id)}
                isSaved={true}
              />
            </OpportunityCard>
          </div>
        ))}
      </OpportunityGrid>

      {/* By Subreddit */}
      {Object.entries(bySubreddit).map(([subreddit, opportunities]) => (
        <OpportunityGridVertical 
          key={subreddit}
          title={`r/${subreddit}`} 
          subtitle={`${opportunities.length} saved opportunity${opportunities.length !== 1 ? 's' : ''}`}
          columns={2}
        >
          {opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id}>
              <OpportunityCardHeader
                subreddit={subreddit}
                timestamp={`Saved ${new Date(opportunity.savedAt).toLocaleDateString()}`}
                status={opportunity.opportunity.riskLevel === 'low' ? 'fresh' : 'hot'}
              />
              <OpportunityCardTitle>{opportunity.title}</OpportunityCardTitle>
              <OpportunityCardMetrics
                upvotes={opportunity.score}
                comments={opportunity.commentCount}
                engagementRate={`${opportunity.suggestedAction.confidence}% confidence`}
              />
              <OpportunityCardTags
                opportunityType={opportunity.opportunity.type.replace('_', ' ')}
                competition={opportunity.opportunity.riskLevel}
                timing={opportunity.suggestedAction.timing}
              />
              <OpportunityCardActions
                onViewStrategy={() => handleViewStrategy(opportunity)}
                onOpenThread={() => handleOpenThread(opportunity)}
                onUnsave={() => handleUnsaveOpportunity(opportunity.id)}
                isSaved={true}
              />
            </OpportunityCard>
          ))}
        </OpportunityGridVertical>
      ))}
    </div>
  );
};