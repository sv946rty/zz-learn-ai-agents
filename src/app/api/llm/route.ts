
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

    console.log("Output text:", response.output_text); // Output text: The capital of France is **Paris**.

    return Response.json({
        text: response.output_text,
    });
}