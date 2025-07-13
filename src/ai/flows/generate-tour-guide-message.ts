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
  tourContext: z.string().describe('The context or topic of the tour, such as "Eiffel Tower" or "History of Rome".'),
});
export type GenerateTourGuideMessageInput = z.infer<typeof GenerateTourGuideMessageInputSchema>;

const GenerateTourGuideMessageOutputSchema = z.object({
  tourGuideMessage: z.string().describe('A detailed and engaging tour guide message based on the provided context. This should be suitable for a QR code tour, providing key information, history, and points of interest.'),
});
export type GenerateTourGuideMessageOutput = z.infer<typeof GenerateTourGuideMessageOutputSchema>;

export async function generateTourGuideMessage(input: GenerateTourGuideMessageInput): Promise<GenerateTourGuideMessageOutput> {
  return generateTourGuideMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTourGuideMessagePrompt',
  input: {schema: GenerateTourGuideMessageInputSchema},
  output: {schema: GenerateTourGuideMessageOutputSchema},
  prompt: `You are an expert tour guide content creator. Your task is to generate a detailed and engaging tour guide script based on the provided topic. The script should be informative, well-structured, and interesting for someone scanning a QR code to learn about the location or subject.

Topic: {{{tourContext}}}

Generate the tour guide message now.`,
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
