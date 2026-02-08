// src/ai/flows/smart-taxation-toggle.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for intelligently suggesting whether a client or product qualifies for tax breaks.
 *
 * - smartTaxationToggle - A function that suggests whether a client or product qualifies for tax breaks.
 * - SmartTaxationToggleInput - The input type for the smartTaxationToggle function.
 * - SmartTaxationToggleOutput - The return type for the smartTaxationToggle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartTaxationToggleInputSchema = z.object({
  clientType: z.string().describe('The type of client (e.g., non-profit, corporation, individual).'),
  productType: z.string().describe('The type of product or service being invoiced (e.g., digital service, physical product, educational material).'),
  additionalDetails: z.string().optional().describe('Any additional details about the client or product that may be relevant to tax considerations.'),
});
export type SmartTaxationToggleInput = z.infer<typeof SmartTaxationToggleInputSchema>;

const SmartTaxationToggleOutputSchema = z.object({
  taxBreakSuggestion: z.boolean().describe('A suggestion on whether a tax break should be applied (true) or not (false).'),
  reasoning: z.string().describe('The reasoning behind the tax break suggestion, explaining why the client or product may or may not qualify.'),
});
export type SmartTaxationToggleOutput = z.infer<typeof SmartTaxationToggleOutputSchema>;

export async function smartTaxationToggle(input: SmartTaxationToggleInput): Promise<SmartTaxationToggleOutput> {
  return smartTaxationToggleFlow(input);
}

const smartTaxationPrompt = ai.definePrompt({
  name: 'smartTaxationPrompt',
  input: {schema: SmartTaxationToggleInputSchema},
  output: {schema: SmartTaxationToggleOutputSchema},
  prompt: `Based on the client type: {{{clientType}}}, product type: {{{productType}}}, and additional details: {{{additionalDetails}}}, determine if a tax break should be suggested.

  Provide a boolean value for taxBreakSuggestion (true if a tax break is suggested, false otherwise) and a clear explanation for the reasoning behind your suggestion.
  Ensure the reasoning explains the potential tax implications or benefits based on the provided information.
  Consider various factors such as industry-specific tax incentives, non-profit status, and product classifications.
  Output in JSON format.`,
});

const smartTaxationToggleFlow = ai.defineFlow(
  {
    name: 'smartTaxationToggleFlow',
    inputSchema: SmartTaxationToggleInputSchema,
    outputSchema: SmartTaxationToggleOutputSchema,
  },
  async input => {
    const {output} = await smartTaxationPrompt(input);
    return output!;
  }
);
