import React from 'react';

interface OpportunityGridProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const OpportunityGrid: React.FC<OpportunityGridProps> = ({ 
  title, 
  subtitle,
  children, 
  className = '' 
}) => {
  return (
    <section className={`mb-8 ${className}`}>
      {/* Netflix-style section header */}
      <div className="mb-4">
        <h2 className="text-notion-lg text-notion-text-dark mb-1 font-notion">
          {title}
        </h2>
        {subtitle && (
          <p className="text-notion-sm text-notion-text-medium font-notion">
            {subtitle}
          </p>
        )}
      </div>
      
      {/* Netflix-style horizontal scroll container */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex space-x-4 pb-4">
          {children}
        </div>
      </div>
    </section>
  );
};

interface OpportunityGridVerticalProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export const OpportunityGridVertical: React.FC<OpportunityGridVerticalProps> = ({ 
  title, 
  subtitle,
  children, 
  columns = 2,
  className = '' 
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  };

  return (
    <section className={`mb-8 ${className}`}>
      {/* Section header */}
      <div className="mb-6">
        <h2 className="text-notion-lg text-notion-text-dark mb-1 font-notion">
          {title}
        </h2>
        {subtitle && (
          <p className="text-notion-sm text-notion-text-medium font-notion">
            {subtitle}
          </p>
        )}
      </div>
      
      {/* Responsive grid layout */}
      <div className={`grid gap-4 ${gridCols[columns]}`}>
        {children}
      </div>
    </section>
  );
};