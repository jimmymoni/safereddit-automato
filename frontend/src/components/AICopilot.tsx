import React, { useState, useEffect } from 'react';

interface EngagementOpportunity {
  id: string;
  type: 'post' | 'comment' | 'thread';
  subreddit: string;
  title: string;
  author: string;
  content: string;
  score: number;
  commentCount: number;
  postedAgo: string;
  opportunity: {
    type: 'comment' | 'upvote' | 'reply' | 'helpful_response';
    reasoning: string;
    strategyFit: string;
    trustBuilding: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    potentialValue: number;
  };
  suggestedAction: {
    type: string;
    content?: string;
    timing: string;
    confidence: number;
  };
}

interface ActionPlan {
  id: string;
  title: string;
  description: string;
  actions: EngagementOpportunity[];
  trustBuildingPhase: 'observer' | 'helper' | 'contributor' | 'thought_leader';
  timeline: string;
  riskAssessment: string;
}

const AICoplot: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<ActionPlan | null>(null);
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  
  // Mock data for demonstration
  const mockActionPlan: ActionPlan = {
    id: "plan_001",
    title: "Community Trust Building - Week 1",
    description: "Focus on helping others and building credibility before any product mentions",
    trustBuildingPhase: "helper",
    timeline: "Next 7 days",
    riskAssessment: "Low risk - pure value-add activities",
    actions: [
      {
        id: "opp_001",
        type: "post",
        subreddit: "r/entrepreneur",
        title: "Struggling with Reddit marketing - any tips?",
        author: "u/startup_founder",
        content: "I've been trying to share my startup journey on Reddit but keep getting downvoted or posts removed. Any advice on how to engage authentically?",
        score: 23,
        commentCount: 8,
        postedAgo: "2 hours ago",
        opportunity: {
          type: "helpful_response",
          reasoning: "Perfect alignment with your expertise in Reddit marketing. User is asking exactly what your tool solves.",
          strategyFit: "Share lessons learned from building SafeReddit - positions you as helpful expert",
          trustBuilding: true,
          riskLevel: "low",
          potentialValue: 85
        },
        suggestedAction: {
          type: "Detailed helpful comment",
          content: "Share your learning journey about Reddit TOS compliance, subreddit culture research, and authentic engagement strategies. Mention challenges you faced without promoting your tool.",
          timing: "Within 1 hour (post is gaining traction)",
          confidence: 92
        }
      },
      {
        id: "opp_002", 
        type: "comment",
        subreddit: "r/SaaS",
        title: "How do you handle API rate limiting in your apps?",
        author: "u/dev_sarah",
        content: "Working with Reddit API and hitting rate limits constantly. Any best practices for handling this gracefully?",
        score: 15,
        commentCount: 3,
        postedAgo: "45 minutes ago",
        opportunity: {
          type: "comment",
          reasoning: "Technical question that aligns with your Reddit API experience. Low-risk knowledge sharing.",
          strategyFit: "Establish technical credibility in the SaaS community",
          trustBuilding: true,
          riskLevel: "low",
          potentialValue: 70
        },
        suggestedAction: {
          type: "Technical response",
          content: "Share specific strategies: exponential backoff, request queuing, caching patterns. Include code snippets if helpful.",
          timing: "Soon (small thread, high visibility for helpful answers)",
          confidence: 88
        }
      },
      {
        id: "opp_003",
        type: "thread",
        subreddit: "r/startups",
        title: "What's the biggest technical challenge you've overcome?",
        author: "u/founder_tales",
        content: "Share your war stories! What technical problem almost killed your startup and how did you solve it?",
        score: 156,
        commentCount: 47,
        postedAgo: "4 hours ago",
        opportunity: {
          type: "reply",
          reasoning: "Hot thread asking for founder stories. Perfect opportunity to share your Reddit compliance challenges without being promotional.",
          strategyFit: "Build founder credibility through authentic story sharing",
          trustBuilding: true,
          riskLevel: "low",
          potentialValue: 75
        },
        suggestedAction: {
          type: "Story-driven comment",
          content: "Share the challenge of building Reddit automation that stays compliant - the technical difficulties, TOS research, safety mechanisms. Focus on the problem-solving journey.",
          timing: "Within 2 hours (thread is hot but not too old)",
          confidence: 80
        }
      }
    ]
  };

  useEffect(() => {
    // Simulate AI analysis
    setIsAnalyzing(true);
    setTimeout(() => {
      setCurrentPlan(mockActionPlan);
      setIsAnalyzing(false);
    }, 2000);
  }, []);

  const toggleOpportunitySelection = (id: string) => {
    setSelectedOpportunities(prev => 
      prev.includes(id) 
        ? prev.filter(oppId => oppId !== id)
        : [...prev, id]
    );
  };

  const selectAllOpportunities = () => {
    if (currentPlan) {
      setSelectedOpportunities(currentPlan.actions.map(action => action.id));
    }
  };

  const clearAllSelections = () => {
    setSelectedOpportunities([]);
  };

  const executeSelectedActions = () => {
    // This would send the approved actions to the backend
    console.log('Executing actions:', selectedOpportunities);
    alert(`Executing ${selectedOpportunities.length} approved actions...`);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'observer': return '👀';
      case 'helper': return '🤝';
      case 'contributor': return '💡';
      case 'thought_leader': return '🎯';
      default: return '🤖';
    }
  };

  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-lg border border-reddit-border p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-reddit-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-reddit-dark mb-2">AI Co-pilot Analyzing</h3>
          <p className="text-reddit-gray">Discovering engagement opportunities in your target communities...</p>
        </div>
      </div>
    );
  }

  if (!currentPlan) {
    return (
      <div className="bg-white rounded-lg border border-reddit-border p-6">
        <p className="text-reddit-gray text-center">No action plan available. Start by sharing your story.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Plan Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-reddit-dark flex items-center">
            <span className="mr-3 text-2xl">🧠</span>
            AI Co-pilot Action Plan
          </h2>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(currentPlan.riskAssessment.split(' ')[0].toLowerCase())}`}>
              {currentPlan.riskAssessment}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <h3 className="text-sm font-medium text-reddit-gray mb-1">Current Phase</h3>
            <div className="flex items-center">
              <span className="mr-2">{getPhaseIcon(currentPlan.trustBuildingPhase)}</span>
              <span className="font-medium text-reddit-dark capitalize">{currentPlan.trustBuildingPhase.replace('_', ' ')}</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-reddit-gray mb-1">Timeline</h3>
            <p className="font-medium text-reddit-dark">{currentPlan.timeline}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-reddit-gray mb-1">Opportunities Found</h3>
            <p className="font-medium text-reddit-dark">{currentPlan.actions.length} high-value actions</p>
          </div>
        </div>
        
        <p className="text-reddit-gray text-sm">{currentPlan.description}</p>
      </div>

      {/* Bulk Actions */}
      <div className="bg-white rounded-lg border border-reddit-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={selectAllOpportunities}
              className="text-sm text-reddit-primary hover:text-reddit-primary/80"
            >
              Select All ({currentPlan.actions.length})
            </button>
            <button
              onClick={clearAllSelections}
              className="text-sm text-reddit-gray hover:text-reddit-dark"
            >
              Clear Selection
            </button>
            <span className="text-sm text-reddit-gray">
              {selectedOpportunities.length} selected
            </span>
          </div>
          
          <button
            onClick={executeSelectedActions}
            disabled={selectedOpportunities.length === 0}
            className="bg-reddit-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-reddit-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Execute Selected Actions ({selectedOpportunities.length})
          </button>
        </div>
      </div>

      {/* Engagement Opportunities */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-reddit-dark">Engagement Opportunities</h3>
        
        {currentPlan.actions.map((opportunity) => (
          <div
            key={opportunity.id}
            className={`bg-white rounded-lg border-2 transition-all ${
              selectedOpportunities.includes(opportunity.id)
                ? 'border-reddit-primary bg-reddit-primary/5'
                : 'border-reddit-border hover:border-reddit-primary/50'
            }`}
          >
            {/* Opportunity Header */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedOpportunities.includes(opportunity.id)}
                    onChange={() => toggleOpportunitySelection(opportunity.id)}
                    className="mt-1 h-4 w-4 text-reddit-primary rounded border-gray-300 focus:ring-reddit-primary"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {opportunity.subreddit}
                      </span>
                      <span className="text-xs text-reddit-gray">
                        by {opportunity.author} • {opportunity.postedAgo}
                      </span>
                      <div className={`text-xs px-2 py-1 rounded border ${getRiskColor(opportunity.opportunity.riskLevel)}`}>
                        {opportunity.opportunity.riskLevel} risk
                      </div>
                    </div>
                    
                    <h4 className="font-medium text-reddit-dark mb-2">{opportunity.title}</h4>
                    <p className="text-sm text-reddit-gray mb-3 line-clamp-2">{opportunity.content}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-reddit-gray">
                      <span>↑ {opportunity.score}</span>
                      <span>💬 {opportunity.commentCount}</span>
                      <span className="font-medium text-green-600">
                        {opportunity.opportunity.potentialValue}% value match
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowDetails(showDetails === opportunity.id ? null : opportunity.id)}
                  className="text-reddit-gray hover:text-reddit-dark ml-4"
                >
                  {showDetails === opportunity.id ? '▲' : '▼'}
                </button>
              </div>
            </div>

            {/* Detailed Analysis */}
            {showDetails === opportunity.id && (
              <div className="border-t border-reddit-border p-4 bg-reddit-bg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-reddit-dark mb-3">🎯 Why This Opportunity?</h5>
                    <div className="space-y-2 text-sm">
                      <p><strong>AI Reasoning:</strong> {opportunity.opportunity.reasoning}</p>
                      <p><strong>Strategy Fit:</strong> {opportunity.opportunity.strategyFit}</p>
                      <div className="flex items-center space-x-2">
                        <strong>Trust Building:</strong>
                        <span className={`px-2 py-1 rounded text-xs ${
                          opportunity.opportunity.trustBuilding 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {opportunity.opportunity.trustBuilding ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-reddit-dark mb-3">💡 Suggested Action</h5>
                    <div className="space-y-2 text-sm">
                      <p><strong>Action Type:</strong> {opportunity.suggestedAction.type}</p>
                      <p><strong>Timing:</strong> {opportunity.suggestedAction.timing}</p>
                      <p><strong>AI Confidence:</strong> {opportunity.suggestedAction.confidence}%</p>
                      {opportunity.suggestedAction.content && (
                        <div className="mt-3">
                          <strong>Suggested Response:</strong>
                          <div className="bg-white p-3 rounded border mt-1 italic text-reddit-gray">
                            {opportunity.suggestedAction.content}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Trust Building Progress */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-4">
        <h4 className="font-medium text-reddit-dark mb-3 flex items-center">
          <span className="mr-2">🌱</span>
          Trust Building Strategy
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className={`text-center p-3 rounded ${currentPlan.trustBuildingPhase === 'observer' ? 'bg-white border-2 border-green-500' : 'bg-white/50'}`}>
            <div className="text-2xl mb-1">👀</div>
            <div className="font-medium">Observer</div>
            <div className="text-xs text-reddit-gray">Learn community culture</div>
          </div>
          <div className={`text-center p-3 rounded ${currentPlan.trustBuildingPhase === 'helper' ? 'bg-white border-2 border-green-500' : 'bg-white/50'}`}>
            <div className="text-2xl mb-1">🤝</div>
            <div className="font-medium">Helper</div>
            <div className="text-xs text-reddit-gray">Answer questions, provide value</div>
          </div>
          <div className={`text-center p-3 rounded ${currentPlan.trustBuildingPhase === 'contributor' ? 'bg-white border-2 border-green-500' : 'bg-white/50'}`}>
            <div className="text-2xl mb-1">💡</div>
            <div className="font-medium">Contributor</div>
            <div className="text-xs text-reddit-gray">Share insights and experiences</div>
          </div>
          <div className={`text-center p-3 rounded ${currentPlan.trustBuildingPhase === 'thought_leader' ? 'bg-white border-2 border-green-500' : 'bg-white/50'}`}>
            <div className="text-2xl mb-1">🎯</div>
            <div className="font-medium">Thought Leader</div>
            <div className="text-xs text-reddit-gray">Natural product mentions when relevant</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICoplot;