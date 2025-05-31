import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import TicketScannerButton from '@/components/tickets/TicketScannerButton';

interface Ticket {
  id: number;
  movieTitle: string;
  theaterName: string | null;
  showDate: string | null;
  showTime: string | null;
  price: string | null;
  ticketImagePath: string | null;
  createdAt: string;
}

const TicketListPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/tickets/tickets', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch tickets');
        }
        
        const data = await response.json();
        setTickets(data);
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const handleViewTicket = (ticketId: number) => {
    navigate(`/tickets/${ticketId}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">My Movie Tickets</h1>
        <TicketScannerButton />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="text-5xl mb-4">🎟️</div>
          <h2 className="text-xl font-semibold mb-2 dark:text-white">No tickets yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start scanning your movie tickets to keep track of your cinema experiences
          </p>
          <div className="flex justify-center">
            <TicketScannerButton />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map((ticket) => (
            <div 
              key={ticket.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleViewTicket(ticket.id)}
            >
              <div className="p-4">
                <h2 className="font-semibold text-lg mb-2 line-clamp-1 dark:text-white">{ticket.movieTitle}</h2>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>{ticket.theaterName || 'Unknown Theater'}</span>
                  <span>{ticket.price || 'Price N/A'}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{ticket.showDate || 'Date N/A'}</span>
                  <span>{ticket.showTime || 'Time N/A'}</span>
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                Scanned {formatDate(ticket.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketListPage;
