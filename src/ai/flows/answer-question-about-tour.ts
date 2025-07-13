// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview This file contains a Genkit flow that answers questions about a tour.
 *
 * - answerQuestionAboutTour - An exported function that initiates the flow.
 * - AnswerQuestionAboutTourInput - The input type for the answerQuestionAboutTour function.
 * - AnswerQuestionAboutTourOutput - The output type for the answerQuestionAboutTour function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionAboutTourInputSchema = z.object({
  tourDetails: z.string().describe('Details about the tour.'),
  question: z.string().describe('The question about the tour.'),
});
export type AnswerQuestionAboutTourInput = z.infer<
  typeof AnswerQuestionAboutTourInputSchema
>;

const AnswerQuestionAboutTourOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the tour.'),
});
export type AnswerQuestionAboutTourOutput = z.infer<
  typeof AnswerQuestionAboutTourOutputSchema
>;

export async function answerQuestionAboutTour(
  input: AnswerQuestionAboutTourInput
): Promise<AnswerQuestionAboutTourOutput> {
  return answerQuestionAboutTourFlow(input);
}

const answerQuestionAboutTourPrompt = ai.definePrompt({
  name: 'answerQuestionAboutTourPrompt',
  input: {schema: AnswerQuestionAboutTourInputSchema},
  output: {schema: AnswerQuestionAboutTourOutputSchema},
  prompt: `You are a helpful tour guide bot. Answer the following question about the tour based on the provided details.  Keep your answer concise and informative.

Tour Details: {{{tourDetails}}}

Question: {{{question}}}`,
});

const answerQuestionAboutTourFlow = ai.defineFlow(
  {
    name: 'answerQuestionAboutTourFlow',
    inputSchema: AnswerQuestionAboutTourInputSchema,
    outputSchema: AnswerQuestionAboutTourOutputSchema,
  },
  async input => {
    const {output} = await answerQuestionAboutTourPrompt(input);
    return output!;
  }
);
