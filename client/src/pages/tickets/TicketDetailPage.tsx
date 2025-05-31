import React from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface Ticket {
  id: number;
  userId: number;
  movieId: number | null;
  movieTitle: string;
  theaterName: string | null;
  showTime: string | null;
  showDate: string | null;
  price: string | null;
  seatNumber: string | null;
  movieRating: string | null;
  theaterRoom: string | null;
  ticketNumber: string | null;
  rawOcrText: string | null;
  ticketImagePath: string | null;
  createdAt: string;
}

const TicketDetailPage: React.FC = () => {
  const [, params] = useRoute('/tickets/:id');
  const [, navigate] = useLocation();
  const ticketId = params?.id;
  
  // Fetch the ticket data using React Query
  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      if (!ticketId) {
        throw new Error('No ticket ID provided');
      }
      
      console.log(`Fetching ticket with ID: ${ticketId}`);
      const response = await fetch(`/api/tickets/ticket/${ticketId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Failed to fetch ticket: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Ticket data received:', data);
      return data as Ticket;
    },
    enabled: !!ticketId, // Only run the query if we have a ticket ID
    retry: 1, // Only retry once if it fails
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  const handleDelete = async () => {
    if (!ticket) return;
    
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      try {
        const response = await fetch(`/api/tickets/ticket/${ticket.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete ticket');
        }
        
        navigate('/tickets');
      } catch (err) {
        console.error('Error deleting ticket:', err);
        alert(err instanceof Error ? err.message : 'Failed to delete ticket');
      }
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };
  
  // Handle case where no ID is provided
  if (!ticketId) {
    console.log('No ticket ID provided, redirecting to tickets list');
    navigate('/tickets');
    return null;
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error || !ticket) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-100 px-4 py-3 rounded-md">
          {error instanceof Error ? error.message : 'Ticket not found'}
        </div>
        <button
          onClick={() => navigate('/tickets')}
          className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Back to Tickets
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Ticket Details</h1>
        <button
          onClick={() => navigate('/tickets')}
          className="text-primary hover:underline"
        >
          Back to Tickets
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">{ticket.movieTitle}</h2>
        
        {ticket.ticketImagePath && (
          <div className="mb-6">
            <img 
              src={`/uploads/tickets/${ticket.ticketImagePath.split('/').pop()}`} 
              alt="Ticket" 
              className="max-w-full h-auto rounded-md shadow-sm"
            />
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Theater</h3>
            <p className="mb-2 dark:text-white">{ticket.theaterName || 'N/A'}</p>
            
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Show Date</h3>
            <p className="mb-2 dark:text-white">{ticket.showDate || 'N/A'}</p>
            
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Show Time</h3>
            <p className="mb-2 dark:text-white">{ticket.showTime || 'N/A'}</p>
            
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Price</h3>
            <p className="mb-2 dark:text-white">{ticket.price || 'N/A'}</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Seat</h3>
            <p className="mb-2 dark:text-white">{ticket.seatNumber || 'N/A'}</p>
            
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Theater Room</h3>
            <p className="mb-2 dark:text-white">{ticket.theaterRoom || 'N/A'}</p>
            
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Movie Rating</h3>
            <p className="mb-2 dark:text-white">{ticket.movieRating || 'N/A'}</p>
            
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Ticket Number</h3>
            <p className="mb-2 dark:text-white">{ticket.ticketNumber || 'N/A'}</p>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Scanned on {formatDate(ticket.createdAt)}
        </div>
      </div>
      
      {ticket.rawOcrText && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3 dark:text-white">OCR Raw Text</h3>
          <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md text-xs text-gray-800 dark:text-gray-200 overflow-auto max-h-40">
            {ticket.rawOcrText}
          </pre>
        </div>
      )}
      
      <div className="flex justify-between">
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Delete Ticket
        </button>
        
        <button
          onClick={() => ticket.movieId ? navigate(`/movie/${ticket.movieId}`) : null}
          className={`px-4 py-2 ${ticket.movieId ? 'bg-primary hover:bg-primary/90' : 'bg-gray-400 cursor-not-allowed'} text-white rounded-md`}
          disabled={!ticket.movieId}
        >
          View Movie Details
        </button>
      </div>
    </div>
  );
};

export default TicketDetailPage;
