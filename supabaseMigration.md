# MovieTracker: Supabase Migration Plan

This document outlines a step-by-step approach to migrate the MovieTracker application to Supabase for Authentication, Storage, and Database services. Each epic is broken down into small, achievable stories for incremental progress and quick wins.

## EPIC 1: Initial Setup & Environment Configuration

### Story 1.1: Supabase Project Setup
- Create Supabase account and new project
- Configure project settings and region
- Save API keys and project URL
- Document project details for reference

### Story 1.2: Development Environment Setup
- Install Supabase client libraries:
  ```bash
  npm install @supabase/supabase-js
  ```
- Create client configuration file:
  ```javascript
  // src/lib/supabase.ts
  import { createClient } from '@supabase/supabase-js';
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  export const supabase = createClient(supabaseUrl, supabaseAnonKey);
  ```
- Set up environment variables in .env file
- Update .gitignore to exclude sensitive information

### Story 1.3: Create Proof-of-Concept Component
- Implement a simple component using Supabase client
- Create a test connection to verify configuration
- Document any issues or necessary adjustments

## EPIC 2: Database Migration - Schema & Structure

### Story 2.1: Database Schema Analysis
- Export current schema from PostgreSQL
- Document table relationships and dependencies
- Identify tables for initial migration vs. later phases
- Create migration sequence diagram

### Story 2.2: Core Tables Setup in Supabase
- Create users table:
  ```sql
  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    bio TEXT,
    profile_picture TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```
- Create movies table
- Create watched_movies junction table
- Verify table structures and relationships

### Story 2.3: Social Features Tables Setup
- Create followers table with appropriate constraints
- Set up favorites table
- Test relationships between social and core tables

### Story 2.4: Ticket Management Tables Setup
- Create movie_tickets table
- Add necessary indexes and constraints
- Test with sample data

### Story 2.5: User Preferences Tables Setup
- Create user_genre_preferences table
- Set up any additional preference tables
- Verify relationships with users table

## EPIC 3: Row Level Security (RLS) Implementation

### Story 3.1: Core Tables RLS
- Enable RLS on users table:
  ```sql
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can view all profiles" 
    ON users FOR SELECT USING (true);
  CREATE POLICY "Users can update own profile" 
    ON users FOR UPDATE USING (auth.uid() = id);
  ```
- Configure RLS for movies table (public read)
- Set up watched_movies RLS (personal records)

### Story 3.2: Social Features RLS
- Configure RLS for followers table
- Set up favorites table security policies
- Test social feature access controls

### Story 3.3: Ticket Management RLS
- Configure RLS for movie_tickets table:
  ```sql
  CREATE POLICY "Users can view own tickets" 
    ON movie_tickets FOR SELECT 
    USING (user_id = auth.uid());
  ```
- Test ticket security with multiple user scenarios
- Document RLS policies for future reference

## EPIC 4: Authentication Migration

### Story 4.1: Supabase Auth Configuration
- Set up email authentication provider
- Configure password policies
- Set up email templates for verification
- Test registration flow

### Story 4.2: Auth Hooks Implementation
- Create useAuth hook for React:
  ```typescript
  // src/hooks/useAuth.ts
  import { useState, useEffect } from 'react';
  import { User } from '@supabase/supabase-js';
  import { supabase } from '../lib/supabase';
  
  export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      // Get initial session
      const { data: { user } } = supabase.auth.getUser();
      setUser(user);
      setLoading(false);
  
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_, session) => {
          setUser(session?.user ?? null);
        }
      );
  
      return () => subscription.unsubscribe();
    }, []);
  
    return { user, loading };
  }
  ```
- Create AuthProvider component
- Test authentication state persistence

### Story 4.3: Login Component Migration
- Update Login form to use Supabase:
  ```typescript
  async function handleLogin(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      // Handle error
    } else {
      // Redirect to dashboard
    }
  }
  ```
- Add error handling
- Implement "Remember me" functionality
- Test login flow thoroughly

### Story 4.4: Registration Component Migration
- Update Registration form for Supabase:
  ```typescript
  async function handleSignUp(email: string, password: string, name: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });
    
    // Handle result
  }
  ```
- Add email verification handling
- Implement first-time profile setup
- Test registration flow end-to-end

### Story 4.5: User Profile Management
- Implement password change functionality
- Create email change flow
- Add profile picture upload using Supabase Storage
- Test profile management features

## EPIC 5: Data Migration

### Story 5.1: Migration Script Foundations
- Create base migration script structure
- Implement database connection to both systems
- Create logging and error handling framework

### Story 5.2: Users Data Migration
- Export existing users data
- Map to Supabase schema
- Create Supabase auth users with admin API
- Link auth users to profiles

