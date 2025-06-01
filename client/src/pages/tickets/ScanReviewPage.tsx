import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { MovieTicket } from '../../../../shared/schema';

interface ScanReviewPageProps {}

const ScanReviewPage: React.FC<ScanReviewPageProps> = () => {
  const [, navigate] = useLocation();
  const location = useLocation();
  
  const [ticketData, setTicketData] = useState<any>(null);
  const [editedTicket, setEditedTicket] = useState<Partial<MovieTicket>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use effect to extract data from location state
  useEffect(() => {
    // Check if location has state and ticketData
    console.log('Location in ScanReviewPage:', location);
    
    // @ts-ignore - accessing the state property
    const state = location?.[0]?.state;
    console.log('State from location:', state);
    
    if (state && state.ticketData) {
      console.log('Ticket data from state:', state.ticketData);
      setTicketData(state.ticketData);
      setEditedTicket(state.ticketData);
    } else {
      console.log('No ticket data found in location state, attempting to fetch from API');
      // Try to get the latest scanned ticket from server
      fetchLatestTicket();
    }
  }, []);
  
  // Fallback: Fetch latest scanned ticket if no data in location state
  const fetchLatestTicket = async () => {
    try {
      const response = await fetch('/api/tickets/latest-scan', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.data) {
          setTicketData(data.data);
          setEditedTicket(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching latest ticket:', error);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedTicket(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Validate required fields
      if (!editedTicket.movieTitle) {
        setError('Movie title is required');
        setIsSaving(false);
        return;
      }
      
      // Ensure the ticketImagePath is included
      if (ticketData && ticketData.ticketImagePath && !editedTicket.ticketImagePath) {
        setEditedTicket(prev => ({
          ...prev,
          ticketImagePath: ticketData.ticketImagePath
        }));
      }
      
      const dataToSave = {
        ...editedTicket,
        ticketImagePath: ticketData?.ticketImagePath || editedTicket.ticketImagePath
      };
      
      console.log('Saving ticket data:', dataToSave);
      
      // Make sure we have the ticket image path
      if (!dataToSave.ticketImagePath && ticketData?.ticketImagePath) {
        dataToSave.ticketImagePath = ticketData.ticketImagePath;
      }
      
      // Save the ticket
      const response = await fetch('/api/tickets/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save ticket');
      }
      
      // Navigate to the ticket detail page or profile
      navigate('/profile', { 
        replace: true,
        state: { message: 'Ticket saved successfully!' }
      });
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!ticketData && !editedTicket.movieTitle) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Ticket Review</h1>
        <p className="text-red-500">No ticket data available. Please scan a ticket first.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Back to Home
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Review Ticket Information</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Movie Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="movieTitle"
              value={editedTicket.movieTitle || ''}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Show Date
              </label>
              <input
                type="text"
                name="showDate"
                value={editedTicket.showDate || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. 05/13/2025"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Show Time
              </label>
              <input
                type="text"
                name="showTime"
                value={editedTicket.showTime || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. 7:30 PM"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Theater Name
              </label>
              <input
                type="text"
                name="theaterName"
                value={editedTicket.theaterName || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Theater Chain
              </label>
              <input
                type="text"
                name="theaterName"
                value={editedTicket.theaterName || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. AMC, Regal"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seat Number
              </label>
              <input
                type="text"
                name="seatNumber"
                value={editedTicket.seatNumber || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. J12"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Theater Room
              </label>
              <input
                type="text"
                name="theaterRoom"
                value={editedTicket.theaterRoom || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. Theater 5"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="text"
                name="price"
                value={editedTicket.price || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. $12.99"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Movie Rating
              </label>
              <input
                type="text"
                name="movieRating"
                value={editedTicket.movieRating || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. PG-13"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ticket Type
              </label>
              <input
                type="text"
                name="ticketType"
                value={editedTicket.movieRating || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. PG-13"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ticket Number
            </label>
            <input
              type="text"
              name="ticketNumber"
              value={editedTicket.ticketNumber || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving || !editedTicket.movieTitle}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:bg-gray-400"
          >
            {isSaving ? 'Saving...' : 'Save Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanReviewPage;