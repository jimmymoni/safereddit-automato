-- Supabase Database Schema for SafeReddit Automator
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'super-secret-jwt-token-with-at-least-32-characters-long';

-- Create user_profiles table
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users NOT NULL,
    email TEXT,
    name TEXT,
    reddit_username TEXT,
    reddit_token TEXT,
    reddit_refresh_token TEXT,
    reddit_connected BOOLEAN DEFAULT FALSE,
    autopilot_settings JSONB DEFAULT '{}',
    account_health DECIMAL DEFAULT 100.0,
    post_karma INTEGER DEFAULT 0,
    comment_karma INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (id)
);

-- Create activity_logs table  
CREATE TABLE public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    action TEXT NOT NULL,
    target TEXT,
    result TEXT,
    metadata JSONB DEFAULT '{}',
    karma_change INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create content_items table
CREATE TABLE public.content_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL, -- post, comment, image, link
    tags TEXT[], -- array of tags
    subreddits TEXT[], -- array of target subreddits  
    status TEXT DEFAULT 'draft', -- draft, ready, published, archived
    performance JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create scheduled_posts table
CREATE TABLE public.scheduled_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    content_item_id UUID REFERENCES public.content_items,
    subreddit TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    post_type TEXT NOT NULL, -- text, link, image
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'scheduled', -- scheduled, posted, failed, cancelled
    reddit_post_id TEXT,
    result JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create autopilot_sessions table
CREATE TABLE public.autopilot_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    mode TEXT NOT NULL, -- conservative, balanced, aggressive, custom
    settings JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    performance JSONB DEFAULT '{}'
);

-- Create reddit_insights table
CREATE TABLE public.reddit_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    type TEXT NOT NULL, -- opportunity, timing, safety, learning
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    confidence DECIMAL NOT NULL,
    priority TEXT NOT NULL, -- high, medium, low
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create subreddit_analysis table
CREATE TABLE public.subreddit_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subreddit TEXT UNIQUE NOT NULL,
    member_count INTEGER,
    active_users INTEGER,
    posting_frequency DECIMAL,
    engagement_rate DECIMAL,
    best_posting_times JSONB DEFAULT '{}',
    content_preferences JSONB DEFAULT '{}',
    rules JSONB DEFAULT '{}',
    moderator_activity JSONB DEFAULT '{}',
    risk_level DECIMAL DEFAULT 1.0,
    last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create trending_topics table
CREATE TABLE public.trending_topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    subreddit TEXT NOT NULL,
    score INTEGER NOT NULL,
    comment_count INTEGER NOT NULL,
    engagement_score DECIMAL NOT NULL,
    keywords TEXT[], -- array of keywords
    sentiment TEXT,
    opportunity TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Row Level Security Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopilot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reddit_insights ENABLE ROW LEVEL SECURITY;

-- User profiles: Users can only see and modify their own profile
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Activity logs: Users can only see their own logs
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Content items: Users can only manage their own content
CREATE POLICY "Users can manage their own content" ON public.content_items
    FOR ALL USING (auth.uid() = user_id);

-- Scheduled posts: Users can only manage their own scheduled posts  
CREATE POLICY "Users can manage their own scheduled posts" ON public.scheduled_posts
    FOR ALL USING (auth.uid() = user_id);

-- Autopilot sessions: Users can only manage their own sessions
CREATE POLICY "Users can manage their own autopilot sessions" ON public.autopilot_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Reddit insights: Users can see their own insights + global insights (user_id IS NULL)
CREATE POLICY "Users can view relevant insights" ON public.reddit_insights
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own insights" ON public.reddit_insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public tables (no RLS needed)
-- subreddit_analysis and trending_topics are public data

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER handle_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_content_items_updated_at
    BEFORE UPDATE ON public.content_items
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_scheduled_posts_updated_at
    BEFORE UPDATE ON public.scheduled_posts
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_subreddit_analysis_updated_at
    BEFORE UPDATE ON public.subreddit_analysis
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, name, reddit_connected, account_health, post_karma, comment_karma)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'name',
        FALSE,
        100.0,
        0,
        0
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;