### Story 5.3: Movies & History Migration
- Migrate movies data
- Transfer user watch history
- Validate data integrity
- Fix any inconsistencies

### Story 5.4: Social Data Migration
- Transfer followers/following relationships
- Migrate user favorites
- Verify social connections

### Story 5.5: Tickets Data Migration
- Download and prepare ticket images
- Create migration script for ticket records
- Validate ticket data
- Test ticket retrieval

## EPIC 6: Storage Migration

### Story 6.1: Storage Buckets Setup
- Create 'tickets' bucket in Supabase:
  ```sql
  -- After creating the bucket in the UI
  -- Set appropriate policies
  CREATE POLICY "Users can upload their own tickets" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'tickets' AND auth.uid()::text = (storage.foldername(name))[1]);
  ```
- Create 'profile-pictures' bucket
- Configure CORS settings
- Test basic uploads

### Story 6.2: Ticket Images Transfer
- Download existing ticket images
- Create folder structure by user ID
- Upload to Supabase Storage:
  ```typescript
  async function migrateTicketImage(filePath, userId, ticketId) {
    const fileData = await fs.promises.readFile(filePath);
    const fileName = `${ticketId}.jpg`;
    const storagePath = `${userId}/${fileName}`;
    
    const { error } = await supabase.storage
      .from('tickets')
      .upload(storagePath, fileData);
      
    if (!error) {
      // Update database reference
    }
  }
  ```
- Update database references

### Story 6.3: Profile Pictures Transfer
- Migrate user profile pictures
- Update user records with new URLs
- Test profile picture display

