import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSavedOpportunities } from '../hooks/useSavedOpportunities';

// Icons
const ArrowUpIcon = ({ filled = false }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="19" x2="12" y2="5"/>
    <polyline points="5,12 12,5 19,12"/>
  </svg>
);

const ArrowDownIcon = ({ filled = false }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <polyline points="19,12 12,19 5,12"/>
  </svg>
);

const SparklesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const MessageCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6,9 12,15 18,9"/>
  </svg>
);

const UserProfileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const AnalyticsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 21H4.6c-.56 0-.6-.4-.6-1V3"/>
    <path d="M15 8v12"/>
    <path d="M10 11v8"/>
    <path d="M5 14v5"/>
    <path d="M18 5v14"/>
  </svg>
);

const GoldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.5-10.5L16 10l-1.5-1.5M8 14l-1.5 1.5M1 12l2-2 2 2-2 2-2-2zm20 0l-2-2-2 2 2 2 2-2z"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const TrendingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/>
    <polyline points="16,7 22,7 22,13"/>
  </svg>
);

const BulbIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21h6"/>
    <path d="M12 17c3.866 0 7-3.134 7-7 0-3.866-3.134-7-7-7s-7 3.134-7 7c0 3.866 3.134 7 7 7z"/>
    <path d="M12 3v18"/>
  </svg>
);

interface RedditThread {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  score: number;
  comments: number;
  content: string;
  timeAgo: string;
  opportunity_score: number;
  ai_suggestion: string;
  engagement_potential: 'high' | 'medium' | 'low';
  projectId: string;
}

interface Project {
  id: string;
  name: string;
  focus: string;
  color: string;
  threadCount: number;
}

