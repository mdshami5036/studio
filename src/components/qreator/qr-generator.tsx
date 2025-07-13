
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { QrCode, Link, Type, Bot, Palette, Image as ImageIcon, Sparkles, Loader2, CreditCard, FileText } from 'lucide-react';
import QrPreview from './qr-preview';
import { generateTourGuideMessage } from '@/ai/flows/generate-tour-guide-message';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';

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
  const [imageUrl, setImageUrl] = useState('https://placehold.co/600x400.png');
  const [pdfUrl, setPdfUrl] = useState('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
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
      case 'image':
        return imageUrl;
      case 'pdf':
        return pdfUrl;
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
  }, [tab, url, text, tourDetails, origin, upiId, upiAmount, imageUrl, pdfUrl]);

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
  
  const TabTrigger = ({ value, icon, label }: { value: string; icon: React.ReactNode; label: string }) => (
    <TabsTrigger value={value} className="flex-col h-auto gap-1.5 p-3 w-full">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </TabsTrigger>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <Card className="lg:col-span-2">
         <Tabs value={tab} onValueChange={setTab} defaultValue="url" className="flex flex-col md:flex-row">
            <div className="p-4 border-b md:border-b-0 md:border-r">
                <h3 className="text-lg font-headline font-semibold mb-1 px-1">Content</h3>
                <p className="text-sm text-muted-foreground mb-4 px-1">Choose your QR type.</p>
                <TabsList className="flex flex-row md:flex-col h-auto bg-transparent p-0 w-full">
                   <div className="grid grid-cols-3 md:grid-cols-2 gap-2 w-full">
                     <TabTrigger value="url" icon={<Link className="w-5 h-5"/>} label="URL" />
                     <TabTrigger value="text" icon={<Type className="w-5 h-5"/>} label="Text" />
                     <TabTrigger value="image" icon={<ImageIcon className="w-5 h-5"/>} label="Image" />
                     <TabTrigger value="pdf" icon={<FileText className="w-5 h-5"/>} label="PDF" />
                     <TabTrigger value="tour" icon={<Bot className="w-5 h-5"/>} label="AI Tour" />
                     <TabTrigger value="upi" icon={<CreditCard className="w-5 h-5"/>} label="UPI" />
                   </div>
                </TabsList>
            </div>

            <div className="p-6 flex-1">
                 <TabsContent value="url" className="mt-0 space-y-4">
                    <h3 className="text-xl font-headline font-semibold">Website URL</h3>
                    <div className="space-y-2">
                        <Label htmlFor="url-input">Link to any online content</Label>
                        <Input id="url-input" type="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
                    </div>
                </TabsContent>
                <TabsContent value="text" className="mt-0 space-y-4">
                    <h3 className="text-xl font-headline font-semibold">Plain Text</h3>
                     <div className="space-y-2">
                        <Label htmlFor="text-input">Enter any text to encode</Label>
                        <Textarea id="text-input" placeholder="Hello, world!" value={text} onChange={(e) => setText(e.target.value)} />
                    </div>
                </TabsContent>
                <TabsContent value="image" className="mt-0 space-y-4">
                    <h3 className="text-xl font-headline font-semibold">Image QR Code</h3>
                     <div className="space-y-2">
                        <Label htmlFor="image-url-input">Image URL</Label>
                        <Input id="image-url-input" type="url" placeholder="https://example.com/image.png" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                    </div>
                </TabsContent>
                <TabsContent value="pdf" className="mt-0 space-y-4">
                    <h3 className="text-xl font-headline font-semibold">PDF QR Code</h3>
                     <div className="space-y-2">
                        <Label htmlFor="pdf-url-input">PDF file URL</Label>
                        <Input id="pdf-url-input" type="url" placeholder="https://example.com/document.pdf" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} />
                    </div>
                </TabsContent>
                <TabsContent value="upi" className="mt-0 space-y-6">
                    <h3 className="text-xl font-headline font-semibold">UPI Payment</h3>
                    <div className="space-y-2">
                        <Label htmlFor="upi-id">UPI ID</Label>
                        <Input id="upi-id" type="text" placeholder="yourname@bank" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="upi-amount">Amount (Optional)</Label>
                        <Input id="upi-amount" type="number" placeholder="100.00" value={upiAmount} onChange={(e) => setUpiAmount(e.target.value)} />
                    </div>
                </TabsContent>
                <TabsContent value="tour" className="mt-0 space-y-6">
                    <h3 className="text-xl font-headline font-semibold">AI-Powered Tour Guide</h3>
                    <div className="space-y-2">
                        <Label htmlFor="ai-prompt">Topic</Label>
                        <div className="flex items-center gap-2">
                            <Input id="ai-prompt" placeholder="e.g., A tour of the Eiffel Tower" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} disabled={isGenerating}/>
                            <Button onClick={handleGenerateTourDetails} disabled={isGenerating} size="icon" variant="outline">
                                {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                <span className="sr-only">Generate</span>
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tour-input">Generated Tour Details</Label>
                        <Textarea id="tour-input" placeholder="AI-generated content will appear here..." value={tourDetails} onChange={(e) => setTourDetails(e.target.value)} className="min-h-[150px]" />
                        <p className="text-xs text-muted-foreground">
                            This content will be shown on the tour page when the QR code is scanned.
                        </p>
                    </div>
                </TabsContent>

                <Separator className="my-8" />
                
                <div className="space-y-6">
                    <h3 className="text-xl font-headline font-semibold">Customize Design</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fg-color">Foreground</Label>
                        <Input id="fg-color" type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="p-1 h-10 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bg-color">Background</Label>
                        <Input id="bg-color" type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="p-1 h-10 w-full"/>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logo-upload" className="flex items-center gap-2">Logo</Label>
                       <div className="flex items-center gap-2">
                           <Input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoUpload} className="flex-1 file:text-primary file:font-semibold" />
                           {logo && <Button variant="outline" size="sm" onClick={() => setShowLogo(!showLogo)}>{showLogo ? 'Hide' : 'Show'}</Button>}
                       </div>
                    </div>
                </div>

            </div>
         </Tabs>
      </Card>

      <div className="lg:col-span-1">
        <QrPreview {...qrOptions} />
      </div>
    </div>
  );
}
