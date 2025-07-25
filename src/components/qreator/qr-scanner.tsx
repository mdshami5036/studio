
'use client';

import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { QrCode, Link as LinkIcon, Text, Loader2, Camera, Zap, ZapOff, RefreshCw, Image as ImageIcon, SlidersHorizontal, Search, FileSymlink, CreditCard, FileText, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Slider } from '../ui/slider';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Link from 'next/link';


type FacingMode = 'user' | 'environment';

export default function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      if (!isScanning) return;
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
  }, [toast, facingMode, isScanning]);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (canvas) {
            const context = canvas.getContext('2d');
            if (context) {
              canvas.width = img.width;
              canvas.height = img.height;
              context.drawImage(img, 0, 0, img.width, img.height);
              const imageData = context.getImageData(0, 0, img.width, img.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height);
              if (code) {
                setScanResult(code.data);
                setIsScanning(false);
              } else {
                toast({
                  variant: 'destructive',
                  title: 'Scan Failed',
                  description: 'No QR code found in the selected image.',
                });
              }
            }
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
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
    const isUPI = scanResult.startsWith('upi://');

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
            <div className="bg-background w-full h-full flex flex-col">
              <header className="flex items-center justify-between p-4 border-b">
                 <h2 className="text-lg font-semibold flex items-center gap-2"><QrCode className="text-primary"/>Scan Result</h2>
                 <Button variant="ghost" size="icon" onClick={handleRescan}>
                    <X />
                 </Button>
              </header>
              <main className="flex-1 p-6 overflow-auto">
                 <div className="bg-muted p-4 rounded-lg break-words font-mono text-sm">
                    {scanResult}
                 </div>
              </main>
              <footer className="p-4 border-t grid gap-2">
                 {(isLink || isUPI) && (
                    <Button asChild size="lg" className="w-full">
                        <a href={scanResult} target="_blank" rel="noopener noreferrer">
                            {isUPI ? 'Pay via UPI' : 'Open Link'}
                        </a>
                    </Button>
                )}
                 <Button variant="outline" size="lg" onClick={handleRescan} className="w-full">Scan Again</Button>
              </footer>
            </div>
        </div>
    );
  }

  const MenuLink = ({ href, icon: Icon, children }: { href: string; icon: React.ElementType; children: React.ReactNode }) => (
    <Link href={href} passHref>
      <Button variant="ghost" className="w-full justify-start text-base py-6">
        <Icon className="mr-3 h-5 w-5 text-primary" />
        {children}
      </Button>
    </Link>
  );

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
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

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
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                            <SlidersHorizontal />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="rounded-t-lg">
                        <SheetHeader>
                          <SheetTitle>Create a QR Code</SheetTitle>
                          <SheetDescription>
                            Select the type of content you want to embed in your QR code.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-2 py-4">
                          <MenuLink href="/generate?tab=url" icon={LinkIcon}>URL</MenuLink>
                          <MenuLink href="/generate?tab=text" icon={Text}>Text</MenuLink>
                          <MenuLink href="/generate?tab=image" icon={ImageIcon}>Image</MenuLink>
                          <MenuLink href="/generate?tab=pdf" icon={FileText}>PDF</MenuLink>
                          <MenuLink href="/generate?tab=tour" icon={FileSymlink}>AI Tour</MenuLink>
                          <MenuLink href="/generate?tab=upi" icon={CreditCard}>UPI Payment</MenuLink>
                        </div>
                      </SheetContent>
                    </Sheet>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={triggerFileUpload} className="text-white hover:bg-white/20">
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
