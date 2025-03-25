import { useState, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function TicketScan() {
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle camera activation
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  // Cleanup on unmount
  const handleBack = () => {
    stopCamera();
  };

  return (
    <div id="ticket-scan-view" className="relative min-h-screen bg-black flex flex-col">
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/add" onClick={handleBack}>
            <button className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <h1 className="text-lg font-medium">Scan Ticket</h1>
          <div className="w-10"></div> {/* Spacer for alignment */}
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center p-4">
        <div className="camera-feed relative mx-auto w-full max-w-md aspect-[3/4] bg-card mb-6">
          {cameraActive ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 border-2 border-dashed border-white/40 rounded-md flex items-center justify-center">
              <div className="text-center px-6">
                <Camera className="h-16 w-16 mb-4 opacity-50 mx-auto" />
                <p className="text-lg font-medium mb-1">Scan your movie ticket</p>
                <p className="text-sm text-muted-foreground mb-3">Position the entire ticket within the frame</p>
                <p className="text-xs text-muted-foreground">We extract movie details from your ticket automatically</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="w-full max-w-md p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button 
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium mb-3"
              onClick={cameraActive ? stopCamera : startCamera}
            >
              {cameraActive ? "Stop Camera" : "Start Camera"}
            </Button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              variant="outline"
              className="w-full py-3 bg-card rounded-lg font-medium"
            >
              Select from Gallery
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
