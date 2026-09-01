/**
 * Lesson 002-002 — Function / Tool Calling
 *
 * Goal:
 * Give the model multiple tool definitions and inspect what the model
 * returns when it decides to request one of those tools.
 *
 * IMPORTANT:
 * In this lesson, we are NOT executing any tools yet.
 *
 * We are only learning:
 *
 *   User prompt
 *       ↓
 *   Model sees available tools
 *       ↓
 *   Model decides which tool it needs
 *       ↓
 *   response.output contains a function_call
 *
 * Available tools:
 *
 *   1. calculator
 *   2. format_final_answer
 *
 * The actual tool implementations come in later lessons.
 *
 */

/**
 * Test & Expected Output
 *
 * ------------------------------------------------------------
 * TEST 1 — Ask the model to use the calculator tool
 * ------------------------------------------------------------
 *
 * curl -X POST http://localhost:3000/api/llm \
 *   -H "Content-Type: application/json" \
 *   -d '{"prompt":"Use the calculator to multiply 27 by 43."}'
 *
 * Response:
 *
 * {
 *   "output": [
 *     {
 *       "id": "fc_09f2a50df14767f8006a9629998ae487d0b06458a87c86f458",
 *       "type": "function_call",
 *       "status": "completed",
 *       "arguments": "{\"operation\":\"multiply\",\"a\":27,\"b\":43}",
 *       "call_id": "call_bEE74tVhta8jYzRHtIvgQqcT",
 *       "name": "calculator"
 *     }
 *   ]
 * }
 *
 * What this means:
 *
 *   Model
 *     ↓
 *   decides it needs a tool
 *     ↓
 *   function_call
 *     ↓
 *   calculator
 *     ↓
 *   arguments:
 *     {
 *       operation: "multiply",
 *       a: 27,
 *       b: 43
 *     }
 *
 * IMPORTANT:
 * The model has NOT calculated 27 × 43 yet.
 *
 * It is only asking our application to execute:
 *
 *   calculator({
 *     operation: "multiply",
 *     a: 27,
 *     b: 43
 *   })
 *
 *
 * ------------------------------------------------------------
 * TEST 2 — Ask the model to use the format_final_answer tool
 * ------------------------------------------------------------
 *
 * curl -X POST http://localhost:3000/api/llm \
 *   -H "Content-Type: application/json" \
 *   -d '{"prompt":"Use the format_final_answer tool to format the number 16254."}'
 *
 * Response:
 *
 * {
 *   "output": [
 *     {
 *       "id": "fc_004ea0eb6efd647e006a9629ee570c87d08775c2aea3b28d9b",
 *       "type": "function_call",
 *       "status": "completed",
 *       "arguments": "{\"total\":16254}",
 *       "call_id": "call_vb3JSxFtw76m6OkSUuHbT78c",
 *       "name": "format_final_answer"
 *     }
 *   ]
 * }
 *
 * What this means:
 *
 *   Model
 *     ↓
 *   decides it needs a tool
 *     ↓
 *   function_call
 *     ↓
 *   format_final_answer
 *     ↓
 *   arguments:
 *     {
 *       total: 16254
 *     }
 *
 * Again, the model is only REQUESTING the tool.
 * Our application has not executed it yet.
 *
 *
 * ------------------------------------------------------------
 * KEY LESSON
 * ------------------------------------------------------------
 *
 * We gave the model TWO available tools:
 *
 *   1. calculator
 *   2. format_final_answer
 *
 * The model selected a different tool depending on the prompt:
 *
 *   Math request
 *       ↓
 *   calculator
 *
 *   Formatting request
 *       ↓
 *   format_final_answer
 *
 * This demonstrates an important agent concept:
 *
 *   The MODEL chooses which tool to request.
 *   Our APPLICATION is responsible for executing that tool.
 *
 * Tool execution comes in the next lesson.
 */

import OpenAI from "openai";

const openai = new OpenAI();

