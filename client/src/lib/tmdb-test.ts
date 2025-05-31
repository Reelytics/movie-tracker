// Simple test script to verify TMDB API configuration
import { getTrendingMovies, getGenres, fetchTMDB } from './tmdb';

// Test the API with both methods to ensure they work
async function testTMDBAPI() {
  console.log('==========================================');
  console.log('Testing TMDB API Configuration');
  console.log('==========================================');
  
  try {
    // Test using the standard methods (with Bearer token)
    console.log('\n1. Testing getTrendingMovies (with Bearer token):');
    const trending = await getTrendingMovies();
    console.log(`✅ Success! Received ${trending.length} trending movies`);
    console.log(`First movie title: ${trending[0]?.title || 'N/A'}`);
    
    console.log('\n2. Testing getGenres (with Bearer token):');
    const genres = await getGenres();
    console.log(`✅ Success! Received ${genres.length} genres`);
    console.log(`First genre: ${genres[0]?.name || 'N/A'}`);
    
    // Test using the fallback method
    console.log('\n3. Testing fallback method:');
    const movieData = await fetchTMDB('/movie/popular', { page: '1' });
    console.log(`✅ Success! Received ${movieData.results?.length || 0} popular movies`);
    console.log(`First movie title: ${movieData.results?.[0]?.title || 'N/A'}`);
    
    console.log('\n==========================================');
    console.log('✅ All tests passed! TMDB API is configured correctly');
    console.log('==========================================');
  } catch (error) {
    console.error('\n❌ Error during TMDB API test:', error);
    console.log('\nTips to fix:');
    console.log('1. Check that your API key and access token are correct in .env file');
    console.log('2. Ensure your access token has not expired');
    console.log('3. Check if you have the correct permissions set for your TMDB account');
    console.log('4. Verify your internet connection');
  }
}

// Run the test
testTMDBAPI();
