'use server';
/**
 * @fileOverview Generates a customized tour guide message based on the provided context.
 *
 * - generateTourGuideMessage - A function that generates the tour guide message.
 * - GenerateTourGuideMessageInput - The input type for the generateTourGuideMessage function.
 * - GenerateTourGuideMessageOutput - The return type for the generateTourGuideMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTourGuideMessageInputSchema = z.object({
  tourContext: z.string().describe('The context of the tour, including key information about the location, history, and points of interest.'),
});
export type GenerateTourGuideMessageInput = z.infer<typeof GenerateTourGuideMessageInputSchema>;

const GenerateTourGuideMessageOutputSchema = z.object({
  tourGuideMessage: z.string().describe('A customized tour guide message based on the provided context.'),
});
export type GenerateTourGuideMessageOutput = z.infer<typeof GenerateTourGuideMessageOutputSchema>;

export async function generateTourGuideMessage(input: GenerateTourGuideMessageInput): Promise<GenerateTourGuideMessageOutput> {
  return generateTourGuideMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTourGuideMessagePrompt',
  input: {schema: GenerateTourGuideMessageInputSchema},
  output: {schema: GenerateTourGuideMessageOutputSchema},
  prompt: `You are an AI-powered tour guide. Generate a concise and engaging tour guide message based on the following context:\n\nContext: {{{tourContext}}}\n\nTour Guide Message:`,
});

const generateTourGuideMessageFlow = ai.defineFlow(
  {
    name: 'generateTourGuideMessageFlow',
    inputSchema: GenerateTourGuideMessageInputSchema,
    outputSchema: GenerateTourGuideMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
