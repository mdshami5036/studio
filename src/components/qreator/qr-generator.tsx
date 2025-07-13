'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { QrCode, Link, Type, Bot, Palette, Image as ImageIcon, Sparkles, Loader2, CreditCard } from 'lucide-react';
import QrPreview from './qr-preview';
import { generateTourGuideMessage } from '@/ai/flows/generate-tour-guide-message';
import { useToast } from '@/hooks/use-toast';

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
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const initialTab = searchParams.get('tab') || 'url';
  const [tab, setTab] = useState(initialTab);
  const [url, setUrl] = useState('https://firebase.google.com/');
  const [text, setText] = useState('Hello, world!');
  const [tourDetails, setTourDetails] = useState(
    'This is a tour of the Eiffel Tower in Paris, France. It was designed and built by Gustave Eiffel for the 1889 World\'s Fair.'
  );
  const [upiId, setUpiId] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const [fgColor, setFgColor] = useState('#008080');
  const [bgColor, setBgColor] = useState('#E0F8F8');
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [showLogo, setShowLogo] = useState(false);

  const [aiPrompt, setAiPrompt] = useState('A tour of the Eiffel Tower');
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleGenerateTourDetails = async () => {
    if (!aiPrompt.trim()) {
        toast({
            title: 'Prompt is empty',
            description: 'Please enter a topic for the AI to write about.',
            variant: 'destructive',
        });
        return;
    }
    setIsGenerating(true);
    try {
        const result = await generateTourGuideMessage({ tourContext: aiPrompt });
        setTourDetails(result.tourGuideMessage);
    } catch (error) {
        console.error('Failed to generate tour details:', error);
        toast({
            title: 'Generation Failed',
            description: 'Could not generate tour details. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsGenerating(false);
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
      case 'upi': {
        if (!upiId) return 'upi://pay';
        const upiUrl = new URL('upi://pay');
        upiUrl.searchParams.set('pa', upiId);
        upiUrl.searchParams.set('pn', 'Payee'); // Payee name is often required
        if (upiAmount) {
            upiUrl.searchParams.set('am', upiAmount);
        }
        upiUrl.searchParams.set('cu', 'INR');
        return upiUrl.toString();
      }
      default:
        return '';
    }
  }, [tab, url, text, tourDetails, origin, upiId, upiAmount]);

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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="url"><Link className="mr-2 h-4 w-4"/>URL</TabsTrigger>
                <TabsTrigger value="text"><Type className="mr-2 h-4 w-4"/>Text</TabsTrigger>
                <TabsTrigger value="tour"><Bot className="mr-2 h-4 w-4"/>AI Tour</TabsTrigger>
                <TabsTrigger value="upi"><CreditCard className="mr-2 h-4 w-4"/>UPI</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="mt-4">
                <Label htmlFor="url-input" className="font-headline">Website URL</Label>
                <Input id="url-input" type="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
              </TabsContent>
              <TabsContent value="text" className="mt-4">
                <Label htmlFor="text-input" className="font-headline">Your Text</Label>
                <Textarea id="text-input" placeholder="Enter any text" value={text} onChange={(e) => setText(e.target.value)} />
              </TabsContent>
               <TabsContent value="upi" className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="upi-id" className="font-headline">UPI ID</Label>
                  <Input id="upi-id" type="text" placeholder="yourname@bank" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="upi-amount" className="font-headline">Amount (Optional)</Label>
                  <Input id="upi-amount" type="number" placeholder="100.00" value={upiAmount} onChange={(e) => setUpiAmount(e.target.value)} />
                </div>
              </TabsContent>
              <TabsContent value="tour" className="mt-4 space-y-4">
                <div>
                    <Label htmlFor="ai-prompt" className="font-headline">AI Prompt</Label>
                    <div className="flex items-center gap-2 mt-1">
                        <Input id="ai-prompt" placeholder="e.g., A tour of the Eiffel Tower" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} disabled={isGenerating}/>
                        <Button onClick={handleGenerateTourDetails} disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                            <span className="ml-2 hidden sm:inline">Generate</span>
                        </Button>
                    </div>
                </div>

                <div>
                    <Label htmlFor="tour-input" className="font-headline">Tour Details</Label>
                    <Textarea id="tour-input" placeholder="Describe the tour location and points of interest..." value={tourDetails} onChange={(e) => setTourDetails(e.target.value)} className="min-h-[120px] mt-1" />
                    <p className="text-sm text-muted-foreground mt-2">
                    This will generate a QR code linking to a page with an AI tour guide.
                    </p>
                </div>
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
