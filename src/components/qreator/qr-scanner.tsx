'use client';

import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { QrCode, Link as LinkIcon, Text, Loader2, Camera, Zap, ZapOff, RefreshCw, Image as ImageIcon, SlidersHorizontal, Search, FileSymlink, User, Mail, MessageSquare, MapPin, Phone, Calendar as CalendarIcon, Clipboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Slider } from '../ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link';


type FacingMode = 'user' | 'environment';

export default function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [zoom, setZoom] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    let stream: MediaStream | null = null;
    let track: MediaStreamTrack | null = null;
    
    const getCameraPermission = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
           throw new Error('Camera not available on this browser');
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
             track = stream!.getVideoTracks()[0];
             const capabilities = track.getCapabilities();
             // @ts-ignore
             if (capabilities.torch) {
                // Flashlight supported
             }
             // @ts-ignore
             if (capabilities.zoom) {
                // Zoom supported
             }
          }
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
        const mediaStream = videoRef.current.srcObject as MediaStream;
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };

    return cleanup;
  }, [toast, facingMode]);

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

  const toggleFlash = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      // @ts-ignore
      if (capabilities.torch) {
        track.applyConstraints({
          // @ts-ignore
          advanced: [{ torch: !isFlashOn }]
        })
        .then(() => setIsFlashOn(!isFlashOn))
        .catch(e => console.error('Failed to toggle flash:', e));
      } else {
        toast({ description: "Flash not available on this device."})
      }
    }
  };

  const handleZoomChange = (value: number[]) => {
    const newZoom = value[0];
    setZoom(newZoom);
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        // @ts-ignore
        if (capabilities.zoom) {
            // @ts-ignore
            track.applyConstraints({ advanced: [{ zoom: newZoom }] });
        }
    }
  }

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }

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
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 p-4">
            <Card className="w-full max-w-md">
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
    <div className="absolute inset-0 bg-black">
        {hasCameraPermission === null && (
             <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <p className="ml-2 text-white">Requesting camera access...</p>
            </div>
        )}
        
        <div className="relative w-full h-full">
            <video 
                ref={videoRef} 
                className={cn(
                    'w-full h-full object-cover transition-transform duration-300',
                    isScanning && hasCameraPermission ? 'block' : 'hidden'
                )}
                style={{ transform: `scale(${zoom})`}}
                autoPlay 
                muted 
                playsInline 
            />
            <canvas ref={canvasRef} className="hidden"/>

            {hasCameraPermission === false && (
                <div className="w-full h-full flex items-center justify-center bg-black p-4">
                    <Alert variant="destructive" className="max-w-md">
                        <AlertTitle><Camera className="h-4 w-4 mr-2 inline-block"/>Camera Access Required</AlertTitle>
                        <AlertDescription>
                            Please allow camera access in your browser settings to use this feature.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
            
            {isScanning && hasCameraPermission && (
              <>
                {/* Overlay and Scanning Box */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                   <div className="w-[60vmin] h-[60vmin] relative overflow-hidden">
                        {/* Box corners */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                        
                        {/* Animated laser */}
                        <div className="scanner-laser w-full"></div>
                   </div>
                </div>

                {/* Top Toolbar */}
                <div className="absolute top-0 left-0 right-0 flex justify-between p-4 bg-gradient-to-b from-black/50 to-transparent z-20">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                            <SlidersHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Create QR</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                         <DropdownMenuItem onSelect={() => navigator.clipboard.readText().then(text => setScanResult(text ? `URL: ${text}`: ''))}>
                            <Clipboard className="mr-2 h-4 w-4" />
                            <span>Content from clipboard</span>
                        </DropdownMenuItem>
                        <Link href="/generate?tab=url" passHref>
                          <DropdownMenuItem>
                            <LinkIcon className="mr-2 h-4 w-4" />
                            <span>URL</span>
                          </DropdownMenuItem>
                        </Link>
                         <Link href="/generate?tab=text" passHref>
                          <DropdownMenuItem>
                            <Text className="mr-2 h-4 w-4" />
                            <span>Text</span>
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/generate?tab=tour" passHref>
                          <DropdownMenuItem>
                            <FileSymlink className="mr-2 h-4 w-4" />
                            <span>AI Tour</span>
                          </DropdownMenuItem>
                        </Link>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                            <ImageIcon />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={toggleFlash} className="text-white hover:bg-white/20">
                            {isFlashOn ? <Zap /> : <ZapOff />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={toggleCamera} className="text-white hover:bg-white/20">
                            <RefreshCw />
                        </Button>
                    </div>
                </div>

                 {/* Bottom Zoom Control */}
                 <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent z-20">
                    <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                        <Search className="text-white/80" />
                        <Slider
                            defaultValue={[1]}
                            value={[zoom]}
                            min={1}
                            max={4}
                            step={0.1}
                            onValueChange={handleZoomChange}
                            className="w-full"
                        />
                        <Search className="text-white/80 h-6 w-6" />
                    </div>
                 </div>
              </>
            )}

            {renderResult()}
        </div>
    </div>
  );
}
