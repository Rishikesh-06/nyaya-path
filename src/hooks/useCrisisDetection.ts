import { useCallback } from 'react';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

import { pipeline, env } from '@xenova/transformers';

// Important for Vite/React: prevents it from trying to fetch models from localhost,
// which returns index.html and crashes with JSON parse error.
env.allowLocalModels = false;
// Critical: Flush corrupted HTML files from IndexedDB cache
env.useBrowserCache = false;

export interface CrisisResult {
    isCrisis: boolean;
    score: number;
    reason: string;
}

// Singleton for the local ML model
let classifier: any = null;

const translateToEnglish = async (text: string, language: string): Promise<string> => {
    if (language === 'English') return text;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are a translator. Translate the given text to English. Return ONLY the translated text, nothing else. No explanations, no preamble.',
                },
                {
                    role: 'user',
                    content: text,
                },
            ],
            temperature: 0.1,
            max_tokens: 256,
        }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || text;
};

const analyzeCrisis = async (englishText: string): Promise<CrisisResult> => {
    try {
        if (!classifier) {
            console.log('Loading local ML model (Xenova/distilbert)...');
            // Download and load the ML model into browser memory (only happens once)
            classifier = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
        }

        console.log('Running local ML inference...');
        const results = await classifier(englishText);
        const result = results[0]; // e.g., { label: 'NEGATIVE', score: 0.99 }
        
        console.log('ML Output:', result);

        // DistilBERT output is binary: POSITIVE or NEGATIVE.
        // We consider it a crisis if it's extremely negative (>0.97 confidence)
        const isCrisis = result.label === 'NEGATIVE' && result.score > 0.97;

        return {
            isCrisis,
            score: result.label === 'NEGATIVE' ? result.score : 0,
            reason: isCrisis ? 'Severe negative sentiment detected via local DistilBERT model' : 'Normal or mild sentiment',
        };
    } catch (err) {
        console.error('Local ML error:', err);
        return { isCrisis: false, score: 0, reason: '' };
    }
};

export const useCrisisDetection = () => {
    const detectCrisis = useCallback(async (
        message: string,
        language: string
    ): Promise<CrisisResult> => {
        try {
            const englishText = await translateToEnglish(message, language);
            const result = await analyzeCrisis(englishText);
            return result;
        } catch (err) {
            console.error('Crisis detection error:', err);
            return { isCrisis: false, score: 0, reason: '' };
        }
    }, []);

    return { detectCrisis };
};