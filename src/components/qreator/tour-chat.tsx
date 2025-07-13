'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { answerQuestionAboutTour } from '@/ai/flows/answer-question-about-tour';
import { generateTourGuideMessage } from '@/ai/flows/generate-tour-guide-message';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Message = {
  id: number;
  sender: 'user' | 'bot';
  text: string;
};

export default function TourChat() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [tourDetails, setTourDetails] = useState('');

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const details = searchParams.get('details');
    if (details) {
      setTourDetails(details);
      generateTourGuideMessage({ tourContext: details })
        .then((response) => {
          setMessages([{ id: 1, sender: 'bot', text: response.tourGuideMessage }]);
        })
        .catch(() =>
          toast({
            title: 'Error',
            description: 'Could not generate a welcome message.',
            variant: 'destructive',
          })
        )
        .finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
        setMessages([{ id: 1, sender: 'bot', text: "Welcome! I don't have any tour details. How can I help you today?" }]);
    }
  }, [searchParams, toast]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);


  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now(), sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await answerQuestionAboutTour({ tourDetails, question: input });
      const botMessage: Message = { id: Date.now() + 1, sender: 'bot', text: response.answer };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Sorry, I had trouble getting an answer. Please try again.',
        variant: 'destructive',
      });
      setMessages((prev) => prev.filter(m => m.id !== userMessage.id)); // remove user message on failure
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Bot className="text-primary" /> AI Tour Guide
        </CardTitle>
        <CardDescription>Ask me anything about the tour!</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn('flex items-start gap-3', message.sender === 'user' && 'justify-end')}
              >
                {message.sender === 'bot' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20}/></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xs md:max-w-md rounded-lg px-4 py-2 text-sm',
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.text}
                </div>
                {message.sender === 'user' && (
                  <Avatar className="h-8 w-8">
                     <AvatarFallback><User size={20}/></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {isLoading && messages.length > 0 && (
                 <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20}/></AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-4 py-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                 </div>
             )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-4 border-t">
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            id="message"
            placeholder="Type your question..."
            className="flex-1"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
