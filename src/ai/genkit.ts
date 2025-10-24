import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI(), // API key is loaded from GEMINI_API_KEY env var automatically
  ],
  model: 'googleai/gemini-2.5-flash',
});
