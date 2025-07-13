'use client';

import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Camera, QrCode, Link as LinkIcon, Text, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
           throw new Error('Camera not available on this browser');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();

    const cleanup = () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };

    return cleanup;
  }, [toast]);

  useEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && isScanning) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (canvas) {
          const context = canvas.getContext('2d', { willReadFrequently: true });
          if(context){
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (code) {
              setScanResult(code.data);
              setIsScanning(false);
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };
    
    if(hasCameraPermission && isScanning) {
        animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isScanning, hasCameraPermission]);

  const handleRescan = () => {
    setScanResult(null);
    setIsScanning(true);
  };

  const isUrl = (text: string) => {
    try {
      new URL(text);
      return true;
    } catch (_) {
      return false;
    }
  }

  const renderResult = () => {
    if (!scanResult) return null;

    const isLink = isUrl(scanResult);

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
            <Card className="w-[90%] max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><QrCode className="text-primary"/>Scan Result</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-start gap-3 bg-muted p-3 rounded-lg">
                        {isLink ? <LinkIcon className="h-5 w-5 mt-1 flex-shrink-0" /> : <Text className="h-5 w-5 mt-1 flex-shrink-0" />}
                        <p className="break-all font-mono text-sm">{scanResult}</p>
                    </div>
                    {isLink && (
                        <Button asChild className="w-full">
                            <a href={scanResult} target="_blank" rel="noopener noreferrer">
                                Open Link
                            </a>
                        </Button>
                    )}
                     <Button variant="outline" onClick={handleRescan} className="w-full">Scan Again</Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="absolute inset-0">
        {hasCameraPermission === null && (
             <div className="w-full h-full flex items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-white">Requesting camera access...</p>
            </div>
        )}
        
        <div className="relative w-full h-full">
            <video 
                ref={videoRef} 
                className={cn(
                    'w-full h-full object-cover',
                    isScanning && hasCameraPermission ? 'block' : 'hidden'
                )} 
                autoPlay 
                muted 
                playsInline 
            />
            <canvas ref={canvasRef} className="hidden"/>

            {hasCameraPermission === false && (
                <div className="w-full h-full flex items-center justify-center bg-black p-4">
                    <Alert variant="destructive" className="max-w-md">
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                            Please allow camera access in your browser settings to use this feature.
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            {isScanning && hasCameraPermission && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="w-[70vmin] h-[70vmin] border-4 border-dashed border-primary/80 rounded-lg shadow-lg"/>
                    <div className="absolute top-4 left-4 text-white bg-black/50 p-2 rounded-md">
                        <p className="font-headline text-lg">QR Code Scanner</p>
                        <p className="text-sm">Position a QR code within the frame.</p>
                    </div>
                </div>
            )}
            {!isScanning && renderResult()}
        </div>
    </div>
  );
}
