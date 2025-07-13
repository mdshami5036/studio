'use client';

import React, { useRef } from 'react';
import QRCode from 'qrcode.react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

type QrPreviewProps = {
  value: string;
  fgColor?: string;
  bgColor?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
  imageSettings?: {
    src: string;
    height: number;
    width: number;
    excavate: boolean;
  };
};

export default function QrPreview({ value, fgColor, bgColor, level, imageSettings }: QrPreviewProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQR = (format: 'png' | 'jpeg') => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL(`image/${format}`);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qreator-code.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle className="font-headline">Preview</CardTitle>
        <CardDescription>This is how your QR code will look.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-6 bg-muted/30 rounded-md aspect-square">
        <div ref={qrRef}>
            {typeof window !== 'undefined' ? (
                 <QRCode
                    value={value}
                    size={256}
                    fgColor={fgColor}
                    bgColor={bgColor}
                    level={level}
                    imageSettings={imageSettings}
                    renderAs="canvas"
                    className="rounded-lg shadow-lg"
                 />
            ) : <Skeleton className="h-[256px] w-[256px]"/>}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 pt-6">
        <Button onClick={() => downloadQR('png')} className="w-full bg-primary hover:bg-primary/90">
          <Download className="mr-2 h-4 w-4" /> PNG
        </Button>
        <Button onClick={() => downloadQR('jpeg')} variant="secondary" className="w-full">
          <Download className="mr-2 h-4 w-4" /> JPEG
        </Button>
      </CardFooter>
    </Card>
  );
}
