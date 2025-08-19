import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  description: string;
  market: string;
  features: string[];
  targetSubreddits: string[];
  created: string;
}

interface ProjectsDashboardProps {
  className?: string;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({ className = '' }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Get projects from localStorage (could be enhanced to use API)
      const savedProjects = JSON.parse(localStorage.getItem('userProjects') || '[]');
      setProjects(savedProjects);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const updatedProjects = projects.filter(p => p.id !== projectId);
        localStorage.setItem('userProjects', JSON.stringify(updatedProjects));
        setProjects(updatedProjects);
      } catch (err) {
        console.error('Error deleting project:', err);
      }
    }
  };

  const handleLaunchProject = (project: Project) => {
    // For now, this creates a basic "project launched" experience
    // Later we can connect this to actual project management features
    alert(`🚀 Launching "${project.name}"!\n\nThis would typically:\n• Set up project tracking\n• Initialize Reddit engagement\n• Start monitoring relevant subreddits\n\nFeature coming soon!`);
  };

  const handleEditProject = (project: Project) => {
    // For now, show project details for editing
    // Later we can create a proper edit modal/page
    const newName = prompt('Edit project name:', project.name);
    if (newName && newName.trim() && newName !== project.name) {
      try {
        const updatedProjects = projects.map(p => 
          p.id === project.id ? { ...p, name: newName.trim() } : p
        );
        localStorage.setItem('userProjects', JSON.stringify(updatedProjects));
        setProjects(updatedProjects);
      } catch (err) {
        console.error('Error editing project:', err);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMarketIcon = (market: string) => {
    if (market.includes('Technology')) return '💻';
    if (market.includes('Health')) return '🏃‍♂️';
    if (market.includes('Finance')) return '💼';
    if (market.includes('Education')) return '📚';
    if (market.includes('E-commerce')) return '🛒';
    if (market.includes('Entertainment')) return '🎬';
    if (market.includes('Food')) return '🍽️';
    if (market.includes('Travel')) return '✈️';
    if (market.includes('Real Estate')) return '🏠';
    if (market.includes('Automotive')) return '🚗';
    if (market.includes('Fashion')) return '👗';
    if (market.includes('Relationships')) return '❤️';
    return '🚀'; // Default for custom categories
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-gray-600">Loading projects...</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#FF4500] to-[#FF6B35] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">P</span>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Projects Dashboard</h1>
                  <p className="text-sm text-gray-600">Manage your created projects</p>
                </div>
              </div>
              
              <Link
                to="/copilot"
                className="flex items-center space-x-2 px-4 py-2 text-[#FF4500] hover:text-[#E03E00] hover:bg-orange-50 rounded-lg transition-colors font-medium"
              >
                <span className="text-sm">← Back to Co-Pilot</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Projects Yet</h2>
          <p className="text-gray-600 max-w-md mb-8">
            Start creating projects from business ideas using the Opportunity Mining feature in the Co-Pilot.
          </p>
          <Link
            to="/copilot"
            className="px-6 py-3 bg-[#FF4500] text-white rounded-lg hover:bg-[#E03E00] transition-colors font-medium"
          >
            🎯 Start Opportunity Mining
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#FF4500] to-[#FF6B35] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Projects Dashboard</h1>
                <p className="text-sm text-gray-600">{projects.length} project{projects.length !== 1 ? 's' : ''} created</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/copilot"
                className="flex items-center space-x-2 px-4 py-2 text-[#FF4500] hover:text-[#E03E00] hover:bg-orange-50 rounded-lg transition-colors font-medium"
              >
                <span className="text-sm">🎯 Create More Projects</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {/* Project Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getMarketIcon(project.market)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {project.name}
                      </h3>
                      <p className="text-sm text-[#FF4500] font-medium">
                        {project.market}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
                    title="Delete project"
                  >
                    🗑️
                  </button>
                </div>

                {/* Project Description */}
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {project.description}
                </p>

                {/* Features */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Key Features:</h4>
                  <div className="flex flex-wrap gap-1">
                    {project.features.slice(0, 3).map((feature, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-orange-100 text-[#FF4500] px-2 py-1 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                    {project.features.length > 3 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        +{project.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Target Subreddits */}
                {project.targetSubreddits.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Target Communities:</h4>
                    <div className="flex flex-wrap gap-1">
                      {project.targetSubreddits.slice(0, 2).map((subreddit, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                        >
                          r/{subreddit}
                        </span>
                      ))}
                      {project.targetSubreddits.length > 2 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          +{project.targetSubreddits.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Created Date */}
                <div className="text-xs text-gray-500 mb-4">
                  Created: {formatDate(project.created)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                <div className="flex space-x-3">
                  <button 
                    onClick={() => handleLaunchProject(project)}
                    className="flex-1 py-2 px-4 bg-[#FF4500] text-white text-sm rounded-lg hover:bg-[#E03E00] transition-colors font-medium"
                  >
                    🚀 Launch Project
                  </button>
                  <button 
                    onClick={() => handleEditProject(project)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ✏️ Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};