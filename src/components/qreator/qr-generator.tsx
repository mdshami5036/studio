'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { QrCode, Link, Type, Bot, Palette, Image as ImageIcon } from 'lucide-react';
import QrPreview from './qr-preview';

type QrOptions = {
  value: string;
  fgColor: string;
  bgColor: string;
  level: 'L' | 'M' | 'Q' | 'H';
  imageSettings?: {
    src: string;
    height: number;
    width: number;
    excavate: boolean;
  };
};

export default function QrGenerator() {
  const [tab, setTab] = useState('url');
  const [url, setUrl] = useState('https://firebase.google.com/');
  const [text, setText] = useState('Hello, world!');
  const [tourDetails, setTourDetails] = useState(
    'This is a tour of the Eiffel Tower in Paris, France. It was designed and built by Gustave Eiffel for the 1889 World\'s Fair.'
  );
  
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const [fgColor, setFgColor] = useState('#008080');
  const [bgColor, setBgColor] = useState('#E0F8F8');
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    // Cleanup for logo object URL
    return () => {
      if (logo) {
        URL.revokeObjectURL(logo);
      }
    };
  }, [logo]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (logo) {
      URL.revokeObjectURL(logo);
      setLogo(undefined);
    }
    const file = e.target.files?.[0];
    if (file) {
      setLogo(URL.createObjectURL(file));
      setShowLogo(true);
    }
  };

  const qrValue = useMemo(() => {
    switch (tab) {
      case 'url':
        return url;
      case 'text':
        return text;
      case 'tour':
        return `${origin}/tour?details=${encodeURIComponent(tourDetails)}`;
      default:
        return '';
    }
  }, [tab, url, text, tourDetails, origin]);

  const qrOptions: QrOptions = {
    value: qrValue,
    fgColor: fgColor,
    bgColor: bgColor,
    level: 'L',
    imageSettings:
      logo && showLogo
        ? {
            src: logo,
            height: 48,
            width: 48,
            excavate: true,
          }
        : undefined,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
      <div className="md:col-span-3 flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <QrCode className="text-primary" /> Content Type
            </CardTitle>
            <CardDescription>Choose what your QR code will contain.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="url"><Link className="mr-2 h-4 w-4"/>URL</TabsTrigger>
                <TabsTrigger value="text"><Type className="mr-2 h-4 w-4"/>Text</TabsTrigger>
                <TabsTrigger value="tour"><Bot className="mr-2 h-4 w-4"/>AI Tour</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="mt-4">
                <Label htmlFor="url-input" className="font-headline">Website URL</Label>
                <Input id="url-input" type="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
              </TabsContent>
              <TabsContent value="text" className="mt-4">
                <Label htmlFor="text-input" className="font-headline">Your Text</Label>
                <Textarea id="text-input" placeholder="Enter any text" value={text} onChange={(e) => setText(e.target.value)} />
              </TabsContent>
              <TabsContent value="tour" className="mt-4">
                <Label htmlFor="tour-input" className="font-headline">Tour Details</Label>
                <Textarea id="tour-input" placeholder="Describe the tour location and points of interest..." value={tourDetails} onChange={(e) => setTourDetails(e.target.value)} className="min-h-[120px]" />
                <p className="text-sm text-muted-foreground mt-2">
                  This will generate a QR code linking to a page with an AI tour guide.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Palette className="text-primary" /> Customize Design
            </CardTitle>
            <CardDescription>Make your QR code stand out.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="fg-color" className="font-headline">Foreground</Label>
                <div className="relative">
                    <Input id="fg-color" type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="p-1 h-10 w-full" />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="bg-color" className="font-headline">Background</Label>
                <Input id="bg-color" type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="p-1 h-10 w-full"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo-upload" className="font-headline flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Logo</Label>
              <Input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoUpload} className="file:text-primary file:font-semibold" />
              {logo && <Button variant="outline" size="sm" onClick={() => setShowLogo(!showLogo)}>{showLogo ? 'Hide Logo' : 'Show Logo'}</Button>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <QrPreview {...qrOptions} />
      </div>
    </div>
  );
}
