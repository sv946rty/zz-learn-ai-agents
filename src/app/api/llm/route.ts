/**
 * Lesson 002-003 — Calculator Tool
 *
 * Goal:
 * Execute ONE tool requested by the model and inspect the result.
 *
 * ------------------------------------------------------------
 * WHERE WE CAME FROM
 * ------------------------------------------------------------
 *
 * In Lesson 002-002, we learned how the model REQUESTS a tool:
 *
 *   User prompt
 *       ↓
 *   Model sees available tool definitions
 *       ↓
 *   Model decides which tool it needs
 *       ↓
 *   function_call
 *       ↓
 *   STOP
 *
 * No tool was executed in Lesson 002-002.
 *
 *
 * ------------------------------------------------------------
 * WHAT WE ADD IN THIS LESSON
 * ------------------------------------------------------------
 *
 * We now have real TypeScript implementations for:
 *
 *   1. calculator
 *   2. format_final_answer
 *
 * The flow becomes:
 *
 *   User prompt
 *       ↓
 *   Model
 *       ↓
 *   ONE function_call
 *       ↓
 *   Our application identifies the requested tool
 *       ↓
 *   Parse the tool arguments with JSON.parse()
 *       ↓
 *   Execute ONE real TypeScript function
 *       ↓
 *   Tool result
 *       ↓
 *   STOP
 *
 *
 * ------------------------------------------------------------
 * IMPORTANT — LESSON BOUNDARY
 * ------------------------------------------------------------
 *
 * This lesson executes ONLY ONE tool call.
 *
 * We are NOT building the agent loop yet.
 * We are NOT sending the tool result back to the model.
 * We are NOT handling multiple or sequential tool calls yet.
 *
 * Example:
 *
 *   User:
 *
 *     "Use the calculator to multiply 27 by 43."
 *
 *       ↓
 *
 *   Model requests:
 *
 *     calculator({
 *       operation: "multiply",
 *       a: 27,
 *       b: 43
 *     })
 *
 *       ↓
 *
 *   Our application executes:
 *
 *     calculator("multiply", 27, 43)
 *
 *       ↓
 *
 *   Tool result:
 *
 *     1161
 *
 *       ↓
 *
 *   STOP
 *
 * Lesson 002-004 will introduce the Agent Loop:
 *
 *   Model
 *       ↓
 *   Tool
 *       ↓
 *   Result
 *       ↓
 *   Model again
 *
 * Later lessons will handle multiple / sequential tool calls.
 */


/**
 * Test & Expected Output
 *
 * ------------------------------------------------------------
 * TEST 1 — Execute the calculator tool
 * ------------------------------------------------------------
 *
 * curl -X POST http://localhost:3000/api/llm \
 *   -H "Content-Type: application/json" \
 *   -d '{"prompt":"Use the calculator to multiply 27 by 43."}'
 *
 * Expected flow:
 *
 *   Model
 *       ↓
 *   function_call: calculator
 *       ↓
 *   arguments:
 *   {
 *     operation: "multiply",
 *     a: 27,
 *     b: 43
 *   }
 *       ↓
 *   calculator("multiply", 27, 43)
 *       ↓
 *   toolResult: 1161
 *
 *
 * ------------------------------------------------------------
 * TEST 2 — Execute the format_final_answer tool
 * ------------------------------------------------------------
 *
 * curl -X POST http://localhost:3000/api/llm \
 *   -H "Content-Type: application/json" \
 *   -d '{"prompt":"Use the format_final_answer tool to format the number 16254."}'
 *
 * Expected flow:
 *
 *   Model
 *       ↓
 *   function_call: format_final_answer
 *       ↓
 *   arguments:
 *   {
 *     total: 16254
 *   }
 *       ↓
 *   formatFinalAnswer(16254)
 *       ↓
 *   toolResult: "The final answer is 16254."
 *
 *
 * ------------------------------------------------------------
 * KEY LESSON
 * ------------------------------------------------------------
 *
 * The MODEL chooses which tool to request.
 *
 * Our APPLICATION:
 *
 *   1. finds the function_call
 *   2. reads the requested tool name
 *   3. parses the arguments
 *   4. executes the corresponding TypeScript function
 *   5. gets the tool result
 *   6. stops
 *
 * For Lesson 002-003:
 *
 *   ONE function_call → ONE tool execution → STOP
 *
 * We do NOT yet do:
 *
 *   function_call
 *       ↓
 *   tool execution
 *       ↓
 *   tool result
 *       ↓
 *   send result back to model
 *       ↓
 *   model decides again
 *
 * That is the Agent Loop introduced in Lesson 002-004.
 */

