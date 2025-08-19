import React from 'react';

interface OpportunityCardProps {
  children: React.ReactNode;
  className?: string;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`
      bg-notion-bg 
      border border-notion-border
      rounded-md
      shadow-notion
      p-6
      hover:shadow-notion-hover
      transition-all
      hover:-translate-y-0.5
      duration-200
      font-notion
      ${className}
    `}>
      {children}
    </div>
  );
};

interface OpportunityCardHeaderProps {
  subreddit: string;
  timestamp: string;
  status?: 'hot' | 'fresh' | 'competitive';
  className?: string;
}

export const OpportunityCardHeader: React.FC<OpportunityCardHeaderProps> = ({ 
  subreddit, 
  timestamp, 
  status = 'fresh',
  className = '' 
}) => {
  const statusConfig = {
    hot: { color: 'bg-status-alert', label: 'Hot' },
    fresh: { color: 'bg-status-success', label: 'Fresh' },
    competitive: { color: 'bg-status-warning', label: 'Competitive' }
  };

  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 rounded-full ${statusConfig[status].color}`}></div>
        <span className="text-notion-sm text-notion-text-medium">r/{subreddit}</span>
        <span className="text-notion-sm text-notion-text-medium">•</span>
        <span className="text-notion-sm text-notion-text-medium">{timestamp}</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className={`
          text-xs px-2 py-1 rounded-full
          ${status === 'hot' ? 'bg-status-alert-light text-status-alert' : ''}
          ${status === 'fresh' ? 'bg-status-success-light text-status-success' : ''}
          ${status === 'competitive' ? 'bg-status-warning-light text-status-warning' : ''}
        `}>
          {statusConfig[status].label}
        </span>
      </div>
    </div>
  );
};

interface OpportunityCardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const OpportunityCardTitle: React.FC<OpportunityCardTitleProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <h3 className={`
      text-notion-base 
      text-notion-text-dark
      leading-tight
      mb-3
      ${className}
    `}>
      {children}
    </h3>
  );
};

interface OpportunityCardMetricsProps {
  upvotes: number;
  comments: number;
  engagementRate?: string;
  className?: string;
}

export const OpportunityCardMetrics: React.FC<OpportunityCardMetricsProps> = ({ 
  upvotes, 
  comments, 
  engagementRate,
  className = '' 
}) => {
  return (
    <div className={`flex items-center space-x-4 mb-4 ${className}`}>
      <div className="flex items-center space-x-1">
        <span className="text-sm">↗️</span>
        <span className="text-notion-sm text-notion-text-medium font-normal">{upvotes}</span>
      </div>
      <div className="flex items-center space-x-1">
        <span className="text-sm">💬</span>
        <span className="text-notion-sm text-notion-text-medium font-normal">{comments}</span>
      </div>
      {engagementRate && (
        <div className="flex items-center space-x-1">
          <span className="text-sm">⚡</span>
          <span className="text-notion-sm text-notion-text-medium font-normal">{engagementRate}</span>
        </div>
      )}
    </div>
  );
};

interface OpportunityCardTagsProps {
  opportunityType: string;
  competition: 'low' | 'medium' | 'high';
  timing?: string;
  className?: string;
}

export const OpportunityCardTags: React.FC<OpportunityCardTagsProps> = ({ 
  opportunityType, 
  competition, 
  timing,
  className = '' 
}) => {
  const competitionConfig = {
    low: 'bg-status-success-light text-status-success border-status-success/20',
    medium: 'bg-status-warning-light text-status-warning border-status-warning/20',
    high: 'bg-status-alert-light text-status-alert border-status-alert/20'
  };

  return (
    <div className={`flex flex-wrap gap-2 mb-4 ${className}`}>
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-notion-sm font-medium bg-reddit-light text-reddit-primary border border-reddit-primary/20">
        🎯 {opportunityType}
      </span>
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-notion-sm font-normal border ${competitionConfig[competition]}`}>
        🏆 {competition === 'low' ? 'Low Competition' : competition === 'medium' ? 'Medium Competition' : 'High Competition'}
      </span>
      {timing && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-notion-sm font-normal bg-notion-hover text-notion-text-medium border border-notion-border">
          ⚡ {timing}
        </span>
      )}
    </div>
  );
};

interface OpportunityCardActionsProps {
  onViewStrategy?: () => void;
  onOpenThread?: () => void;
  onSave?: () => void;
  onUnsave?: () => void;
  isSaved?: boolean;
  className?: string;
}

export const OpportunityCardActions: React.FC<OpportunityCardActionsProps> = ({ 
  onViewStrategy, 
  onOpenThread,
  onSave,
  onUnsave,
  isSaved = false,
  className = '' 
}) => {
  const handleSaveClick = () => {
    if (isSaved) {
      onUnsave?.();
    } else {
      onSave?.();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex space-x-3">
        <button
          onClick={onViewStrategy}
          className="flex-1 bg-reddit-primary text-white text-notion-sm font-medium py-2 px-4 rounded-md hover:bg-reddit-hover transition-colors duration-200"
        >
          💡 View Strategy
        </button>
        <button
          onClick={onOpenThread}
          className="flex-1 bg-transparent border border-notion-border text-notion-text-medium text-notion-sm font-normal py-2 px-4 rounded-md hover:bg-notion-hover transition-colors duration-200"
        >
          🔗 Open Thread
        </button>
      </div>
      <button
        onClick={handleSaveClick}
        className={`w-full text-notion-sm font-normal py-2 px-4 rounded-md transition-colors duration-200 ${
          isSaved 
            ? 'bg-orange-100 text-[#FF4500] border border-orange-200 hover:bg-orange-200' 
            : 'bg-transparent border border-notion-border text-notion-text-medium hover:bg-notion-hover'
        }`}
      >
        {isSaved ? '🌟 Saved' : '⭐ Save for Later'}
      </button>
    </div>
  );
};