/**
 * Describe the tools available to the model.
 *
 * These are TOOL DEFINITIONS, not tool implementations.
 *
 * Think of each definition as a contract that tells the model:
 *
 * - the tool's name
 * - what the tool does
 * - what arguments the tool accepts
 *
 * The model can REQUEST one of these tools.
 *
 * Our application will be responsible for actually executing
 * the requested tool in later lessons.
 */
const tools: OpenAI.Responses.Tool[] = [
    /**
     * Tool #1 — Calculator
     *
     * Eventually this tool will perform arithmetic.
     *
     * For now, we are only describing it to the model.
     */
    {
        type: "function",

        name: "calculator",

        description:
            "Perform a mathematical operation using two numbers.",

        parameters: {
            type: "object",

            properties: {
                operation: {
                    type: "string",
                    enum: ["add", "subtract", "multiply", "divide"],
                    description: "The mathematical operation to perform.",
                },

                a: {
                    type: "number",
                    description: "The first number.",
                },

                b: {
                    type: "number",
                    description: "The second number.",
                },
            },

            required: ["operation", "a", "b"],
            additionalProperties: false,
        },

        strict: true,
    },

    /**
     * Tool #2 — Format Final Answer
     *
     * Eventually this tool will take a numeric result such as:
     *
     *   16254
     *
     * and produce:
     *
     *   "The final answer is 16254."
     *
     * Again, this is only the tool definition.
     * There is no implementation yet.
     */
    {
        type: "function",

        name: "format_final_answer",

        description:
            'Format a numeric result as "The final answer is <total>."',

        parameters: {
            type: "object",

            properties: {
                total: {
                    type: "number",
                    description: "The final numeric result.",
                },
            },

            required: ["total"],
            additionalProperties: false,
        },

        strict: true,
    },
];

export async function POST(request: Request) {
    /**
     * Read the prompt sent by the client.
     *
     * Example:
     *
     * {
     *   "prompt": "Use the calculator to multiply 27 by 43."
     * }
     */
    const { prompt } = await request.json();

    console.log("Prompt received:", prompt);

    /**
     * Send the prompt AND both tool definitions to the model.
     *
     * The model now knows:
     *
     *   User prompt
     *
     *       +
     *
     *   Available tools
     *       ├── calculator
     *       └── format_final_answer
     *
     *       ↓
     *
     *   MODEL
     *
     *       ↓
     *
     *   decides what to do
     *
     * The model might:
     *
     *   - return normal text
     *   - request calculator
     *   - request format_final_answer
     *
     * The important point is that the MODEL chooses which tool
     * it wants based on the user's request.
     *
     * We intentionally do NOT use stream: true in this lesson.
     *
     * Waiting for the complete response makes it easier to inspect
     * the structured function_call objects.
     */
    const response = await openai.responses.create({
        model: "gpt-5.6-luna",
        input: prompt,
        tools,
    });

    /**
     * Inspect the complete output from the model.
     *
     * A normal text response might contain:
     *
     * response.output
     *      ↓
     * message
     *      ↓
     * output_text
     *
     *
     * A tool request might contain:
     *
     * response.output
     *      ↓
     * function_call
     *      ↓
     * name: "calculator"
     *      ↓
     * arguments:
     *
     * {
     *   "operation": "multiply",
     *   "a": 27,
     *   "b": 43
     * }
     *
     *
     * Or the model could request:
     *
     * function_call
     *      ↓
     * name: "format_final_answer"
     *      ↓
     * arguments:
     *
     * {
     *   "total": 16254
     * }
     *
     *
     * IMPORTANT:
     *
     * function_call means:
     *
     *   "Model is ASKING our application to run this tool."
     *
     * It does NOT mean:
     *
     *   "The model already ran the tool."
     */
    console.dir(response.output, {
        depth: null,
    });

    /**
     * Return the raw output as JSON.
     *
     * This lets us inspect the function_call from:
     *
     *   1. the Next.js server console
     *   2. curl
     *
     * Later, instead of simply returning this function_call,
     * our application will:
     *
     *   receive function_call
     *          ↓
     *   execute the requested tool
     *          ↓
     *   get tool result
     *          ↓
     *   send result back to model
     */
    return Response.json({
        output: response.output,
    });
}