import OpenAI from "openai";

import {
    calculator,
    type CalculatorOperation,
} from "@/lib/tools/calculator";

import { formatFinalAnswer } from "@/lib/tools/format-final-answer";

const openai = new OpenAI();

/**
 * TOOL DEFINITIONS
 *
 * These definitions describe our tools to the MODEL.
 *
 * They are different from the TypeScript implementations imported above.
 *
 * Model sees:
 *
 *   calculator definition
 *   format_final_answer definition
 *
 * Our application owns:
 *
 *   calculator()
 *   formatFinalAnswer()
 */
const tools: OpenAI.Responses.Tool[] = [
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
     * Read the user's prompt.
     */
    const { prompt } = await request.json();

    console.log("Prompt received:", prompt);

    /**
     * STEP 1
     *
     * Give the model:
     *
     *   - the user's prompt
     *   - the available tool definitions
     *
     * The model decides whether it wants to request a tool.
     */
    const response = await openai.responses.create({
        model: "gpt-5.6-luna",
        input: prompt,
        tools,
    });

    console.log("Model output:");

    console.dir(response.output, {
        depth: null,
    });

    /**
     * STEP 2
     *
     * Find the function_call returned by the model.
     *
     * response.output is an array because a Responses API response
     * can contain different kinds of output items.
     *
     * For this lesson, we only want the first function_call.
     */
    const toolCall = response.output.find(
        (item) => item.type === "function_call"
    );

    /**
     * The model is allowed to return normal text instead of requesting
     * a tool, so we must handle the case where no function_call exists.
     */
    if (!toolCall) {
        return Response.json({
            message: "The model did not request a tool.",
            output: response.output,
        });
    }

    /**
     * STEP 3
     *
     * toolCall.arguments is JSON stored inside a STRING.
     *
     * Example:
     *
     *   '{"operation":"multiply","a":27,"b":43}'
     *
     * JSON.parse() converts it into a JavaScript object:
     *
     *   {
     *     operation: "multiply",
     *     a: 27,
     *     b: 43
     *   }
     */
    const args = JSON.parse(toolCall.arguments);

    console.log("Tool requested:", toolCall.name);
    console.log("Tool arguments:", args);

    /**
     * STEP 4
     *
     * Execute the real TypeScript function that corresponds
     * to the tool requested by the model.
     *
     * Remember:
     *
     * MODEL:
     *
     *   "Please call calculator with these arguments."
     *
     * APPLICATION:
     *
     *   calculator(...)
     *
     * The model chooses the tool.
     * Our application executes the tool.
     */
    let toolResult: number | string;

    switch (toolCall.name) {
        case "calculator": {
            toolResult = calculator(
                args.operation as CalculatorOperation,
                args.a,
                args.b
            );

            break;
        }

        case "format_final_answer": {
            toolResult = formatFinalAnswer(args.total);

            break;
        }

        default: {
            /**
             * Never execute a tool simply because the model requested
             * an arbitrary function name.
             *
             * Our application controls exactly which tools are allowed.
             */
            throw new Error(
                `Unknown tool requested: ${toolCall.name}`
            );
        }
    }

    console.log("Tool result:", toolResult);

    /**
     * STEP 5
     *
     * Return the tool request and tool result so we can inspect them.
     *
     * For example:
     *
     *   Model requests:
     *
     *     calculator({
     *       operation: "multiply",
     *       a: 27,
     *       b: 43
     *     })
     *
     *             ↓
     *
     *   Our application executes:
     *
     *     calculator("multiply", 27, 43)
     *
     *             ↓
     *
     *   Result:
     *
     *     1161
     *
     *
     * IMPORTANT:
     *
     * We STOP here in Lesson 002-003.
     *
     * We are NOT sending 1161 back to the model yet.
     *
     * Lesson 002-004 will introduce the agent loop:
     *
     *   Model
     *       ↓
     *   function_call
     *       ↓
     *   Tool execution
     *       ↓
     *   Tool result
     *       ↓
     *   Model again
     */
    return Response.json({
        toolCall,
        toolResult,
    });
}