const RedditCoPilot: React.FC = () => {
  const [selectedThread, setSelectedThread] = useState<RedditThread | null>(null);
  const [userVotes, setUserVotes] = useState<{[key: string]: 'up' | 'down' | null}>({});
  const [commentText, setCommentText] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('1');
  const [showCompetitiveAnalysis, setShowCompetitiveAnalysis] = useState(false);
  const [competitiveTopic, setCompetitiveTopic] = useState('');
  const [competitiveResults, setCompetitiveResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showOpportunityMining, setShowOpportunityMining] = useState(false);
  const [miningStep, setMiningStep] = useState(1);
  const [selectedMarket, setSelectedMarket] = useState('');
  const [customMarket, setCustomMarket] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('');
  const [redditThreads, setRedditThreads] = useState<string[]>([]);
  const [painPoints, setPainPoints] = useState<any[]>([]);
  const [businessIdeas, setBusinessIdeas] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Saved opportunities functionality
  const { saveOpportunity, unsaveOpportunity, isOpportunitySaved } = useSavedOpportunities();

  // Handle creating project from business idea
  const handleCreateProjectFromIdea = (idea: any) => {
    // Create a project structure from the business idea
    const projectData = {
      name: idea.name,
      description: idea.description,
      market: idea.market,
      features: idea.features,
      targetSubreddits: [selectedNiche, selectedMarket].filter(Boolean),
      created: new Date().toISOString()
    };
    
    console.log('Creating project from idea:', projectData);
    
    // You could save this to localStorage or send to API
    try {
      // Save to localStorage for now
      const existingProjects = JSON.parse(localStorage.getItem('userProjects') || '[]');
      const newProject = {
        id: Date.now().toString(),
        ...projectData
      };
      existingProjects.push(newProject);
      localStorage.setItem('userProjects', JSON.stringify(existingProjects));
      
      // Show success feedback
      if (window.confirm(`Project "${idea.name}" created successfully!\n\nWould you like to view your Projects Dashboard now?`)) {
        // Navigate to projects page
        window.location.href = '/projects';
      } else {
        // Close modal
        setShowOpportunityMining(false);
      }
      
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project. Please try again.');
    }
  };

  // Handle saving/unsaving opportunities
  const handleSaveOpportunity = async (thread: RedditThread) => {
    const opportunityData = {
      id: thread.id,
      type: 'post',
      subreddit: thread.subreddit,
      title: thread.title,
      author: thread.author,
      content: thread.content,
      score: thread.score,
      commentCount: thread.comments,
      postedAgo: thread.timeAgo,
      url: `https://reddit.com/r/${thread.subreddit.replace('r/', '')}/comments/${thread.id}`,
      opportunity: {
        type: 'engagement_opportunity',
        reasoning: thread.ai_suggestion,
        strategyFit: `Aligns with ${thread.subreddit} community interests`,
        trustBuilding: true,
        riskLevel: thread.engagement_potential === 'high' ? 'low' : thread.engagement_potential === 'medium' ? 'medium' : 'high',
        potentialValue: thread.opportunity_score
      },
      suggestedAction: {
        type: 'AI-guided response',
        content: thread.ai_suggestion,
        timing: 'Within 1 hour',
        confidence: thread.opportunity_score
      }
    };

    if (isOpportunitySaved(thread.id)) {
      await unsaveOpportunity(thread.id);
    } else {
      await saveOpportunity(opportunityData);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get user profile from localStorage with fallback
  const getUserProfile = () => {
    try {
      const storedProfile = localStorage.getItem('userProfile');
      if (storedProfile) {
        return JSON.parse(storedProfile);
      }
    } catch (error) {
      console.error('Error parsing user profile:', error);
    }
    
    // Fallback profile
    return {
      name: 'User',
      expertise: ['UI/UX Design'],
      interests: ['r/design'],
    };
  };

  const userProfile = getUserProfile();

  // Projects data
  const projects: Project[] = [
    {
      id: '1',
      name: 'AI & Tech',
      focus: 'Artificial Intelligence, Machine Learning, Tech Trends',
      color: 'bg-blue-500',
      threadCount: 8
    },
    {
      id: '2', 
      name: 'Filmmaking',
      focus: 'Cinematography, Equipment, Industry News',
      color: 'bg-purple-500',
      threadCount: 6
    },
    {
      id: '3',
      name: 'Health & Wellness',
      focus: 'Fitness, Nutrition, Mental Health',
      color: 'bg-green-500',
      threadCount: 4
    },
    {
      id: '4',
      name: 'Startup Journey',
      focus: 'Entrepreneurship, SaaS, Business Strategy',
      color: 'bg-orange-500',
      threadCount: 7
    },
    {
      id: '5',
      name: 'Creative Arts',
      focus: 'Design, Photography, Creative Process',
      color: 'bg-pink-500',
      threadCount: 5
    }
  ];

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // Comprehensive threads from multiple APIs - maximize data pulling
  const allThreads: RedditThread[] = [
    // AI & Tech Project (ID: 1) - 15 threads
    {
      id: '1',
      title: 'What are the best practices for UI design in 2024?',
      author: 'design_guru',
      subreddit: 'r/design',
      score: 147,
      comments: 23,
      content: "Looking for modern UI design practices for web applications. What are your go-to principles? I've been struggling with component libraries vs custom designs.",
      timeAgo: '3 hours ago',
      opportunity_score: 92,
      ai_suggestion: "Share your UI/UX expertise and discuss current design trends you've worked with.",
      engagement_potential: 'high',
      projectId: '1'
    },
    {
      id: '2',
      title: 'UX research methods that actually work',
      author: 'ux_researcher',
      subreddit: 'r/userexperience',
      score: 89,
      comments: 31,
      content: "What UX research methods do you find most effective for understanding user needs? Traditional surveys seem outdated.",
      timeAgo: '5 hours ago',
      opportunity_score: 88,
      ai_suggestion: "Share your experience with UX research methodologies and practical insights.",
      engagement_potential: 'high',
      projectId: '1'
    },
    {
      id: '3',
      title: 'Machine Learning model deployment best practices',
      author: 'ml_engineer',
      subreddit: 'r/MachineLearning',
      score: 312,
      comments: 67,
      content: "What's the best way to deploy ML models in production? Docker, Kubernetes, or serverless? Looking for real-world experiences.",
      timeAgo: '2 hours ago',
      opportunity_score: 94,
      ai_suggestion: "Share your ML deployment experience and discuss scalability considerations.",
      engagement_potential: 'high',
      projectId: '1'
    },
    {
      id: '4',
      title: 'GPT-4 vs Claude 3.5 for coding tasks',
      author: 'ai_developer',
      subreddit: 'r/artificial',
      score: 456,
      comments: 89,
      content: "Has anyone done a comprehensive comparison of these models for software development? Particularly interested in code generation quality.",
      timeAgo: '4 hours ago',
      opportunity_score: 91,
      ai_suggestion: "Share your hands-on experience with AI coding assistants and provide specific examples.",
      engagement_potential: 'high',
      projectId: '1'
    },
    {
      id: '5',
      title: 'Computer vision for medical imaging - breakthrough or hype?',
      author: 'medtech_researcher',
      subreddit: 'r/computervision',
      score: 234,
      comments: 45,
      content: "Seeing lots of claims about AI diagnosing diseases better than doctors. What's the real state of medical CV applications?",
      timeAgo: '6 hours ago',
      opportunity_score: 89,
      ai_suggestion: "Discuss the current limitations and realistic applications of CV in healthcare.",
      engagement_potential: 'high',
      projectId: '1'
    },
    {
      id: '6',
      title: 'Natural Language Processing for customer support automation',
      author: 'support_manager',
      subreddit: 'r/artificial',
      score: 178,
      comments: 32,
      content: "Looking to implement NLP for our customer support. What are the gotchas and realistic expectations for automation?",
      timeAgo: '8 hours ago',
      opportunity_score: 86,
      ai_suggestion: "Share practical NLP implementation insights and discuss customer experience considerations.",
      engagement_potential: 'medium',
      projectId: '1'
    },
    {
      id: '7',
      title: 'React 19 new features - worth upgrading?',
      author: 'frontend_lead',
      subreddit: 'r/reactjs',
      score: 567,
      comments: 123,
      content: "Just saw the React 19 announcement. The new features look interesting but is it worth the migration effort for existing apps?",
      timeAgo: '1 hour ago',
      opportunity_score: 93,
      ai_suggestion: "Provide a balanced view on React 19 adoption with migration considerations.",
      engagement_potential: 'high',
      projectId: '1'
    },
    {
      id: '8',
      title: 'Cybersecurity for AI applications - new attack vectors',
      author: 'security_expert',
      subreddit: 'r/cybersecurity',
      score: 289,
      comments: 56,
      content: "AI applications introduce new security vulnerabilities. What are the most critical threats we should be preparing for?",
      timeAgo: '3 hours ago',
      opportunity_score: 87,
      ai_suggestion: "Discuss AI-specific security challenges and share practical defense strategies.",
      engagement_potential: 'high',
      projectId: '1'
    },
    {
      id: '9',
      title: 'TypeScript 5.3 performance improvements',
      author: 'ts_enthusiast',
      subreddit: 'r/typescript',
      score: 234,
      comments: 41,
      content: "The new TypeScript release claims significant performance improvements. Has anyone benchmarked this on large codebases?",
      timeAgo: '5 hours ago',
      opportunity_score: 84,
      ai_suggestion: "Share your TypeScript performance optimization experiences and real-world benchmarks.",
      engagement_potential: 'medium',
      projectId: '1'
    },
    {
      id: '10',
      title: 'Web Development trends shaping 2025',
      author: 'web_visionary',
      subreddit: 'r/webdev',
      score: 445,
      comments: 78,
      content: "What technologies and patterns do you think will dominate web development next year? Interested in both frontend and backend perspectives.",
      timeAgo: '7 hours ago',
      opportunity_score: 90,
      ai_suggestion: "Share your insights on emerging web technologies and their practical applications.",
      engagement_potential: 'high',
      projectId: '1'
    },
    {
      id: '11',
      title: 'SaaS architecture patterns for multi-tenancy',
      author: 'saas_architect',
      subreddit: 'r/SaaS',
      score: 156,
      comments: 29,
      content: "Building a multi-tenant SaaS platform. What are the pros/cons of different isolation strategies - database per tenant vs shared schema?",
      timeAgo: '9 hours ago',
      opportunity_score: 88,
      ai_suggestion: "Share your SaaS architecture experience and discuss scalability trade-offs.",
      engagement_potential: 'high',
      projectId: '1'
    },
    {
      id: '12',
      title: 'Edge computing for real-time AI inference',
      author: 'edge_developer',
      subreddit: 'r/MachineLearning',
      score: 201,
      comments: 34,
      content: "Working on deploying AI models at the edge for real-time processing. What are the biggest challenges and solutions you've found?",
      timeAgo: '4 hours ago',
      opportunity_score: 85,
      ai_suggestion: "Discuss edge AI deployment challenges and share optimization techniques.",
      engagement_potential: 'medium',
      projectId: '1'
    },
    {
      id: '13',
      title: 'API security best practices in 2024',
      author: 'api_security_guru',
      subreddit: 'r/cybersecurity',
      score: 323,
      comments: 67,
      content: "With the rise of AI and more complex API ecosystems, what security practices should every developer be implementing?",
      timeAgo: '6 hours ago',
      opportunity_score: 89,
      ai_suggestion: "Share comprehensive API security strategies and common vulnerability patterns.",
      engagement_potential: 'high',
      projectId: '1'
    },
    {
      id: '14',
      title: 'Frontend performance optimization for large React apps',
      author: 'performance_ninja',
      subreddit: 'r/reactjs',
      score: 389,
      comments: 72,
      content: "Our React app is getting slow with 100+ components. What are the most effective performance optimization strategies you've used?",
      timeAgo: '2 hours ago',
      opportunity_score: 91,
      ai_suggestion: "Share specific React performance optimization techniques with real-world examples.",
      engagement_potential: 'high',
      projectId: '1'
    },
    {
      id: '15',
      title: 'Neural network interpretability - practical approaches',
      author: 'ml_researcher',
      subreddit: 'r/MachineLearning',
      score: 267,
      comments: 48,
      content: "Need to make our ML models more interpretable for stakeholders. What techniques actually work in production environments?",
      timeAgo: '8 hours ago',
      opportunity_score: 86,
      ai_suggestion: "Discuss practical ML interpretability methods and their business impact.",
      engagement_potential: 'medium',
      projectId: '1'
    },

    // Filmmaking Project (ID: 2) - 12 threads
    {
      id: '16',
      title: 'Best budget cinema cameras under $3000 in 2024',
      author: 'indie_filmmaker',
      subreddit: 'r/cinematography',
      score: 445,
      comments: 89,
      content: "Looking to upgrade from my old DSLR setup. What cinema cameras give the best bang for buck in the $2000-3000 range?",
      timeAgo: '2 hours ago',
      opportunity_score: 92,
      ai_suggestion: "Share your camera equipment experience and discuss value propositions of different models.",
      engagement_potential: 'high',
      projectId: '2'
    },
    {
      id: '17',
      title: 'Lighting techniques for micro-budget films',
      author: 'budget_dp',
      subreddit: 'r/Filmmakers',
      score: 234,
      comments: 56,
      content: "Making a short film with almost no budget for lighting. What creative solutions have you used to achieve professional-looking results?",
      timeAgo: '5 hours ago',
      opportunity_score: 89,
      ai_suggestion: "Share creative lighting solutions and DIY techniques for low-budget productions.",
      engagement_potential: 'high',
      projectId: '2'
    },
    {
      id: '18',
      title: 'Color grading workflow for indie films',
      author: 'colorist_pro',
      subreddit: 'r/colorists',
      score: 178,
      comments: 34,
      content: "What's your color grading workflow from camera to final delivery? Particularly interested in DaVinci Resolve best practices.",
      timeAgo: '7 hours ago',
      opportunity_score: 87,
      ai_suggestion: "Share your color grading expertise and workflow optimization tips.",
      engagement_potential: 'high',
      projectId: '2'
    },
    {
      id: '19',
      title: 'Sound design for horror films - creating atmosphere',
      author: 'horror_sound_designer',
      subreddit: 'r/WeAreTheMusicMakers',
      score: 156,
      comments: 28,
      content: "Working on a psychological horror short. What techniques do you use to create unsettling atmospheres without relying on jump scares?",
      timeAgo: '4 hours ago',
      opportunity_score: 85,
      ai_suggestion: "Discuss sound design techniques and share creative approaches to audio storytelling.",
      engagement_potential: 'medium',
      projectId: '2'
    },
    {
      id: '20',
      title: 'Film festival submission strategies that actually work',
      author: 'festival_veteran',
      subreddit: 'r/Filmmakers',
      score: 289,
      comments: 67,
      content: "Submitted to 50+ festivals over the years. Here's what I've learned about maximizing your chances and ROI on submission fees.",
      timeAgo: '6 hours ago',
      opportunity_score: 90,
      ai_suggestion: "Share your festival circuit experience and strategic submission insights.",
      engagement_potential: 'high',
      projectId: '2'
    },
    {
      id: '21',
      title: 'Drone cinematography regulations and creative possibilities',
      author: 'aerial_cinematographer',
      subreddit: 'r/cinematography',
      score: 201,
      comments: 41,
      content: "Getting into drone work for film projects. What are the current regulations and what creative shots are worth the investment?",
      timeAgo: '3 hours ago',
      opportunity_score: 83,
      ai_suggestion: "Discuss drone cinematography opportunities and share regulatory insights.",
      engagement_potential: 'medium',
      projectId: '2'
    },
    {
      id: '22',
      title: 'Screenwriting software comparison - Final Draft vs alternatives',
      author: 'screenwriter_indie',
      subreddit: 'r/screenwriting',
      score: 167,
      comments: 45,
      content: "Final Draft is expensive for an indie writer. Are there good alternatives that won't hurt my credibility with industry professionals?",
      timeAgo: '8 hours ago',
      opportunity_score: 81,
      ai_suggestion: "Compare screenwriting tools and discuss industry standards vs budget alternatives.",
      engagement_potential: 'medium',
      projectId: '2'
    },
    {
      id: '23',
      title: 'Documentary filmmaking ethics in the social media age',
      author: 'doc_filmmaker',
      subreddit: 'r/documentaryfilmmaking',
      score: 134,
      comments: 29,
      content: "How do you navigate consent and privacy when your subjects are active on social media? The boundaries seem blurrier than ever.",
      timeAgo: '5 hours ago',
      opportunity_score: 84,
      ai_suggestion: "Discuss documentary ethics and share approaches to modern consent challenges.",
      engagement_potential: 'high',
      projectId: '2'
    },
    {
      id: '24',
      title: 'Gimbal vs handheld - when to use which stabilization',
      author: 'camera_operator',
      subreddit: 'r/cinematography',
      score: 223,
      comments: 38,
      content: "Still debating whether to invest in a gimbal or stick with handheld techniques. What factors help you decide for different shots?",
      timeAgo: '1 hour ago',
      opportunity_score: 86,
      ai_suggestion: "Share your camera movement experience and discuss the creative impact of different stabilization choices.",
      engagement_potential: 'high',
      projectId: '2'
    },
    {
      id: '25',
      title: 'Film school vs self-taught - industry perspective',
      author: 'film_industry_vet',
      subreddit: 'r/Filmmakers',
      score: 356,
      comments: 78,
      content: "20 years in the industry. Getting asked about film school a lot. Here's my honest take on education paths for aspiring filmmakers.",
      timeAgo: '9 hours ago',
      opportunity_score: 88,
      ai_suggestion: "Share your industry experience and provide guidance on different career paths in filmmaking.",
      engagement_potential: 'high',
      projectId: '2'
    },
    {
      id: '26',
      title: 'Post-production workflow optimization for solo filmmakers',
      author: 'solo_editor',
      subreddit: 'r/VideoEditing',
      score: 189,
      comments: 33,
      content: "Wearing all the hats as a solo filmmaker. How do you streamline your post-production to avoid burnout while maintaining quality?",
      timeAgo: '4 hours ago',
      opportunity_score: 82,
      ai_suggestion: "Share efficient post-production workflows and time management strategies.",
      engagement_potential: 'medium',
      projectId: '2'
    },
    {
      id: '27',
      title: 'VFX on a shoestring budget - practical vs digital',
      author: 'indie_vfx_artist',
      subreddit: 'r/VFX',
      score: 145,
      comments: 26,
      content: "Working on a sci-fi short with no VFX budget. When should you go practical vs attempt digital effects with free software?",
      timeAgo: '7 hours ago',
      opportunity_score: 80,
      ai_suggestion: "Discuss budget VFX strategies and share creative problem-solving approaches.",
      engagement_potential: 'medium',
      projectId: '2'
    },

    // Health & Wellness Project (ID: 3) - 10 threads
    {
      id: '28',
      title: 'Intermittent fasting vs traditional dieting - latest research',
      author: 'nutrition_researcher',
      subreddit: 'r/nutrition',
      score: 567,
      comments: 123,
      content: "New meta-analysis came out comparing IF to traditional calorie restriction. The results might surprise you. Anyone else following this research?",
      timeAgo: '3 hours ago',
      opportunity_score: 94,
      ai_suggestion: "Share evidence-based insights on different dieting approaches and their long-term sustainability.",
      engagement_potential: 'high',
      projectId: '3'
    },
    {
      id: '29',
      title: 'Mental health apps that actually work - evidence-based reviews',
      author: 'clinical_psychologist',
      subreddit: 'r/mentalhealth',
      score: 389,
      comments: 67,
      content: "Tired of wellness apps with no scientific backing. Which mental health apps have actual clinical evidence supporting their effectiveness?",
      timeAgo: '5 hours ago',
      opportunity_score: 91,
      ai_suggestion: "Discuss evidence-based mental health tools and share professional insights on digital wellness solutions.",
      engagement_potential: 'high',
      projectId: '3'
    },
    {
      id: '30',
      title: 'Fitness tracking accuracy - wearables vs reality',
      author: 'exercise_physiologist',
      subreddit: 'r/fitness',
      score: 234,
      comments: 45,
      content: "Did a study comparing popular fitness trackers to lab-grade equipment. The accuracy results were eye-opening. What's your experience?",
      timeAgo: '2 hours ago',
      opportunity_score: 88,
      ai_suggestion: "Share insights on fitness tracking accuracy and discuss the importance of data quality in health monitoring.",
      engagement_potential: 'high',
      projectId: '3'
    },
    {
      id: '31',
      title: 'Sleep optimization without expensive gadgets',
      author: 'sleep_specialist',
      subreddit: 'r/sleep',
      score: 445,
      comments: 89,
      content: "Everyone's talking about $500 sleep trackers and smart mattresses. What free or cheap changes actually improve sleep quality?",
      timeAgo: '7 hours ago',
      opportunity_score: 89,
      ai_suggestion: "Share practical sleep optimization strategies that don't require expensive technology.",
      engagement_potential: 'high',
      projectId: '3'
    },
    {
      id: '32',
      title: 'Supplement industry red flags - what to avoid',
      author: 'registered_dietitian',
      subreddit: 'r/supplements',
      score: 312,
      comments: 78,
      content: "15 years in nutrition science. Here are the supplement marketing tactics that should make you run the other way.",
      timeAgo: '4 hours ago',
      opportunity_score: 87,
      ai_suggestion: "Provide evidence-based guidance on supplement evaluation and share professional insights on industry practices.",
      engagement_potential: 'high',
      projectId: '3'
    },
    {
      id: '33',
      title: 'Home workout equipment that actually gets used',
      author: 'personal_trainer',
      subreddit: 'r/homegym',
      score: 201,
      comments: 56,
      content: "Helped 100+ clients set up home gyms. Here's what equipment people actually use long-term vs what collects dust.",
      timeAgo: '6 hours ago',
      opportunity_score: 85,
      ai_suggestion: "Share practical insights on sustainable home fitness setups and equipment selection.",
      engagement_potential: 'medium',
      projectId: '3'
    },
    {
      id: '34',
      title: 'Stress management techniques for high-pressure careers',
      author: 'occupational_therapist',
      subreddit: 'r/stress',
      score: 178,
      comments: 34,
      content: "Working with tech executives and doctors on stress management. What techniques actually work when you can't just 'take time off'?",
      timeAgo: '8 hours ago',
      opportunity_score: 83,
      ai_suggestion: "Discuss practical stress management for demanding careers and share professional coping strategies.",
      engagement_potential: 'high',
      projectId: '3'
    },
    {
      id: '35',
      title: 'Nutrition timing - does it really matter for average people?',
      author: 'sports_nutritionist',
      subreddit: 'r/nutrition',
      score: 156,
      comments: 29,
      content: "Meal timing, pre/post workout nutrition, eating windows - how much of this matters for people who aren't elite athletes?",
      timeAgo: '1 hour ago',
      opportunity_score: 81,
      ai_suggestion: "Provide practical nutrition timing advice for everyday fitness enthusiasts.",
      engagement_potential: 'medium',
      projectId: '3'
    },
    {
      id: '36',
      title: 'Meditation vs mindfulness - practical differences',
      author: 'mindfulness_instructor',
      subreddit: 'r/Meditation',
      score: 267,
      comments: 48,
      content: "Students often ask about the difference between meditation and mindfulness practices. How do you explain this in practical terms?",
      timeAgo: '9 hours ago',
      opportunity_score: 84,
      ai_suggestion: "Clarify the distinctions between different mindfulness practices and share practical implementation advice.",
      engagement_potential: 'medium',
      projectId: '3'
    },
    {
      id: '37',
      title: 'Recovery protocols for weekend warriors',
      author: 'sports_medicine_doc',
      subreddit: 'r/fitness',
      score: 189,
      comments: 37,
      content: "Treating a lot of 30-40 year olds who go hard on weekends then can barely move Monday. What recovery strategies actually help?",
      timeAgo: '5 hours ago',
      opportunity_score: 86,
      ai_suggestion: "Share medical insights on recovery strategies for recreational athletes and injury prevention.",
      engagement_potential: 'high',
      projectId: '3'
    },

    // Startup Journey Project (ID: 4) - 14 threads
    {
      id: '38',
      title: 'SaaS pricing strategy - lessons from 100+ failed experiments',
      author: 'saas_founder',
      subreddit: 'r/SaaS',
      score: 678,
      comments: 134,
      content: "Spent 3 years testing different pricing models. Here's what worked, what failed spectacularly, and what I wish I'd known from day one.",
      timeAgo: '2 hours ago',
      opportunity_score: 95,
      ai_suggestion: "Share your SaaS pricing insights and discuss strategic approaches to value-based pricing.",
      engagement_potential: 'high',
      projectId: '4'
    },
    {
      id: '39',
      title: 'Product-market fit signals that actually matter',
      author: 'serial_entrepreneur',
      subreddit: 'r/entrepreneur',
      score: 445,
      comments: 89,
      content: "Built 4 startups, 2 successful exits. The PMF signals everyone talks about vs what actually predicts success are very different.",
      timeAgo: '4 hours ago',
      opportunity_score: 92,
      ai_suggestion: "Share your entrepreneurial experience and discuss real indicators of product-market fit.",
      engagement_potential: 'high',
      projectId: '4'
    },
    {
      id: '40',
      title: 'Fundraising pitch deck mistakes that kill deals',
      author: 'vc_partner',
      subreddit: 'r/startups',
      score: 567,
      comments: 112,
      content: "Reviewed 1000+ pitch decks this year. Here are the mistakes that make me stop reading within 30 seconds.",
      timeAgo: '6 hours ago',
      opportunity_score: 91,
      ai_suggestion: "Share investor perspective insights and provide actionable pitch improvement advice.",
      engagement_potential: 'high',
      projectId: '4'
    },
    {
      id: '41',
      title: 'Customer acquisition cost optimization for B2B SaaS',
      author: 'growth_marketer',
      subreddit: 'r/marketing',
      score: 234,
      comments: 56,
      content: "CAC has doubled in the last 2 years for most channels. What unconventional strategies are working for customer acquisition now?",
      timeAgo: '3 hours ago',
      opportunity_score: 88,
      ai_suggestion: "Discuss modern customer acquisition strategies and share cost-effective growth tactics.",
      engagement_potential: 'high',
      projectId: '4'
    },
    {
      id: '42',
      title: 'Remote team culture - what actually works at scale',
      author: 'remote_ceo',
      subreddit: 'r/remotework',
      score: 389,
      comments: 78,
      content: "Scaled a fully remote team from 5 to 150 people. Here's what culture-building strategies work and which ones are just corporate theater.",
      timeAgo: '5 hours ago',
      opportunity_score: 87,
      ai_suggestion: "Share insights on remote team management and discuss scalable culture-building practices.",
      engagement_potential: 'high',
      projectId: '4'
    },
    {
      id: '43',
      title: 'MVP development - what to build vs what to fake',
      author: 'product_founder',
      subreddit: 'r/startups',
      score: 312,
      comments: 67,
      content: "The line between a viable MVP and a fake door experiment is getting blurrier. How do you decide what to actually build?",
      timeAgo: '7 hours ago',
      opportunity_score: 85,
      ai_suggestion: "Discuss MVP strategy and share practical approaches to early product validation.",
      engagement_potential: 'medium',
      projectId: '4'
    },
    {
      id: '44',
      title: 'Business model pivots - when and how to change course',
      author: 'pivot_veteran',
      subreddit: 'r/entrepreneur',
      score: 201,
      comments: 45,
      content: "Pivoted 3 times before finding our current successful model. Here's how to know when to pivot vs when to persevere.",
      timeAgo: '8 hours ago',
      opportunity_score: 89,
      ai_suggestion: "Share pivot experience and discuss strategic decision-making during business model transitions.",
      engagement_potential: 'high',
      projectId: '4'
    },
    {
      id: '45',
      title: 'Equity distribution mistakes that destroy startups',
      author: 'startup_lawyer',
      subreddit: 'r/startups',
      score: 456,
      comments: 98,
      content: "Seen too many promising startups implode over equity issues. Here are the most common cap table mistakes and how to avoid them.",
      timeAgo: '1 hour ago',
      opportunity_score: 93,
      ai_suggestion: "Provide legal insights on equity structuring and share best practices for founder agreements.",
      engagement_potential: 'high',
      projectId: '4'
    },
    {
      id: '46',
      title: 'Developer productivity metrics that actually matter',
      author: 'engineering_vp',
      subreddit: 'r/programming',
      score: 178,
      comments: 34,
      content: "Lines of code and commit frequency are vanity metrics. What should we actually measure to improve engineering productivity?",
      timeAgo: '9 hours ago',
      opportunity_score: 84,
      ai_suggestion: "Discuss meaningful engineering metrics and share insights on building high-performing development teams.",
      engagement_potential: 'medium',
      projectId: '4'
    },
    {
      id: '47',
      title: 'Customer support automation - when humans still matter',
      author: 'customer_success_lead',
      subreddit: 'r/customerservice',
      score: 167,
      comments: 29,
      content: "AI can handle 80% of our support tickets now. But that remaining 20% is where we really differentiate. How do you balance automation with human touch?",
      timeAgo: '4 hours ago',
      opportunity_score: 82,
      ai_suggestion: "Share customer service insights and discuss the strategic balance between automation and human interaction.",
      engagement_potential: 'medium',
      projectId: '4'
    },
    {
      id: '48',
      title: 'Startup financial modeling - beyond the hockey stick',
      author: 'startup_cfo',
      subreddit: 'r/startups',
      score: 289,
      comments: 67,
      content: "Tired of seeing unrealistic financial projections from founders. Here's how to build models that investors actually trust.",
      timeAgo: '6 hours ago',
      opportunity_score: 86,
      ai_suggestion: "Share financial modeling expertise and provide practical guidance on realistic startup projections.",
      engagement_potential: 'high',
      projectId: '4'
    },
    {
      id: '49',
      title: 'Content marketing for technical products',
      author: 'devtools_marketer',
      subreddit: 'r/marketing',
      score: 234,
      comments: 48,
      content: "Marketing to developers is completely different from B2B marketing. What content strategies actually work for technical audiences?",
      timeAgo: '2 hours ago',
      opportunity_score: 83,
      ai_suggestion: "Discuss technical marketing strategies and share insights on reaching developer audiences effectively.",
      engagement_potential: 'medium',
      projectId: '4'
    },
    {
      id: '50',
      title: 'Scaling customer onboarding without losing personal touch',
      author: 'onboarding_specialist',
      subreddit: 'r/SaaS',
      score: 156,
      comments: 31,
      content: "We're onboarding 50+ new customers per week now. How do you maintain quality and personalization at scale?",
      timeAgo: '8 hours ago',
      opportunity_score: 81,
      ai_suggestion: "Share scalable onboarding strategies and discuss automation approaches that maintain customer experience quality.",
      engagement_potential: 'medium',
      projectId: '4'
    },
    {
      id: '51',
      title: 'International expansion - cultural pitfalls to avoid',
      author: 'global_expansion_lead',
      subreddit: 'r/entrepreneur',
      score: 345,
      comments: 72,
      content: "Expanded our SaaS to 15 countries. The cultural assumptions that nearly killed our European launch might surprise you.",
      timeAgo: '5 hours ago',
      opportunity_score: 88,
      ai_suggestion: "Share international business insights and discuss cultural considerations for global expansion.",
      engagement_potential: 'high',
      projectId: '4'
    },

    // Creative Arts Project (ID: 5) - 11 threads
    {
      id: '52',
      title: 'Photography composition rules vs creative intuition',
      author: 'art_photographer',
      subreddit: 'r/photography',
      score: 345,
      comments: 67,
      content: "20 years of breaking composition rules taught me when they're helpful vs when they're limiting. How do you balance technical knowledge with creative instinct?",
      timeAgo: '3 hours ago',
      opportunity_score: 89,
      ai_suggestion: "Share your photography insights and discuss the balance between technical rules and creative expression.",
      engagement_potential: 'high',
      projectId: '5'
    },
    {
      id: '53',
      title: 'Digital art vs traditional media - skill transfer',
      author: 'mixed_media_artist',
      subreddit: 'r/art',
      score: 234,
      comments: 45,
      content: "Started with oil painting, now mostly digital. The skills that transferred surprised me more than the ones that didn't. Anyone else make this transition?",
      timeAgo: '5 hours ago',
      opportunity_score: 86,
      ai_suggestion: "Discuss the relationship between traditional and digital art skills and share transition insights.",
      engagement_potential: 'high',
      projectId: '5'
    },
    {
      id: '54',
      title: 'Creative block solutions that actually work',
      author: 'professional_illustrator',
      subreddit: 'r/creativity',
      score: 456,
      comments: 89,
      content: "10 years freelancing taught me that creative block is often a symptom, not the problem. Here's what actually helps vs what just wastes time.",
      timeAgo: '2 hours ago',
      opportunity_score: 91,
      ai_suggestion: "Share professional creative insights and provide practical solutions for overcoming creative challenges.",
      engagement_potential: 'high',
      projectId: '5'
    },
    {
      id: '55',
      title: 'Design critique - giving feedback that helps growth',
      author: 'design_educator',
      subreddit: 'r/design',
      score: 167,
      comments: 34,
      content: "Teaching design for 8 years. The way most people give creative feedback is actually harmful to artistic development. Here's what works.",
      timeAgo: '7 hours ago',
      opportunity_score: 84,
      ai_suggestion: "Share educational insights on constructive creative criticism and discuss approaches that foster artistic growth.",
      engagement_potential: 'medium',
      projectId: '5'
    },
    {
      id: '56',
      title: 'Art pricing strategies for emerging artists',
      author: 'gallery_owner',
      subreddit: 'r/artistspeakeasy',
      score: 289,
      comments: 56,
      content: "Worked with 200+ emerging artists on pricing. The strategies that build sustainable careers vs quick cash are very different.",
      timeAgo: '4 hours ago',
      opportunity_score: 87,
      ai_suggestion: "Share gallery insights on art pricing and discuss strategies for building sustainable creative careers.",
      engagement_potential: 'high',
      projectId: '5'
    },
    {
      id: '57',
      title: 'Color theory in the digital age - monitors vs reality',
      author: 'color_consultant',
      subreddit: 'r/design',
      score: 178,
      comments: 29,
      content: "Color theory basics haven't changed, but digital displays have complicated everything. How do you ensure color accuracy across devices?",
      timeAgo: '6 hours ago',
      opportunity_score: 82,
      ai_suggestion: "Discuss color management challenges and share technical insights on digital color accuracy.",
      engagement_potential: 'medium',
      projectId: '5'
    },
    {
      id: '58',
      title: 'Social media strategy for visual artists',
      author: 'artist_social_manager',
      subreddit: 'r/ArtistLounge',
      score: 234,
      comments: 48,
      content: "Algorithm changes killed organic reach for most artists. What platforms and strategies are actually working for art promotion now?",
      timeAgo: '8 hours ago',
      opportunity_score: 85,
      ai_suggestion: "Share social media insights for artists and discuss effective strategies for visual content promotion.",
      engagement_potential: 'high',
      projectId: '5'
    },
    {
      id: '59',
      title: 'Typography trends vs timeless design principles',
      author: 'type_designer',
      subreddit: 'r/typography',
      score: 156,
      comments: 31,
      content: "Watching typography trends cycle through every 20 years. What principles stay constant while styles change?",
      timeAgo: '1 hour ago',
      opportunity_score: 83,
      ai_suggestion: "Discuss typography fundamentals and share insights on balancing trendy design with timeless principles.",
      engagement_potential: 'medium',
      projectId: '5'
    },
    {
      id: '60',
      title: 'Creative collaboration tools that don\'t kill spontaneity',
      author: 'creative_director',
      subreddit: 'r/creativity',
      score: 201,
      comments: 37,
      content: "Remote creative work needs structure, but too many tools and processes can crush the magic. What's the right balance?",
      timeAgo: '9 hours ago',
      opportunity_score: 81,
      ai_suggestion: "Share creative team management insights and discuss tools that enhance rather than hinder creative collaboration.",
      engagement_potential: 'medium',
      projectId: '5'
    },
    {
      id: '61',
      title: 'Art education vs self-taught paths - industry perspective',
      author: 'creative_recruiter',
      subreddit: 'r/ArtistLounge',
      score: 312,
      comments: 64,
      content: "Hiring creative talent for 12 years. The gap between art school grads and self-taught artists is narrowing, but in unexpected ways.",
      timeAgo: '3 hours ago',
      opportunity_score: 88,
      ai_suggestion: "Share hiring insights for creative roles and discuss different educational paths in the arts industry.",
      engagement_potential: 'high',
      projectId: '5'
    },
    {
      id: '62',
      title: 'Sustainable art practices - materials and processes',
      author: 'eco_artist',
      subreddit: 'r/sustainability',
      score: 189,
      comments: 41,
      content: "Climate change is making artists reconsider materials and processes. What sustainable alternatives actually maintain artistic quality?",
      timeAgo: '5 hours ago',
      opportunity_score: 84,
      ai_suggestion: "Discuss sustainable art practices and share insights on environmentally conscious creative processes.",
      engagement_potential: 'medium',
      projectId: '5'
    }
  ];

  // Filter threads by selected project
  const threads = allThreads.filter(thread => thread.projectId === selectedProjectId);

  // Engagement functions
  const handleUpvote = (threadId: string) => {
    setUserVotes(prev => ({
      ...prev,
      [threadId]: prev[threadId] === 'up' ? null : 'up'
    }));
    // Provide user feedback about the action
    const thread = allThreads.find(t => t.id === threadId);
    alert(`✅ Upvoted "${thread?.title || 'thread'}"!\n\n(In production, this would call the Reddit API to actually upvote the post)`);
  };

  const handleDownvote = (threadId: string) => {
    setUserVotes(prev => ({
      ...prev,
      [threadId]: prev[threadId] === 'down' ? null : 'down'
    }));
    // Provide user feedback about the action
    const thread = allThreads.find(t => t.id === threadId);
    alert(`⬇️ Downvoted "${thread?.title || 'thread'}"!\n\n(In production, this would call the Reddit API to actually downvote the post)`);
  };

  const generateAiSuggestions = (thread: RedditThread) => {
    const suggestions = [
      `Based on your ${userProfile.expertise?.[0]} expertise: "${thread.ai_suggestion}"`,
      `Share a specific example: "I faced a similar challenge when..."`,
      `Ask a follow-up question: "Have you considered [specific approach]?"`,
      `Offer practical advice: "In my experience, the key is..."`,
      `Reference industry trends: "This aligns with current trends in..."`
    ];
    setAiSuggestions(suggestions);
    setShowAiHelper(true);
  };

  const handleComment = (threadId: string) => {
    if (commentText.trim()) {
      const thread = allThreads.find(t => t.id === threadId);
      alert(`💬 Comment Posted!\n\nYour comment on "${thread?.title}":\n\n"${commentText}"\n\n(In production, this would call the Reddit API to actually post your comment)`);
      setCommentText('');
      setSelectedThread(null);
      setShowAiHelper(false);
    }
  };

  const selectAiSuggestion = (suggestion: string) => {
    setCommentText(suggestion);
    setShowAiHelper(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#FF4500] to-[#FF6B35] rounded-lg flex items-center justify-center">
                <SparklesIcon />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Reddit Co-Pilot</h1>
                <p className="text-sm text-gray-600">Your personalized engagement assistant</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Projects Link */}
              <Link
                to="/projects"
                className="flex items-center space-x-2 px-4 py-2 text-[#FF4500] hover:text-[#E03E00] hover:bg-orange-50 rounded-lg transition-colors font-medium"
              >
                <span className="text-sm">🚀</span>
                <span className="text-sm">Projects</span>
              </Link>
            
              {/* Profile Dropdown Widget */}
              <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <UserProfileIcon />
                <span className="text-sm font-medium text-gray-700">{userProfile.name}'s Journey</span>
                <div className={`transform transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`}>
                  <ChevronDownIcon />
                </div>
              </button>
              
              {/* Dropdown Content */}
              <div className={`absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl transition-all duration-300 transform ${
                showProfileDropdown 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
              }`}>
                <div className="p-6 space-y-6">
                  {/* Profile Stats */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{userProfile.name}'s Reddit Journey</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Karma</span>
                        <span className="font-medium">1,247</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">This Week</span>
                        <span className="font-medium text-green-600">+47</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <span className="font-medium text-[#FF4500]">89%</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Communities */}
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-base font-medium text-gray-900 mb-3">Your Communities</h4>
                    <div className="space-y-2">
                      {userProfile.interests?.slice(0,3).map((interest: string) => (
                        <div key={interest} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{interest}</span>
                          <span className="text-xs text-gray-500 px-2 py-1 bg-green-100 text-green-700 rounded-full">Active</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Project Controls */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Project Selector */}
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({project.threadCount})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDownIcon />
              </div>
            </div>

            {/* Project Info */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${selectedProject.color}`}></div>
              <span className="text-sm text-gray-600">{selectedProject.focus}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Competitive Analysis Button */}
            <button
              onClick={() => {
                setShowCompetitiveAnalysis(!showCompetitiveAnalysis);
                if (!showCompetitiveAnalysis) {
                  setShowOpportunityMining(false); // Close Opportunity Mining when opening Competitive Analysis
                }
              }}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
            >
              <AnalyticsIcon />
              <span>Competitive Analysis</span>
            </button>

            {/* Opportunity Mining Button */}
            <button
              onClick={() => {
                setShowOpportunityMining(!showOpportunityMining);
                if (!showOpportunityMining) {
                  setShowCompetitiveAnalysis(false); // Close Competitive Analysis when opening Opportunity Mining
                }
              }}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
            >
              <GoldIcon />
              <span>Opportunity Mining</span>
            </button>

            {/* Add New Project Button */}
            <button className="flex items-center space-x-2 px-3 py-2 bg-[#FF4500] hover:bg-[#E03E00] text-white rounded-lg transition-colors text-sm">
              <PlusIcon />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Competitive Analysis Panel */}
        {showCompetitiveAnalysis && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl animate-slideIn">
            <h3 className="text-lg font-medium text-gray-900 mb-3 animate-fadeIn">Competitive Analysis</h3>
            
            {!competitiveResults && (
              <>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={competitiveTopic}
                    onChange={(e) => setCompetitiveTopic(e.target.value)}
                    placeholder="Enter topic, business, or keyword to analyze..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent transform transition-all duration-200 hover:scale-[1.01]"
                  />
                  <button
                    onClick={() => {
                      if (competitiveTopic.trim()) {
                        setIsAnalyzing(true);
                        // Simulate API call
                        setTimeout(() => {
                          setCompetitiveResults({
                            topic: competitiveTopic,
                            competitors: [
                              { name: 'Competitor A', marketShare: '25%', strength: 'Strong brand presence', weakness: 'High pricing' },
                              { name: 'Competitor B', marketShare: '18%', strength: 'Great user experience', weakness: 'Limited features' },
                              { name: 'Competitor C', marketShare: '15%', strength: 'Low cost leader', weakness: 'Poor customer support' }
                            ],
                            marketTrends: [
                              'Growing demand for AI-powered solutions',
                              'Shift towards mobile-first platforms',
                              'Increasing focus on data privacy'
                            ],
                            opportunities: [
                              'Underserved small business segment',
                              'Integration with popular tools lacking',
                              'Better onboarding experience needed'
                            ]
                          });
                          setIsAnalyzing(false);
                        }, 2000);
                      }
                    }}
                    disabled={!competitiveTopic.trim() || isAnalyzing}
                    className="px-4 py-2 bg-[#FF4500] text-white rounded-lg hover:bg-[#E03E00] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Analyzing...</span>
                      </div>
                    ) : (
                      'Analyze'
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2 animate-fadeIn delay-100">
                  Get insights on competitors, market activity, and trending discussions in your chosen area.
                </p>
              </>
            )}

            {/* Analysis Results */}
            {competitiveResults && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-800">Analysis Results for "{competitiveResults.topic}"</h4>
                  <button
                    onClick={() => {
                      setCompetitiveResults(null);
                      setCompetitiveTopic('');
                    }}
                    className="text-sm text-[#FF4500] hover:text-[#E03E00] transition-colors"
                  >
                    New Analysis
                  </button>
                </div>

                {/* Competitors */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 animate-slideInFromBottom">
                  <h5 className="font-medium text-gray-800 mb-3">Top Competitors</h5>
                  <div className="space-y-3">
                    {competitiveResults.competitors.map((competitor: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-start p-3 bg-orange-50 rounded-lg animate-slideInFromLeft" style={{ animationDelay: `${idx * 100}ms` }}>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h6 className="font-medium text-gray-800">{competitor.name}</h6>
                            <span className="text-xs bg-[#FF4500] text-white px-2 py-1 rounded">{competitor.marketShare}</span>
                          </div>
                          <p className="text-xs text-green-700">✅ {competitor.strength}</p>
                          <p className="text-xs text-red-700">❌ {competitor.weakness}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Market Trends */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 animate-slideInFromBottom delay-200">
                  <h5 className="font-medium text-gray-800 mb-3">Market Trends</h5>
                  <div className="space-y-2">
                    {competitiveResults.marketTrends.map((trend: string, idx: number) => (
                      <div key={idx} className="flex items-center space-x-2 animate-slideInFromLeft" style={{ animationDelay: `${(idx + 3) * 100}ms` }}>
                        <TrendingIcon />
                        <span className="text-sm text-gray-700">{trend}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Opportunities */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 animate-slideInFromBottom delay-300">
                  <h5 className="font-medium text-gray-800 mb-3">Market Opportunities</h5>
                  <div className="space-y-2">
                    {competitiveResults.opportunities.map((opportunity: string, idx: number) => (
                      <div key={idx} className="flex items-center space-x-2 animate-slideInFromLeft" style={{ animationDelay: `${(idx + 6) * 100}ms` }}>
                        <BulbIcon />
                        <span className="text-sm text-gray-700">{opportunity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="text-center animate-bounceIn delay-500">
                  <button className="px-6 py-3 bg-[#FF4500] text-white rounded-lg hover:bg-[#E03E00] transition-all duration-200 transform hover:scale-105 active:scale-95">
                    Create Project from Analysis →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Opportunity Mining Panel */}
        {showOpportunityMining && (
          <div className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-xl animate-slideIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 animate-fadeIn">Opportunity Mining Framework</h3>
              <div className="flex items-center space-x-2 animate-fadeIn delay-100">
                <span className="text-sm text-gray-600">Step {miningStep} of 5</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#FF4500] h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(miningStep / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Step 1: Market Selection */}
            {miningStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <h4 className="text-lg font-medium text-gray-800 flex items-center space-x-2 animate-slideInFromLeft">
                  <SearchIcon />
                  <span>Step 1: Select Your Market</span>
                </h4>
                <p className="text-gray-600 text-sm mb-4 animate-fadeIn delay-100">
                  Choose your primary market focus. This will help us find relevant discussions and pain points.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[
                    { name: 'Technology & Software', icon: '💻', desc: 'SaaS, apps, dev tools' },
                    { name: 'Health & Fitness', icon: '🏃‍♂️', desc: 'Wellness, medical, nutrition' },
                    { name: 'Finance & Business', icon: '💼', desc: 'FinTech, investing, B2B' },
                    { name: 'Education & Learning', icon: '📚', desc: 'EdTech, courses, training' },
                    { name: 'E-commerce & Retail', icon: '🛒', desc: 'Online stores, marketplace' },
                    { name: 'Entertainment & Media', icon: '🎬', desc: 'Streaming, gaming, content' },
                    { name: 'Food & Beverage', icon: '🍽️', desc: 'Restaurants, delivery, recipes' },
                    { name: 'Travel & Hospitality', icon: '✈️', desc: 'Booking, experiences, tourism' },
                    { name: 'Real Estate & Housing', icon: '🏠', desc: 'PropTech, rentals, construction' },
                    { name: 'Automotive & Transport', icon: '🚗', desc: 'Cars, logistics, mobility' },
                    { name: 'Fashion & Beauty', icon: '👗', desc: 'Clothing, cosmetics, style' },
                    { name: 'Relationships & Dating', icon: '❤️', desc: 'Dating apps, social, community' },
                    { name: 'Custom/Other', icon: '✏️', desc: 'Type your own category' }
                  ].map((market, idx) => (
                    <button
                      key={market.name}
                      onClick={() => setSelectedMarket(market.name)}
                      className={`p-3 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 animate-slideInFromBottom text-left ${
                        selectedMarket === market.name
                          ? 'border-[#FF4500] bg-orange-50 text-[#FF4500] shadow-lg'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-[#FF4500] hover:shadow-md'
                      }`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{market.icon}</span>
                        <h5 className="font-medium text-sm transform transition-all duration-200">{market.name}</h5>
                      </div>
                      <p className="text-xs opacity-75 transition-opacity duration-200">
                        {market.desc}
                      </p>
                    </button>
                  ))}
                </div>
                
                {/* Custom Market Input */}
                {selectedMarket === 'Custom/Other' && (
                  <div className="mt-4">
                    <input
                      type="text"
                      value={customMarket}
                      onChange={(e) => setCustomMarket(e.target.value)}
                      placeholder="Enter your custom market category (e.g., Gaming, Cryptocurrency, Pet Care, etc.)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent transition-all duration-200 transform hover:scale-[1.01] animate-slideInFromBottom"
                    />
                  </div>
                )}
                
                {((selectedMarket && selectedMarket !== 'Custom/Other') || (selectedMarket === 'Custom/Other' && customMarket.trim())) && (
                  <div className="mt-4">
                    <input
                      type="text"
                      value={selectedNiche}
                      onChange={(e) => setSelectedNiche(e.target.value)}
                      placeholder={`Enter a specific niche within ${selectedMarket === 'Custom/Other' ? customMarket.toLowerCase() || 'your market' : selectedMarket.toLowerCase()} (e.g., ${
                        selectedMarket === 'Custom/Other' ? 'specific problems or solutions in your market' :
                        selectedMarket.includes('Technology') ? 'AI tools, web development, mobile apps' :
                        selectedMarket.includes('Health') ? 'fitness tracking, mental health, nutrition' :
                        selectedMarket.includes('Finance') ? 'personal budgeting, crypto trading, business analytics' :
                        selectedMarket.includes('Education') ? 'online courses, language learning, coding bootcamps' :
                        selectedMarket.includes('E-commerce') ? 'dropshipping, subscription boxes, marketplace' :
                        selectedMarket.includes('Entertainment') ? 'streaming services, gaming platforms, content creation' :
                        selectedMarket.includes('Food') ? 'meal planning, food delivery, restaurant tech' :
                        selectedMarket.includes('Travel') ? 'booking platforms, travel planning, hospitality tech' :
                        selectedMarket.includes('Real Estate') ? 'property management, home buying, construction tech' :
                        selectedMarket.includes('Automotive') ? 'car sharing, logistics, vehicle tech' :
                        selectedMarket.includes('Fashion') ? 'sustainable fashion, beauty tech, personal styling' :
                        selectedMarket.includes('Relationships') ? 'dating apps, relationship coaching, social networking' :
                        'specific problems or solutions in this space'
                      })`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent transition-all duration-200 transform hover:scale-[1.01] animate-slideInFromBottom"
                    />
                    <button
                      onClick={() => setMiningStep(2)}
                      disabled={!selectedNiche.trim()}
                      className="mt-3 px-6 py-2 bg-[#FF4500] text-white rounded-lg hover:bg-[#E03E00] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 animate-pulse"
                    >
                      Validate Market Demand →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Demand Validation */}
            {miningStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <h4 className="text-lg font-medium text-gray-800 flex items-center space-x-2 animate-slideInFromLeft">
                  <TrendingIcon />
                  <span>Step 2: Validate Demand for "{selectedNiche}"</span>
                </h4>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm animate-slideInFromBottom">
                  <h5 className="font-medium text-gray-800 mb-2">Market Validation Results:</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between animate-slideInFromLeft" style={{ animationDelay: '100ms' }}>
                      <span className="text-gray-600">Google Search Volume:</span>
                      <span className="font-medium text-gray-900">12,000/month</span>
                    </div>
                    <div className="flex justify-between animate-slideInFromLeft" style={{ animationDelay: '200ms' }}>
                      <span className="text-gray-600">Trend Direction:</span>
                      <span className="font-medium text-[#FF4500]">↗ Growing</span>
                    </div>
                    <div className="flex justify-between animate-slideInFromLeft" style={{ animationDelay: '300ms' }}>
                      <span className="text-gray-600">Market Maturity:</span>
                      <span className="font-medium text-gray-900">Emerging</span>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-orange-50 rounded-lg animate-pulse">
                    <p className="text-xs text-[#FF4500]">
                      ✅ Strong market signals detected. This niche shows consistent demand with growth potential.
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3 animate-slideInFromBottom">
                  <button
                    onClick={() => setMiningStep(1)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setMiningStep(3)}
                    className="px-6 py-2 bg-[#FF4500] text-white rounded-lg hover:bg-[#E03E00] transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    Mine Reddit Data →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Reddit Data Mining */}
            {miningStep === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <h4 className="text-lg font-medium text-gray-800 flex items-center space-x-2 animate-slideInFromLeft">
                  <SearchIcon />
                  <span>Step 3: Mine Reddit Pain Points</span>
                </h4>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm animate-slideInFromBottom">
                  <h5 className="font-medium text-gray-800 mb-2">Automated Reddit Search Query:</h5>
                  <code className="text-xs bg-gray-100 p-2 rounded block text-gray-700 animate-bounceIn">
                    site:reddit.com "{selectedNiche}" ("frustrated" OR "struggling" OR "problem" OR "issue" OR "help")
                  </code>
                  <div className="mt-4">
                    <h6 className="font-medium text-gray-800 mb-2">Found High-Value Threads:</h6>
                    <div className="space-y-2">
                      {[
                        { title: `Struggling with ${selectedNiche} - need advice`, comments: 45, subreddit: `r/${selectedNiche.replace(' ', '')}` },
                        { title: `Why is ${selectedNiche} so difficult?`, comments: 32, subreddit: 'r/advice' },
                        { title: `${selectedNiche} solutions that actually work?`, comments: 67, subreddit: `r/${selectedMarket.toLowerCase()}` }
                      ].map((thread, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-orange-50 rounded animate-slideInFromLeft transition-all duration-200 hover:bg-orange-100 hover:scale-[1.02]" style={{ animationDelay: `${idx * 100}ms` }}>
                          <span className="text-sm text-gray-800">{thread.title}</span>
                          <div className="text-xs text-[#FF4500]">
                            {thread.comments} comments • {thread.subreddit}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3 animate-slideInFromBottom">
                  <button
                    onClick={() => setMiningStep(2)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setMiningStep(4)}
                    className="px-6 py-2 bg-[#FF4500] text-white rounded-lg hover:bg-[#E03E00] transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    Extract Pain Points →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Pain Point Extraction */}
            {miningStep === 4 && (
              <div className="space-y-4 animate-fadeIn">
                <h4 className="text-lg font-medium text-gray-800 flex items-center space-x-2 animate-slideInFromLeft">
                  <AnalyticsIcon />
                  <span>Step 4: AI Pain Point Analysis</span>
                </h4>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm animate-slideInFromBottom">
                  <h5 className="font-medium text-gray-800 mb-3">Extracted Pain Points:</h5>
                  <div className="space-y-3">
                    {[
                      {
                        title: 'Lack of Structure and Guidance',
                        description: `Users struggle with inconsistent approaches to ${selectedNiche}`,
                        quotes: ['It feels like I\'m just winging it', 'Need a systematic approach']
                      },
                      {
                        title: 'Time Management Issues',
                        description: `Difficulty balancing ${selectedNiche} with busy schedules`,
                        quotes: ['No time for this', 'Wish it was easier to track progress']
                      },
                      {
                        title: 'Information Overload',
                        description: `Too many conflicting opinions and strategies`,
                        quotes: ['Every expert says something different', 'Analysis paralysis']
                      }
                    ].map((pain, idx) => (
                      <div key={idx} className="p-3 bg-orange-50 rounded-lg animate-slideInFromLeft transition-all duration-200 hover:bg-orange-100 hover:scale-[1.02]" style={{ animationDelay: `${idx * 150}ms` }}>
                        <h6 className="font-medium text-gray-800">{pain.title}</h6>
                        <p className="text-sm text-gray-700 mt-1">{pain.description}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {pain.quotes.map((quote, qIdx) => (
                            <span key={qIdx} className="text-xs bg-orange-200 text-[#FF4500] px-2 py-1 rounded transition-all duration-200 hover:bg-orange-300">
                              "{quote}"
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-3 animate-slideInFromBottom">
                  <button
                    onClick={() => setMiningStep(3)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setMiningStep(5)}
                    className="px-6 py-2 bg-[#FF4500] text-white rounded-lg hover:bg-[#E03E00] transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    Generate SaaS Ideas →
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Business Idea Generation */}
            {miningStep === 5 && (
              <div className="space-y-4 animate-fadeIn">
                <h4 className="text-lg font-medium text-gray-800 flex items-center space-x-2 animate-slideInFromLeft">
                  <BulbIcon />
                  <span>Step 5: SaaS Opportunity Generation</span>
                </h4>
                <div className="space-y-4">
                  {[
                    {
                      name: `${selectedNiche} Assistant Pro`,
                      description: `AI-powered platform that provides personalized guidance and structure for ${selectedNiche}`,
                      market: 'Solution-focused approach',
                      features: ['Personalized action plans', 'Progress tracking', 'Expert guidance', 'Community support']
                    },
                    {
                      name: `Smart ${selectedNiche} Tracker`,
                      description: `Simple tracking and automation tool that eliminates time management issues`,
                      market: 'Time-optimization focus',
                      features: ['Automated tracking', 'Smart reminders', 'Habit building', 'Analytics dashboard']
                    },
                    {
                      name: `${selectedNiche} Clarity Hub`,
                      description: `Curated platform that cuts through information overload with expert-vetted content`,
                      market: 'Information curation',
                      features: ['Expert-curated content', 'Decision frameworks', 'Personalized recommendations', 'Clear action steps']
                    }
                  ].map((idea, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-[#FF4500] transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg animate-slideInFromBottom" style={{ animationDelay: `${idx * 200}ms` }}>
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-semibold text-gray-800">{idea.name}</h5>
                        <span className="text-xs bg-orange-200 text-[#FF4500] px-2 py-1 rounded">{idea.market}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{idea.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {idea.features.map((feature, fIdx) => (
                          <span key={fIdx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded transition-all duration-200 hover:bg-orange-100">
                            {feature}
                          </span>
                        ))}
                      </div>
                      <button 
                        onClick={() => handleCreateProjectFromIdea(idea)}
                        className="mt-3 text-sm text-[#FF4500] hover:text-[#E03E00] font-medium transition-all duration-200 transform hover:scale-105"
                      >
                        Create Project from This Idea →
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-3 animate-slideInFromBottom delay-300">
                  <button
                    onClick={() => setMiningStep(4)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      setShowOpportunityMining(false);
                      setMiningStep(1);
                      setSelectedMarket('');
                      setSelectedNiche('');
                    }}
                    className="px-6 py-2 bg-[#FF4500] text-white rounded-lg hover:bg-[#E03E00] transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    Start New Mining Session
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Opportunities Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {threads.length} Opportunities in {selectedProject.name}
          </h2>
        </div>

        {/* Three-Card Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden flex flex-col"
            >
              {/* Card Content - Flexible */}
              <div className="p-6 pb-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg font-medium">
                      {thread.subreddit}
                    </span>
                    <div className="flex items-center space-x-1">
                      <div className="w-7 h-7 bg-[#FF4500] text-white text-sm font-bold rounded-full flex items-center justify-center">
                        {thread.opportunity_score}
                      </div>
                    </div>
                  </div>
                  <span className={`w-3 h-3 rounded-full ${
                    thread.engagement_potential === 'high' ? 'bg-green-500' : 
                    thread.engagement_potential === 'medium' ? 'bg-orange-500' : 'bg-gray-500'
                  }`}></span>
                </div>

                {/* Thread Title - Clickable */}
                <h3 
                  className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 hover:text-[#FF4500] transition-colors cursor-pointer leading-tight"
                  onClick={() => setSelectedThread(thread)}
                >
                  {thread.title}
                </h3>

                {/* Thread Content Preview - Flexible */}
                <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed flex-1">{thread.content}</p>

                {/* Thread Stats & Voting */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-6">
                    {/* Upvote/Downvote */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpvote(thread.id);
                        }}
                        className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${
                          userVotes[thread.id] === 'up' ? 'text-orange-500' : 'text-gray-400'
                        }`}
                      >
                        <ArrowUpIcon filled={userVotes[thread.id] === 'up'} />
                      </button>
                      <span className="text-sm font-medium text-gray-700 min-w-[24px] text-center">
                        {thread.score + (userVotes[thread.id] === 'up' ? 1 : userVotes[thread.id] === 'down' ? -1 : 0)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownvote(thread.id);
                        }}
                        className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${
                          userVotes[thread.id] === 'down' ? 'text-blue-500' : 'text-gray-400'
                        }`}
                      >
                        <ArrowDownIcon filled={userVotes[thread.id] === 'down'} />
                      </button>
                    </div>

                    {/* Comments */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MessageCircleIcon />
                      <span>{thread.comments}</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{thread.timeAgo}</span>
                </div>
              </div>

              {/* AI Suggestion & Actions - Fixed at bottom */}
              <div className="px-6 pb-6 mt-auto">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">
                  <div className="flex items-start space-x-3">
                    <SparklesIcon />
                    <div className="flex-1">
                      <p className="text-sm text-blue-800 line-clamp-2">{thread.ai_suggestion}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setSelectedThread(thread);
                        generateAiSuggestions(thread);
                      }}
                      className="flex-1 py-3 bg-[#FF4500] text-white text-sm rounded-xl hover:bg-[#E03E00] transition-colors font-medium"
                    >
                      Comment with AI
                    </button>
                    <button
                      onClick={() => setSelectedThread(thread)}
                      className="px-4 py-3 border border-gray-300 text-gray-700 text-sm rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      View Full
                    </button>
                  </div>
                  <button
                    onClick={() => handleSaveOpportunity(thread)}
                    className={`w-full py-2.5 text-sm rounded-xl transition-colors font-medium ${
                      isOpportunitySaved(thread.id)
                        ? 'bg-orange-100 text-[#FF4500] border border-orange-200 hover:bg-orange-200'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {isOpportunitySaved(thread.id) ? '🌟 Saved' : '⭐ Save for Later'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Engagement Modal */}
      {selectedThread && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="border-b border-gray-200 p-6 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                      {selectedThread.subreddit}
                    </span>
                    <span className="text-sm text-gray-500">u/{selectedThread.author}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{selectedThread.timeAgo}</span>
                    <div className="flex items-center space-x-1 ml-4">
                      <div className="w-5 h-5 bg-[#FF4500] text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {selectedThread.opportunity_score}
                      </div>
                      <span className="text-xs text-gray-500">opportunity score</span>
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedThread.title}</h2>
                </div>
                <button
                  onClick={() => {
                    setSelectedThread(null);
                    setShowAiHelper(false);
                    setCommentText('');
                  }}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                {/* Left: Thread Content */}
                <div className="p-6 border-r border-gray-200">
                  <div className="mb-6">
                    <p className="text-gray-800 leading-relaxed">{selectedThread.content}</p>
                  </div>

                  {/* Voting & Stats */}
                  <div className="flex items-center space-x-6 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpvote(selectedThread.id)}
                        className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                          userVotes[selectedThread.id] === 'up' ? 'text-orange-500' : 'text-gray-400'
                        }`}
                      >
                        <ArrowUpIcon filled={userVotes[selectedThread.id] === 'up'} />
                      </button>
                      <span className="font-medium text-gray-700">
                        {selectedThread.score + (userVotes[selectedThread.id] === 'up' ? 1 : userVotes[selectedThread.id] === 'down' ? -1 : 0)}
                      </span>
                      <button
                        onClick={() => handleDownvote(selectedThread.id)}
                        className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                          userVotes[selectedThread.id] === 'down' ? 'text-blue-500' : 'text-gray-400'
                        }`}
                      >
                        <ArrowDownIcon filled={userVotes[selectedThread.id] === 'down'} />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MessageCircleIcon />
                      <span>{selectedThread.comments} comments</span>
                    </div>
                  </div>

                  {/* Primary AI Insight */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <SparklesIcon />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-2">AI Engagement Strategy</h4>
                        <p className="text-blue-800">{selectedThread.ai_suggestion}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: AI-Powered Comment Assistant */}
                <div className="p-6 flex flex-col">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Comment with AI Assistant</h3>
                  
                  {/* AI Suggestions */}
                  {showAiHelper && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">AI-Generated Comment Ideas:</h4>
                      <div className="space-y-2">
                        {aiSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => selectAiSuggestion(suggestion)}
                            className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors border"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comment Input */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write your comment here... Click 'Get AI Help' for suggestions!"
                        className="w-full h-40 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent"
                      />
                    </div>
                    
                    {/* Comment Actions */}
                    <div className="mt-4 flex flex-col space-y-3">
                      {!showAiHelper && (
                        <button
                          onClick={() => generateAiSuggestions(selectedThread)}
                          className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                        >
                          <SparklesIcon />
                          <span>Get AI Help</span>
                        </button>
                      )}
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleComment(selectedThread.id)}
                          disabled={!commentText.trim()}
                          className="flex-1 py-2 bg-[#FF4500] text-white rounded-md hover:bg-[#E03E00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          Post Comment
                        </button>
                        <button
                          onClick={() => {
                            setCommentText('');
                            setShowAiHelper(false);
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RedditCoPilot;