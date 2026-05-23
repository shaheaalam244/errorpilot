import { GoogleGenAI } from "@google/genai";
import { DevEnvironment } from "../utils/detector";
import { httpsFetch } from "../utils/httpsFetch";

export class AIService {
    private ai: GoogleGenAI;

    constructor(apiKey: string) {
        // Safe global fetch patching locally within extension process context.
        // Bypasses Electron/VS Code undici fetch resolution issues entirely.
        if (globalThis.fetch !== httpsFetch) {
            (globalThis as any).fetch = httpsFetch;
        }

        this.ai = new GoogleGenAI({ apiKey: apiKey });
    }

    /**
     * Executes the error analysis using AI.
     * Incorporates automatic progressive delay retries and fallback models to handle 429 and 404 errors.
     */
    async analyze(text: string, env: DevEnvironment, preferredModel: string): Promise<string> {
        const systemInstruction = `You are a world-class senior software engineer and diagnostic expert.
Analyze this code snippet or error message and provide a concise, high-fidelity explanation and action plan.

Detected Environment Context:
- Language: ${env.language}
- Framework/Runtime: ${env.framework}

Structure your response into exactly three sections:
1. ## Root Cause
Explain the fundamental reason why this error occurs, highlighting the syntax, logical, or runtime error in the selection.

2. ## Suggested Fix
Provide a step-by-step description of how to resolve the error.

3. ## Interactive Code Solution
Provide the corrected code snippet. Always wrap the code snippet in standard markdown code blocks (e.g. \`\`\`typescript ... \`\`\` or \`\`\`python ... \`\`\`). Do not include any other code blocks outside this section.`;

        // Define a strict fallback chain of supported model names
        const fallbackChain = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
        const triedModels = new Set<string>();
        
        // Start with the user's preferred model or the latest default
        let currentModel = preferredModel || 'gemini-3.5-flash';
        let attempt = 0;
        const maxRetries = 2;
        let delayMs = 1500; // progressive backoff delay for 429 rate limits

        while (true) {
            try {
                triedModels.add(currentModel);
                const response = await this.ai.models.generateContent({
                    model: currentModel,
                    contents: `Here is the error/code:\n${text}`,
                    config: {
                        systemInstruction: systemInstruction
                    }
                });
                
                const responseText = response.text;
                if (!responseText || responseText.trim().length === 0) {
                    throw new Error("Empty response received from AI API");
                }
                
                return responseText;
            } catch (err: any) {
                const errMsg = err?.message || String(err);
                
                const is429 = errMsg.includes('429') || 
                              errMsg.toLowerCase().includes('quota') || 
                              errMsg.toLowerCase().includes('limit');
                              
                const is404 = errMsg.includes('404') || 
                              errMsg.toLowerCase().includes('not found') || 
                              errMsg.toLowerCase().includes('not_found') || 
                              errMsg.toLowerCase().includes('not supported') ||
                              errMsg.toLowerCase().includes('unsupported');

                // Case 1: 404 Not Found / Unsupported Model - Trigger immediate model fallback without retrying
                if (is404) {
                    const nextModel = fallbackChain.find(m => !triedModels.has(m));

                    if (nextModel) {
                        console.warn(`ErrorPilot: Model not found or unsupported. Falling back immediately to next model.`);
                        currentModel = nextModel;
                        attempt = 0;
                        delayMs = 1000;
                        continue;
                    }
                }

                // Case 2: 429 Quota Exceeded - Attempt progressive backoff retry first
                if (is429 && attempt < maxRetries) {
                    attempt++;
                    console.warn(`ErrorPilot (Attempt ${attempt}): Model rate limited. Retrying in ${delayMs}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    delayMs *= 2; // exponential backoff
                    continue;
                }

                // Case 3: 429 rate limit exceeded and retries exhausted - Fallback to the next untried model
                if (is429) {
                    const nextModel = fallbackChain.find(m => !triedModels.has(m));

                    if (nextModel) {
                        console.warn(`ErrorPilot: Model rate limit exhausted. Falling back to next model.`);
                        currentModel = nextModel;
                        attempt = 0;
                        delayMs = 1000;
                        continue;
                    }
                }

                // Case 4: Other errors or all fallbacks exhausted
                throw new Error(`AI Request failed [Model: ${currentModel.replace('gemini-', '')}]: ${errMsg.replace(/gemini/gi, 'AI')}`);
            }
        }
    }
}

// AI Service: Core Google GenAI instance initialized

// Fallback chain supports: gemini-3.5-flash -> gemini-2.5-flash -> gemini-2.0-flash -> gemini-1.5-flash

// Progressive backoff handles rate limiting automatically

// AI Service: Core Google GenAI instance initialized

// Fallback chain supports: gemini-3.5-flash -> gemini-2.5-flash -> gemini-2.0-flash -> gemini-1.5-flash

// Progressive backoff handles rate limiting automatically

// AI Service: Core Google GenAI instance initialized

// Fallback chain supports: gemini-3.5-flash -> gemini-2.5-flash -> gemini-2.0-flash -> gemini-1.5-flash

// Progressive backoff handles rate limiting automatically

// AI Service: Core Google GenAI instance initialized

// Fallback chain supports: gemini-3.5-flash -> gemini-2.5-flash -> gemini-2.0-flash -> gemini-1.5-flash

// Progressive backoff handles rate limiting automatically
