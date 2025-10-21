import { config } from 'dotenv';
config();

import '@/ai/flows/generate-product-descriptions.ts';
import '@/ai/flows/auto-schedule-posts.ts';
import '@/ai/flows/filter-haram-products.ts';
import '@/ai/flows/summarize-market-trends.ts';