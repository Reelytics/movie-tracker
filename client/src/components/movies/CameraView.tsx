import { useState, useEffect, useRef } from "react";
import { X, Camera, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as Drawer from "vaul";

interface CameraViewProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture?: (imageSrc: string) => void;
}

export default function CameraView({ isOpen, onClose, onCapture }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraPermission, setCameraPermission] = useState<
    "granted" | "denied" | "prompt" | "unsupported"
  >("prompt");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraPermission("unsupported");
        setCameraError("Your browser doesn't support camera access");
        return;
      }

      const startCamera = async () => {
        try {
          // Get permissions state if available
          if (navigator.permissions && navigator.permissions.query) {
            try {
              const permissionStatus = await navigator.permissions.query({
                name: "camera" as PermissionName,
              });
              
              setCameraPermission(permissionStatus.state as "granted" | "denied" | "prompt");
              
              // Listen for permission changes
              permissionStatus.onchange = () => {
                setCameraPermission(permissionStatus.state as "granted" | "denied" | "prompt");
              };
            } catch (e) {
              console.log("Permissions API not fully supported");
            }
          }

          // Attempt to get camera stream
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment", // Use back camera on mobile
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });

          // Camera access granted
          setCameraPermission("granted");
          setCameraStream(stream);

          // Attach stream to video element
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              setIsCameraReady(true);
            };
          }
        } catch (error) {
          console.error("Camera error:", error);
          setCameraPermission("denied");
          if (error instanceof Error) {
            setCameraError(
              error.name === "NotAllowedError"
                ? "Camera access denied. Please allow camera access in your browser settings."
                : `Error accessing camera: ${error.message}`
            );
          } else {
            setCameraError("An unknown error occurred while accessing the camera");
          }
        }
      };

      startCamera();
    }

    // Clean up camera resources when component unmounts or modal closes
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => {
          track.stop();
        });
        setCameraStream(null);
        setIsCameraReady(false);
      }
    };
  }, [isOpen]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    const context = canvas.getContext("2d");
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image as data URL
      const imageSrc = canvas.toDataURL("image/jpeg");

      // Call onCapture callback with image data
      if (onCapture) {
        onCapture(imageSrc);
      }

      // Close camera view
      onClose();
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/80 z-50" />
        <Drawer.Content className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex-1 relative flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-white bg-black/50 rounded-full"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold text-white">Scan Ticket</h2>
              <div className="w-10"></div>
            </div>

            {/* Camera View */}
            <div className="flex-1 flex items-center justify-center">
              {cameraPermission === "granted" && !cameraError ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-white border-opacity-70 rounded-lg w-4/5 h-2/5"></div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-white p-6">
                  {cameraPermission === "denied" && (
                    <>
                      <Camera className="h-12 w-12 mx-auto mb-4 text-red-500" />
                      <h3 className="text-xl font-bold mb-2">Camera Access Denied</h3>
                      <p className="mb-4">
                        Please enable camera access in your browser settings to use
                        this feature.
                      </p>
                      <Button
                        variant="outline"
                        className="text-white border-white hover:bg-white/20"
                        onClick={onClose}
                      >
                        Close
                      </Button>
                    </>
                  )}
                  {cameraPermission === "unsupported" && (
                    <>
                      <Camera className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                      <h3 className="text-xl font-bold mb-2">
                        Camera Not Supported
                      </h3>
                      <p className="mb-4">
                        Your browser or device doesn't support camera access.
                      </p>
                      <Button
                        variant="outline"
                        className="text-white border-white hover:bg-white/20"
                        onClick={onClose}
                      >
                        Close
                      </Button>
                    </>
                  )}
                  {cameraPermission === "prompt" && (
                    <>
                      <Camera className="h-12 w-12 mx-auto mb-4 text-blue-500 animate-pulse" />
                      <h3 className="text-xl font-bold mb-2">
                        Requesting Camera Access
                      </h3>
                      <p className="mb-4">
                        Please allow camera access when prompted by your browser.
                      </p>
                    </>
                  )}
                  {cameraError && (
                    <p className="text-red-400 text-sm mt-2">{cameraError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Capture button */}
            {isCameraReady && (
              <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center p-6">
                <Button
                  size="lg"
                  className="rounded-full h-16 w-16 bg-white flex items-center justify-center p-0"
                  onClick={handleCapture}
                >
                  <div className="h-14 w-14 rounded-full border-2 border-primary flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-primary"></div>
                  </div>
                </Button>
              </div>
            )}

            {/* Hidden canvas for capturing images */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
