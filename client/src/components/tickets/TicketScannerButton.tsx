import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';

// Button to trigger ticket scanning
const TicketScannerButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, navigate] = useLocation();
  
  // Close options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showOptions && 
        optionsRef.current && 
        buttonRef.current && 
        !optionsRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowOptions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptions]);

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Check dropdown position when it appears
  useEffect(() => {
    if (showOptions && optionsRef.current) {
      const dropdown = optionsRef.current;
      const rect = dropdown.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      if (rect.right > viewportWidth) {
        // If dropdown extends beyond right edge of viewport, align to right
        dropdown.style.right = '0';
        dropdown.style.left = 'auto';
      } else if (rect.left < 0) {
        // If dropdown extends beyond left edge of viewport, align to left
        dropdown.style.right = 'auto';
        dropdown.style.left = '0';
      }
    }
  }, [showOptions]);

  // Handle when video metadata is loaded
  useEffect(() => {
    const handleVideoReady = () => {
      console.log('Video ready to play');
      setIsCameraReady(true);
    };

    const handleVideoError = (event: any) => {
      console.error('Video element error:', event);
      alert(`Camera error: ${event.target.error?.message || 'Unknown video error'}`);
      setIsCameraReady(false);
    };

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener('loadedmetadata', handleVideoReady);
      videoElement.addEventListener('error', handleVideoError);
      
      // Force a refresh of video element
      if (videoElement.srcObject) {
        try {
          videoElement.play().catch(err => {
            console.error('Error playing video on mount:', err);
          });
        } catch (err) {
          console.error('Exception playing video on mount:', err);
        }
      }
      
      return () => {
        videoElement.removeEventListener('loadedmetadata', handleVideoReady);
        videoElement.removeEventListener('error', handleVideoError);
      };
    }
  }, [showCamera]);

  // Handle ticket image upload from file
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    await processImage(files[0]);
  };

  // Process image file (from file input or camera)
  const processImage = async (file: File) => {
    try {
      setIsLoading(true);
      setShowOptions(false);
      setShowCamera(false);
      
      // Stop camera stream if active
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      
      const formData = new FormData();
      formData.append('ticketImage', file);
      formData.append('provider', 'Google Gemini Vision');
      
      const response = await fetch('/api/tickets/scan', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan ticket');
      }
      
      console.log('Ticket scan successful:', data);
      
      // Add ticketImagePath to the ticket data if not present
      if (data.data && !data.data.ticketImagePath) {
        data.data.ticketImagePath = response.headers.get('X-Ticket-Image-Path') || '';
      }
      
      // Navigate to the review page with the scanned ticket data
      navigate('/scan-review', { 
        replace: true,
        state: { 
          ticketData: data.data,
          provider: data.provider 
        } 
      });
    } catch (error) {
      console.error('Error scanning ticket:', error);
      alert('Failed to scan ticket: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Toggle options dropdown
  const toggleOptions = () => {
    // Close camera if open
    if (showCamera) {
      handleCloseCamera();
    }
    setShowOptions(!showOptions);
    
    // Check dropdown position on next tick after rendering
    if (!showOptions) {
      setTimeout(() => {
        const dropdown = optionsRef.current;
        if (dropdown) {
          const rect = dropdown.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          
          // If dropdown extends beyond right edge of viewport
          if (rect.right > viewportWidth) {
            dropdown.style.right = '0';
            dropdown.style.left = 'auto';
          } else {
            dropdown.style.right = 'auto';
            dropdown.style.left = '0';
          }
        }
      }, 0);
    }
  };

  // Start the camera
  const handleCameraClick = async () => {
    setShowOptions(false);
    setIsCameraReady(false);
    
    try {
      console.log('Requesting camera access...');
      
      // First check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera access.');
      }
      
      // List available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available video devices:', videoDevices);
      
      if (videoDevices.length === 0) {
        throw new Error('No video input devices detected.');
      }
      
      // Use minimal constraints - this can help with compatibility
      const constraints = {
        video: true,
        audio: false
      };
      
      console.log('Requesting camera with constraints:', constraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Camera stream obtained:', mediaStream);
      
      // Log all tracks
      mediaStream.getTracks().forEach(track => {
        console.log(`Track kind: ${track.kind}, label: ${track.label}, state: ${track.readyState}`);
      });
      
      setStream(mediaStream);
      setShowCamera(true);
      
      // Connect stream to video element with a delay to ensure the DOM is ready
      setTimeout(() => {
        if (videoRef.current) {
          console.log('Setting video srcObject...');
          videoRef.current.srcObject = mediaStream;
          
          // Ensure the video element has proper attributes
          videoRef.current.setAttribute('autoplay', 'true');
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.muted = true;
          
          // Play the video
          videoRef.current.play()
            .then(() => {
              console.log('Video playback started successfully');
              setIsCameraReady(true);
            })
            .catch(error => {
              console.error('Error starting video playback:', error);
              // Try to handle autoplay restrictions
              if (error.name === 'NotAllowedError') {
                console.log('Autoplay prevented. User interaction required.');
                alert('Please click anywhere on the screen to enable camera.');
                
                // Add a click handler to the document to try playing on user interaction
                const handleUserInteraction = () => {
                  if (videoRef.current) {
                    videoRef.current.play()
                      .then(() => {
                        console.log('Video playback started after user interaction');
                        setIsCameraReady(true);
                      })
                      .catch(e => console.error('Still failed to play video:', e));
                  }
                  document.removeEventListener('click', handleUserInteraction);
                };
                
                document.addEventListener('click', handleUserInteraction);
              }
            });
        } else {
          console.error('Video ref is null');
        }
      }, 100);
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access camera: ' + (err instanceof Error ? err.message : 'Unknown error'));
      
      // Fall back to file input
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };
  
  // Handle taking a photo from the camera - simplified
  const handleTakePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref is null');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    try {
      // Simple direct approach - use client width/height if videoWidth/Height are zero
      canvas.width = video.videoWidth || video.clientWidth || 640;
      canvas.height = video.videoHeight || video.clientHeight || 480;
      
      console.log(`Canvas dimensions set to ${canvas.width}x${canvas.height}`);
      
      const context = canvas.getContext('2d');
      if (context) {
        // Draw video to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          if (blob) {
            console.log('Photo captured, size:', blob.size);
            const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
            await processImage(file);
          } else {
            console.error('Failed to create blob from canvas');
            alert('Failed to capture photo');
          }
        }, 'image/jpeg', 0.95);
      } else {
        console.error('Failed to get canvas context');
      }
    } catch (err) {
      console.error('Error capturing photo:', err);
      alert('Failed to capture photo: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };
  
  // Close camera view
  const handleCloseCamera = () => {
    // Stop all video tracks
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind, track.label);
        track.stop();
      });
      setStream(null);
    } else {
      console.log('No stream to stop');
    }
    
    setShowCamera(false);
    setIsCameraReady(false);
  };

  const handleGalleryClick = () => {
    setShowOptions(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="relative">
      {/* Hidden file input for gallery selection */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        ref={fileInputRef}
        className="hidden"
      />
      
      {/* Main scan button */}
      <button
        onClick={toggleOptions}
        disabled={isLoading || showCamera}
        ref={buttonRef}
        className="flex items-center justify-center gap-2 bg-primary text-white font-medium rounded-full px-5 py-2.5 shadow-md hover:bg-primary/90 transition-colors disabled:bg-gray-400"
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⭘</span>
            <span>Scanning...</span>
          </>
        ) : (
          <>
            <span className="text-xl">📸</span>
            <span>Scan Ticket</span>
            <span className="ml-1 text-lg">▾</span>
          </>
        )}
      </button>

      {/* Option buttons that appear when main button is clicked */}
      {showOptions && (
        <div 
          ref={optionsRef}
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 w-56 border border-gray-200 dark:border-gray-700"
        >
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            Choose an option
          </div>
          <button
            onClick={handleCameraClick}
            className="flex items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left border-b border-gray-100 dark:border-gray-700 dark:text-white"
          >
            <span className="text-xl">📷</span>
            <span className="font-medium">Take Photo</span>
          </button>
          <button
            onClick={handleGalleryClick}
            className="flex items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left dark:text-white"
          >
            <span className="text-xl">🖼️</span>
            <span className="font-medium">Choose from Gallery</span>
          </button>
        </div>
      )}
      
      {/* Camera view */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Video status indicator - simplified */}
          {!isCameraReady && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-70 z-10">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin mb-2"></div>
                <p>Camera starting...</p>
              </div>
            </div>
          )}
          
          {/* Video preview - simplified attributes to ensure compatibility */}
          <video 
            ref={videoRef} 
            className="w-full h-full bg-black"
          />
          
          {/* Hidden canvas for capturing */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Camera controls */}
          <div className="absolute bottom-8 inset-x-0 flex justify-center space-x-4">
            <button
              onClick={handleTakePhoto}
              disabled={!isCameraReady}
              className={`w-16 h-16 rounded-full ${isCameraReady ? 'bg-white' : 'bg-gray-500'} flex items-center justify-center shadow-lg border-4 ${isCameraReady ? 'border-primary' : 'border-gray-400'}`}
            >
              <div className={`w-12 h-12 rounded-full ${isCameraReady ? 'bg-primary' : 'bg-gray-400'}`}></div>
            </button>
            
            {!isCameraReady && (
              <button
                onClick={() => {
                  // Force camera to be ready anyway
                  setIsCameraReady(true);
                }}
                className="absolute bottom-24 bg-white text-black px-4 py-2 rounded-full shadow-lg"
              >
                Force Enable Camera
              </button>
            )}
            
            <button
              onClick={handleCloseCamera}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Fallback button to use gallery if camera isn't working */}
            <button
              onClick={() => {
                handleCloseCamera();
                handleGalleryClick();
              }}
              className="absolute bottom-24 right-4 bg-white text-black px-4 py-2 rounded-full shadow-lg"
            >
              Use Gallery Instead
            </button>
          </div>
          
          {/* Debug info for camera issues */}
          <div className="absolute top-4 left-4 text-white text-xs bg-black bg-opacity-50 p-2 rounded">
            {stream ? `Camera active: ${stream.active}` : 'No stream'}
            {stream && ` | Tracks: ${stream.getTracks().length}`}
            {stream && stream.getVideoTracks()[0] && ` | ${stream.getVideoTracks()[0].label}`}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketScannerButton;