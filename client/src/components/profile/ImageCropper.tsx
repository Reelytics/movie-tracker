import { useState, useCallback, useEffect } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export default function ImageCropper({
  image,
  onCropComplete,
  onCancel,
  aspectRatio = 1
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (newCrop: Point) => {
    setCrop(newCrop);
  };

  const onZoomChange = (newZoom: number[]) => {
    setZoom(newZoom[0]);
  };

  const onCropCompleteCallback = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  // Reset the cropper state when the image changes
  useEffect(() => {
    if (image) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [image]);

  return (
    <Dialog open={!!image} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="text-center">Crop Profile Picture</DialogTitle>
        <div className="relative w-full h-64 mt-4">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteCallback}
            onZoomChange={setZoom}
            cropShape="round"
            showGrid={false}
          />
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="zoom-slider" className="block text-sm font-medium">
            Zoom: {zoom.toFixed(1)}x
          </Label>
          <Slider
            id="zoom-slider"
            min={1}
            max={3}
            step={0.1}
            value={[zoom]}
            onValueChange={onZoomChange}
            className="w-full"
          />
        </div>
        <DialogFooter className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={createCroppedImage} className="flex-1">
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to create a cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  // Set canvas size to avoid quality reduction
  canvas.width = safeArea;
  canvas.height = safeArea;

  // Draw rotated image
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.translate(-safeArea / 2, -safeArea / 2);

  // Draw the image in the center of the canvas
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  // Calculate the proper positions taking into account the crop position
  const centerX = safeArea / 2;
  const centerY = safeArea / 2;
  
  // Calculate the actual position using the crop x and y values (which are percentages)
  const cropX = centerX - (image.width / 2) + (pixelCrop.x);
  const cropY = centerY - (image.height / 2) + (pixelCrop.y);
  
  // Extract the cropped image at the correct position
  const data = ctx.getImageData(
    cropX,
    cropY,
    pixelCrop.width,
    pixelCrop.height
  );

  // Set canvas width to final desired crop size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Place cropped image data on the canvas
  ctx.putImageData(data, 0, 0);

  // Return as data URL (base64)
  return canvas.toDataURL('image/jpeg', 0.85);
}