### Story 6.4: Frontend Storage Integration
- Create useStorage hook for React
- Implement upload component for tickets:
  ```typescript
  async function uploadTicketImage(file: File) {
    const user = supabase.auth.getUser();
    const fileName = `${Date.now()}.jpg`;
    const filePath = `${user.id}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('tickets')
      .upload(filePath, file);
      
    if (error) {
      console.error('Error uploading ticket:', error);
      return null;
    }
    
    return supabase.storage
      .from('tickets')
      .getPublicUrl(filePath).data.publicUrl;
  }
  ```
- Update ticket scanner to use Storage
- Test complete upload flow

## EPIC 7: AI Vision Integration with Edge Functions

### Story 7.1: Supabase CLI Setup
- Install Supabase CLI
- Configure local development
- Create project linking
- Test CLI functionality

### Story 7.2: Basic Edge Function Creation
- Create first edge function:
  ```bash
  supabase functions new analyze-ticket
  ```
- Implement simple test function
- Deploy and verify operation
- Document deployment process

### Story 7.3: Vision API Integration
- Implement OpenAI provider in edge function:
  ```typescript
  // supabase/functions/analyze-ticket/index.ts
  import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
  
  serve(async (req) => {
    const { imageUrl, provider } = await req.json();
    
    if (provider === 'openai') {
      // OpenAI implementation
    }
    
    return new Response(
      JSON.stringify({ success: true, data: {} }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  });
  ```
- Test with sample ticket images
- Implement error handling
- Document API usage

### Story 7.4: Multiple Providers Support
- Add Anthropic provider implementation
- Implement Google Vision provider
- Add Azure Vision provider
- Create provider switching mechanism

### Story 7.5: Frontend Integration
- Create hook for ticket analysis:
  ```typescript
  function useTicketAnalysis() {
    const [analyzing, setAnalyzing] = useState(false);
    
    const analyzeTicket = async (imageUrl, provider = 'openai') => {
      setAnalyzing(true);
      try {
        const { data, error } = await supabase.functions.invoke('analyze-ticket', {
          body: { imageUrl, provider }
        });
        
        if (error) throw error;
        return data;
      } finally {
        setAnalyzing(false);
      }
    };
    
    return { analyzeTicket, analyzing };
  }
  ```
- Update ticket scanner component
- Test end-to-end functionality
- Document usage patterns

## EPIC 8: API Migration from Express

### Story 8.1: API Endpoints Analysis
- Catalog all Express endpoints
- Categorize by function (CRUD, complex logic, etc.)
- Create migration priority list
- Document endpoints to be replaced vs. kept

### Story 8.2: Database API Migration
- Replace basic CRUD endpoints with Supabase Client:
  ```typescript
  // BEFORE (Express endpoint call)
  const getMovie = async (id) => {
    const response = await fetch(`/api/movies/${id}`);
    return response.json();
  };
  
  // AFTER (Supabase)
  const getMovie = async (id) => {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  };
  ```
- Create data service layer
- Test data operations
- Document pattern for team

### Story 8.3: Complex Logic Migration
- Identify endpoints requiring custom logic
- Create edge functions for complex operations
- Implement business logic in edge functions
- Test with various scenarios

### Story 8.4: TMDB Integration Refactoring
- Move TMDB API calls to edge function or client
- Implement caching strategy
- Update movie search functionality
- Test with various search terms

### Story 8.5: Frontend API Client Update
- Create Supabase service layer
- Refactor API calls throughout the application
- Implement error handling
- Test all API integrations

## EPIC 9: Realtime Features Implementation

### Story 9.1: Realtime Basics Setup
- Implement basic subscription in a test component:
  ```typescript
  useEffect(() => {
    const subscription = supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'movies' },
        (payload) => {
          console.log('New movie added:', payload.new);
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
  ```
- Test basic realtime functionality
- Document subscription patterns

### Story 9.2: Social Features Realtime
- Implement followers/following realtime updates
- Create realtime notifications for new followers
- Test with multiple browser sessions

### Story 9.3: Movie Activities Realtime
- Add realtime updates for friend activity
- Implement watch status changes notifications
- Test with various user scenarios

### Story 9.4: Presence Detection
- Implement online status for users
- Create typing indicators for reviews
- Test presence functionality

## EPIC 10: Testing, Monitoring & Cutover

### Story 10.1: Component Testing
- Create test suite for auth components
- Test storage interactions
- Validate form submissions
- Document test coverage

### Story 10.2: Integration Testing
- Test full user journeys
- Verify data flows end-to-end
- Test edge cases and error handling
- Document test scenarios

### Story 10.3: Dual-Write Implementation
- Implement write-to-both strategy for critical operations
- Create verification tools for data consistency
- Test with production-like data volume
- Document discrepancies and fixes

### Story 10.4: Monitoring Setup
- Implement error tracking with Sentry or similar tool
- Create dashboard for Supabase metrics
- Set up alerts for critical issues
- Document monitoring practices

### Story 10.5: Final Cutover Plan
- Create detailed cutover checklist
- Schedule migration window
- Prepare communications for users
- Document rollback procedures

### Story 10.6: Post-Migration Cleanup
- Remove deprecated Express endpoints
- Clean up dual-write code
- Update documentation
- Archive legacy systems properly

## EPIC 11: Performance Optimization

### Story 11.1: Query Optimization
- Review and optimize critical queries
- Implement indexes for common query patterns
- Test query performance
- Document optimization techniques

### Story 11.2: RLS Performance Analysis
- Analyze RLS policies performance impact
- Optimize complex policies
- Test with various data sizes
- Document best practices

### Story 11.3: Edge Functions Optimization
- Review edge function performance
- Implement caching where appropriate
- Optimize cold start time
- Document performance metrics

### Story 11.4: Frontend Optimization
- Implement query caching with React Query
- Optimize realtime subscriptions
- Reduce unnecessary renders
- Document performance improvements

## EPIC 12: Enhanced Features & Future Development

### Story 12.1: Passwordless Authentication
- Implement magic link authentication
- Create email templates
- Test user experience
- Document implementation

### Story 12.2: Social Login Integration
- Add Google authentication provider
- Implement Twitter/X login
- Connect social profiles with existing accounts
- Test social login flows

### Story 12.3: Advanced Storage Features
- Implement image resizing with transformations
- Create image optimization pipeline
- Add support for video uploads
- Test with various media types

### Story 12.4: Analytics Implementation
- Set up Supabase Analytics
- Create custom event tracking
- Implement dashboard for key metrics
- Document data collection practices

## Migration Progress Tracking

| Epic | Status | Completion % | Notes |
|------|--------|-------------|-------|
| 1. Initial Setup | Not Started | 0% | |
| 2. Database Migration - Schema | Not Started | 0% | |
| 3. Row Level Security | Not Started | 0% | |
| 4. Authentication Migration | Not Started | 0% | |
| 5. Data Migration | Not Started | 0% | |
| 6. Storage Migration | Not Started | 0% | |
| 7. AI Vision Integration | Not Started | 0% | |
| 8. API Migration | Not Started | 0% | |
| 9. Realtime Features | Not Started | 0% | |
| 10. Testing & Cutover | Not Started | 0% | |
| 11. Performance Optimization | Not Started | 0% | |
| 12. Enhanced Features | Not Started | 0% | |

## Quick Wins Checklist

- [ ] Create Supabase project
- [ ] Install Supabase client library
- [ ] Create first database table
- [ ] Implement basic auth login
- [ ] Upload first test image to Storage
- [ ] Create first simple Edge Function
- [ ] Replace one Express endpoint with Supabase client
- [ ] Implement first realtime feature
- [ ] Migrate one user to Supabase Auth
- [ ] Test ticket scanner with Supabase Storage
