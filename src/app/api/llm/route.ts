
/**
 * lesson 001-002 - Test with curl:
 *
 * curl -X POST http://localhost:3000/api/llm \
 *   -H "Content-Type: application/json" \
 *   -d '{"prompt":"What is the capital of France?"}'
 */

import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(request: Request) {
    const { prompt } = await request.json();
    console.log("Prompt received:", prompt); // Prompt received: What is the capital of France?

    const response = await openai.responses.create({
        model: "gpt-5.6-luna",
        input: prompt,
    });

    /*
        [
        {
            id: 'msg_02fc6525806bcd8f006a95b103d0b087d0a8a2b9f87aa09a01',
            type: 'message',
            status: 'completed',
            content: [
            {
                type: 'output_text',
                annotations: [],
                logprobs: [],
                text: 'The capital of France is **Paris**.'
            }
            ],
            phase: 'final_answer',
            role: 'assistant'
        }
        ]
    */
    console.dir(response.output, { depth: null });

    /*
        Response ID: resp_04426033a9ed8aeb006a95b2ca9d8887d0b90190e4ed4b8ed9
        Status: completed
        Model: gpt-5.6-luna
    */
    console.log("Response ID:", response.id);
    console.log("Status:", response.status);
    console.log("Model:", response.model);

    /*
    NOTE 1: 
        Note that tokens are not the same as words. 
        Your input prompt has only 7 ordinary words (eg: What is the capital of France?),
        but OpenAI reports 13 input tokens. Tokenization also accounts for punctuation and other encoded pieces.

    NOTE 2: 
        input_tokens   → tokens supplied to the model
        output_tokens  → tokens generated in the response
        total_tokens   → total usage for this response
    
    Ex:

        {
        input_tokens: 13,
        input_tokens_details: { cache_write_tokens: 0, cached_tokens: 0 },
        output_tokens: 11,
        output_tokens_details: { reasoning_tokens: 0 },
        total_tokens: 24
        }

    */

    console.dir(response.usage, { depth: null });

    console.log("Output text:", response.output_text); // Output text: The capital of France is **Paris**.

    return Response.json({
        text: response.output_text,
    });
}