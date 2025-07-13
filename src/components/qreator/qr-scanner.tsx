'use client';

import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Camera, QrCode, Link as LinkIcon, Text, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
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

    // Cleanup
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><QrCode className="text-primary"/>Scan Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-start gap-3 bg-muted p-3 rounded-lg">
                    {isLink ? <LinkIcon className="h-5 w-5 mt-1" /> : <Text className="h-5 w-5 mt-1" />}
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
    );
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Camera className="text-primary" />
            QR Code Scanner
        </CardTitle>
        <CardDescription>
            {isScanning ? 'Position a QR code within the frame.' : 'Scan complete.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasCameraPermission === null && (
             <div className="flex items-center justify-center aspect-video bg-muted rounded-md">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Requesting camera access...</p>
            </div>
        )}
        {hasCameraPermission === false && (
             <Alert variant="destructive">
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera access in your browser settings to use this feature.
              </AlertDescription>
            </Alert>
        )}
        {hasCameraPermission === true && (
            <div className="relative aspect-video">
                <video ref={videoRef} className={`w-full aspect-video rounded-md ${isScanning ? '' : 'hidden'}`} autoPlay muted playsInline />
                <canvas ref={canvasRef} className="hidden"/>
                {isScanning && (
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-3/4 h-3/4 border-4 border-dashed border-primary/50 rounded-lg"/>
                     </div>
                )}
                {!isScanning && renderResult()}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
