'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VisualTaskAnalysisInputSchema = z.object({
  imageUrl: z.string().describe('The URL or base64 encoded string of the image to analyze.'),
  context: z.string().optional().describe('Additional context for the task generation (e.g., project goals, specific focus).'),
});

const VisualTaskAnalysisOutputSchema = z.object({
  tasks: z.array(z.object({
    title: z.string(),
    description: z.string(),
    type: z.enum(['INVOICE', 'CLIENT_MEETING', 'DRAFT_PROPOSAL', 'FOLLOW_UP', 'OTHER']),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  })),
  summary: z.string().describe('A summary of what was identified in the image and why these tasks were suggested.'),
});

const visualTaskPrompt = ai.definePrompt({
  name: 'visualTaskPrompt',
  input: { schema: VisualTaskAnalysisInputSchema },
  output: { schema: VisualTaskAnalysisOutputSchema },
  prompt: [
    { text: 'You are an intelligent project assistant for Kairos Visuals. Analyze the following visual content and suggest a list of actionable tasks.' },
    { media: { url: '{{{imageUrl}}}', contentType: 'image/jpeg' } },
    { text: 'Context: {{{context}}}' },
    { text: 'Break down the visual cues into specific tasks. For example, if you see a messy whiteboard, suggest "Clean Whiteboard" or "Digitize Notes". If you see a business card, suggest "Add Client to CRM".' }
  ],
});

export const visualTaskAnalysisFlow = ai.defineFlow(
  {
    name: 'visualTaskAnalysisFlow',
    inputSchema: VisualTaskAnalysisInputSchema,
    outputSchema: VisualTaskAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await visualTaskPrompt(input);
    if (!output) throw new Error('AI failed to generate a response.');
    return output;
  }
);
