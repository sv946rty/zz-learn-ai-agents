/**
 * Lesson 002-004 — Agent Loop (Basic)
 *
 * Goal:
 * Build the basic agent loop using ONLY the calculator tool:
 *
 *   Model → Calculator → Result → Model
 *
 * The new concept in this lesson is:
 *
 *   The tool result is sent BACK to the model.
 *
 * This allows the model to decide what to do next.
 *
 *
 * ------------------------------------------------------------
 * WHERE WE CAME FROM
 * ------------------------------------------------------------
 *
 * In Lesson 002-003, the model could request a tool and our
 * application could execute it.
 *
 * The flow was:
 *
 *   User prompt
 *       ↓
 *   Model
 *       ↓
 *   ONE function_call
 *       ↓
 *   Our application executes ONE tool
 *       ↓
 *   Tool result
 *       ↓
 *   STOP
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
 * The important limitation was:
 *
 *   The tool result NEVER went back to the model.
 *
 *
 * ------------------------------------------------------------
 * WHAT WE ADD IN THIS LESSON
 * ------------------------------------------------------------
 *
 * We now send the calculator result BACK to the model.
 *
 * This creates the basic Agent Loop:
 *
 *   User prompt
 *       ↓
 *   Model
 *       ↓
 *   ONE function_call: calculator
 *       ↓
 *   Our application executes calculator()
 *       ↓
 *   Tool result
 *       ↓
 *   function_call_output
 *       ↓
 *   Send result back to model
 *       ↓
 *   Model decides again
 *       │
 *       ├── requests calculator again → LOOP
 *       │
 *       └── returns final answer → STOP
 *
 *
 * ------------------------------------------------------------
 * TOOL SCOPE — CALCULATOR ONLY
 * ------------------------------------------------------------
 *
 * Lesson 002-003 had two tool implementations:
 *
 *   1. calculator
 *   2. format_final_answer
 *
 * In Lesson 002-004, we intentionally expose and execute
 * ONLY the calculator tool.
 *
 * We are NOT using:
 *
 *   format_final_answer
 *
 * in this lesson.
 *
 * Why?
 *
 * We want Lesson 002-004 to focus on ONE new concept:
 *
 *   Tool result → Model again
 *
 * Keeping only calculator makes the basic Agent Loop easier
 * to see and understand.
 *
 *
 * ------------------------------------------------------------
 * THE CONTROL LOOP
 * ------------------------------------------------------------
 *
 * Our application now controls repeated model turns using:
 *
 *   while (true) {
 *
 *       ask the model what to do
 *
 *       if the model requests ONE calculator call {
 *           execute calculator()
 *           create function_call_output
 *           send the result back to the model
 *           continue
 *       }
 *
 *       model is finished
 *       break
 *   }
 *
 * The MODEL decides what should happen next.
 *
 * Our APPLICATION:
 *
 *   - controls the loop
 *   - executes calculator()
 *   - returns the calculator result to the model
 *
 *
 * ------------------------------------------------------------
 * FUNCTION CALL → FUNCTION CALL OUTPUT
 * ------------------------------------------------------------
 *
 * Suppose the model returns:
 *
 *   {
 *     type: "function_call",
 *     call_id: "call_ABC123",
 *     name: "calculator",
 *     arguments: "{\"operation\":\"multiply\",\"a\":27,\"b\":43}"
 *   }
 *
 * Our application parses the arguments:
 *
 *   JSON.parse(toolCall.arguments)
 *
 *       ↓
 *
 *   {
 *     operation: "multiply",
 *     a: 27,
 *     b: 43
 *   }
 *
 * Then our application executes:
 *
 *   calculator("multiply", 27, 43)
 *
 * and gets:
 *
 *   1161
 *
 * We then create a function_call_output:
 *
 *   {
 *     type: "function_call_output",
 *     call_id: "call_ABC123",
 *     output: "1161"
 *   }
 *
 *
 * ------------------------------------------------------------
 * WHY call_id MATTERS
 * ------------------------------------------------------------
 *
 * The model originally gives us:
 *
 *   function_call
 *       │
 *       └── call_id: "call_ABC123"
 *
 * When we return the result, we use the SAME call_id:
 *
 *   function_call_output
 *       │
 *       └── call_id: "call_ABC123"
 *
 * This connects:
 *
 *   MODEL REQUEST                    APPLICATION RESULT
 *
 *   function_call                   function_call_output
 *        │                                  │
 *        │                                  │
 *   call_ABC123  ─────────────────→    call_ABC123
 *        │                                  │
 *   calculator(...)                    output: "1161"
 *
 * The call_id tells the model:
 *
 *   "1161 is the result of this specific calculator request."
 *
 *
 * ------------------------------------------------------------
 * MODEL GETS ANOTHER TURN
 * ------------------------------------------------------------
 *
 * After receiving:
 *
 *   function_call_output
 *       ↓
 *   output: "1161"
 *
 * the model gets another turn.
 *
 * The model can now decide:
 *
 *                   Model
 *                     │
 *             ┌───────┴───────┐
 *             │               │
 *             ▼               ▼
 *      calculator again    final answer
 *             │               │
 *             ▼               ▼
 *           LOOP             STOP
 *
 * If the model requests calculator again, our while loop
 * performs another iteration.
 *
 *
 * ------------------------------------------------------------
 * IMPORTANT — ONE TOOL CALL PER LOOP ITERATION
 * ------------------------------------------------------------
 *
 * This lesson teaches the BASIC Agent Loop.
 *
 * Each loop iteration handles ONLY ONE function_call.
 *
 * For one iteration:
 *
 *   Model
 *       ↓
 *   ONE calculator function_call
 *       ↓
 *   ONE calculator execution
 *       ↓
 *   ONE function_call_output
 *       ↓
 *   Model again
 *
 * If the model requests calculator again, that happens during
 * ANOTHER iteration of the while loop.
 *
 * Example:
 *
 *   Iteration 1
 *
 *     Model
 *       ↓
 *     calculator()
 *       ↓
 *     result
 *       ↓
 *     Model again
 *
 *   Iteration 2
 *
 *     Model
 *       ↓
 *     calculator()
 *       ↓
 *     result
 *       ↓
 *     Model again
 *
 *   Iteration 3
 *
 *     Model
 *       ↓
 *     final answer
 *       ↓
 *     STOP
 *
 *
 * ------------------------------------------------------------
 * IMPORTANT — WHAT WE ARE NOT DOING YET
 * ------------------------------------------------------------
 *
 * We ARE now:
 *
 *   ✓ using calculator
 *   ✓ executing calculator()
 *   ✓ creating function_call_output
 *   ✓ sending the calculator result back to the model
 *   ✓ allowing the model to decide again
 *   ✓ repeating model turns with while (true)
 *
 * We are NOT yet:
 *
 *   ✗ using format_final_answer
 *   ✗ collecting multiple function_calls from one model response
 *   ✗ executing multiple tool calls during one loop iteration
 *   ✗ using .filter() to collect all function_calls
 *   ✗ using for...of to execute a batch of tool calls
 *
 * In particular, we are NOT doing this yet:
 *
 *   ONE model response
 *       ↓
 *   function_call #1
 *   function_call #2
 *   function_call #3
 *       ↓
 *   execute all tool calls
 *
 * That belongs to:
 *
 *   Lesson 002-005 — Multiple Tool Calls
 *
 *
 * ------------------------------------------------------------
 * KEY LESSON
 * ------------------------------------------------------------
 *
 * Lesson 002-002:
 *
 *   Model → function_call → STOP
 *
 * Lesson 002-003:
 *
 *   Model → function_call → Tool → Result → STOP
 *
 * Lesson 002-004:
 *
 *   Model
 *       ↓
 *   function_call
 *       ↓
 *   Calculator
 *       ↓
 *   Result
 *       ↓
 *   function_call_output
 *       ↓
 *   Model again
 *       │
 *       └────────────────────↺
 *
 * The basic formula is:
 *
 *   Agent = Model + Tool + Control Loop
 */


/**
 * Test & Expected Behavior
 *
 * ------------------------------------------------------------
 * TEST — Basic Agent Loop with Calculator
 * ------------------------------------------------------------
 *
 * curl -X POST http://localhost:3000/api/llm \
 *   -H "Content-Type: application/json" \
 *   -d '{"prompt":"Use the calculator to multiply 27 by 43. Then tell me the result."}'
 *
 *
 * ------------------------------------------------------------
 * EXPECTED FLOW
 * ------------------------------------------------------------
 *
 * STEP 1 — User sends the prompt
 *
 *   "Use the calculator to multiply 27 by 43.
 *    Then tell me the result."
 *
 *       ↓
 *
 * STEP 2 — Model requests calculator
 *
 *   function_call
 *
 *   {
 *     name: "calculator",
 *     call_id: "...",
 *     arguments:
 *       "{\"operation\":\"multiply\",\"a\":27,\"b\":43}"
 *   }
 *
 *       ↓
 *
 * STEP 3 — Application parses the arguments
 *
 *   {
 *     operation: "multiply",
 *     a: 27,
 *     b: 43
 *   }
 *
 *       ↓
 *
 * STEP 4 — Application executes calculator
 *
 *   calculator("multiply", 27, 43)
 *
 *       ↓
 *
 *   1161
 *
 *       ↓
 *
 * STEP 5 — Application creates function_call_output
 *
 *   {
 *     type: "function_call_output",
 *     call_id: "...",
 *     output: "1161"
 *   }
 *
 *       ↓
 *
 * STEP 6 — Tool result goes BACK to the model
 *
 *   Model receives:
 *
 *     calculator result = 1161
 *
 *       ↓
 *
 * STEP 7 — Model gets another turn
 *
 *   The model now knows the result of the calculator call.
 *
 *       ↓
 *
 * STEP 8 — Model returns the final answer
 *
 *   Example:
 *
 *     "The result is 1161."
 *
 *       ↓
 *
 *   No function_call
 *
 *       ↓
 *
 *   STOP
 *
 *
 * ------------------------------------------------------------
 * WHAT THIS TEST PROVES
 * ------------------------------------------------------------
 *
 * The important result is NOT simply:
 *
 *   calculator() returned 1161
 *
 * We already proved that in Lesson 002-003.
 *
 * Lesson 002-004 proves that:
 *
 *   1. the model requests calculator
 *   2. our application executes calculator()
 *   3. our application gets the tool result
 *   4. our application creates function_call_output
 *   5. the result is sent back to the model
 *   6. the model gets another turn
 *   7. the loop continues if another calculator call is requested
 *   8. the loop stops when the model returns a final answer
 *
 *
 * ------------------------------------------------------------
 * LESSON BOUNDARY
 * ------------------------------------------------------------
 *
 * For Lesson 002-004:
 *
 *   ONE function_call per iteration
 *       ↓
 *   ONE calculator execution
 *       ↓
 *   ONE function_call_output
 *       ↓
 *   MODEL AGAIN
 *
 * We are deliberately NOT using format_final_answer and
 * NOT handling multiple function_calls from one model response.
 *
 *
 * ------------------------------------------------------------
 * NEXT LESSON
 * ------------------------------------------------------------
 *
 * Lesson 002-005 — Multiple Tool Calls
 *
 * There we will expand beyond the basic single-tool-call
 * agent loop and learn how to handle multiple tool calls.
 */

import OpenAI from "openai";

import {
    calculator,
    type CalculatorOperation,
} from "@/lib/tools/calculator";

const openai = new OpenAI();

/**
 * TOOL DEFINITION
 *
 * Lesson 002-004 intentionally exposes ONLY ONE tool:
 *
 *   calculator
 *
 * format_final_answer still exists in our project, but we are
 * deliberately NOT exposing it to the model in this lesson.
 *
 * This lets us focus entirely on the new concept:
 *
 *   Tool result → Model again
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
];

export async function POST(request: Request) {
    /**
     * Read the user's original prompt.
     */
    const { prompt } = await request.json();

    console.log("Prompt received:", prompt);

    /**
     * agentInput contains what we want to send in the CURRENT
     * model request.
     *
     * On the first iteration:
     *
     *   agentInput
     *       ↓
     *   user's original prompt
     *
     * After calculator executes:
     *
     *   agentInput
     *       ↓
     *   function_call_output
     *
     * We do NOT manually copy response.output into agentInput.
     *
     * Instead, previousResponseId tells OpenAI which previous
     * model response this new input continues from.
     */
    let agentInput: OpenAI.Responses.ResponseInput = [
        {
            role: "user",
            content: prompt,
        },
    ];

    /**
     * On the first iteration there is no previous model response,
     * so this starts as undefined.
     *
     * After the model responds, we save:
     *
     *   response.id
     *
     * and use it on the next iteration as:
     *
     *   previous_response_id
     *
     * This allows the next model request to continue from the
     * previous model response without manually copying
     * response.output into agentInput.
     */
    let previousResponseId: string | undefined;

    /**
     * BASIC AGENT LOOP
     *
     * Keep asking the model what to do until it stops requesting
     * the calculator tool.
     *
     * IMPORTANT:
     *
     * Each iteration handles ONLY ONE function_call.
     *
     * Multiple function_calls from a single model response will
     * be handled in Lesson 002-005.
     */
    while (true) {
        /**
         * STEP 1 — Ask the model what to do next.
         *
         * FIRST ITERATION:
         *
         *   input: user prompt
         *
         *   previous_response_id:
         *       undefined
         *
         *
         * LATER ITERATION:
         *
         *   input:
         *       function_call_output
         *
         *   previous_response_id:
         *       ID of the previous model response
         *
         *
         * Conceptually:
         *
         *   previous model response
         *           │
         *           │ response.id
         *           ▼
         *   previous_response_id
         *
         *           +
         *
         *   function_call_output
         *
         *           ↓
         *
         *       MODEL AGAIN
         */
        const response = await openai.responses.create({
            model: "gpt-5.6-luna",
            input: agentInput,
            tools,
            previous_response_id: previousResponseId,
        });

        console.log("Model output:");

        console.dir(response.output, {
            depth: null,
        });

        /**
         * STEP 2 — Find ONE function_call.
         *
         * We intentionally use .find(), not .filter().
         *
         * .find()
         *     ↓
         * ONE function_call
         *
         * .filter()
         *     ↓
         * potentially MULTIPLE function_calls
         *
         * Multiple tool-call handling belongs to Lesson 002-005.
         */
        const toolCall = response.output.find(
            (item) => item.type === "function_call"
        );

        /**
         * STEP 3 — If there is NO function_call, the model has
         * finished its work.
         *
         * Example:
         *
         *   response.output
         *       ↓
         *   message
         *       ↓
         *   output_text
         *       ↓
         *   "The result is 1161."
         *
         * There is no calculator request.
         *
         * Therefore:
         *
         *   STOP THE AGENT LOOP.
         *
         * Returning from POST() also exits while (true).
         */
        if (!toolCall) {
            console.log("No tool requested.");
            console.log("Agent finished.");
            console.log("Final answer:", response.output_text);

            return Response.json({
                output: response.output,
                answer: response.output_text,
            });
        }

        /**
         * STEP 4 — Protect the tool boundary.
         *
         * Lesson 002-004 exposes only calculator.
         *
         * Therefore calculator is the only function our
         * application is willing to execute.
         */
        if (toolCall.name !== "calculator") {
            throw new Error(
                `Unknown tool requested: ${toolCall.name}`
            );
        }

        /**
         * STEP 5 — Parse the calculator arguments.
         *
         * toolCall.arguments is a JSON STRING:
         *
         *   '{"operation":"multiply","a":27,"b":43}'
         *
         *                 ↓
         *
         *             JSON.parse()
         *
         *                 ↓
         *
         *   {
         *     operation: "multiply",
         *     a: 27,
         *     b: 43
         *   }
         *
         * The TypeScript assertion describes the shape we expect.
         *
         * IMPORTANT:
         *
         * "as" is a compile-time TypeScript assertion.
         * It is NOT runtime validation.
         */
        const args = JSON.parse(toolCall.arguments) as {
            operation: CalculatorOperation;
            a: number;
            b: number;
        };

        console.log("Calculator arguments:", args);

        /**
         * STEP 6 — Execute the real calculator function.
         *
         * The MODEL requested the action.
         *
         * Our APPLICATION executes the action.
         */
        const toolResult = calculator(
            args.operation,
            args.a,
            args.b
        );

        console.log("Calculator result:", toolResult);

        /**
         * STEP 7 — Create function_call_output.
         *
         * The SAME call_id must be used so the model can connect:
         *
         *   function_call
         *
         *       call_id: call_ABC123
         *
         *              ↓
         *
         *   function_call_output
         *
         *       call_id: call_ABC123
         *       output: "1161"
         *
         *
         * call_id answers:
         *
         *   "Which specific tool call does this result belong to?"
         */
        const toolOutput: OpenAI.Responses.ResponseInputItem.FunctionCallOutput =
        {
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: String(toolResult),
        };

        console.log("Function call output:");

        console.dir(toolOutput, {
            depth: null,
        });

        /**
         * STEP 8 — Remember the model response we are continuing from.
         *
         * Every Responses API response has its own response.id.
         *
         * Example:
         *
         *   response.id
         *       ↓
         *   "resp_ABC123"
         *
         * On the NEXT iteration we send:
         *
         *   previous_response_id: "resp_ABC123"
         *
         * This tells OpenAI:
         *
         *   "Continue from that previous model response."
         *
         *
         * IMPORTANT:
         *
         * response.id and toolCall.call_id have DIFFERENT jobs.
         *
         * response.id
         *     ↓
         * previous_response_id
         *     ↓
         * connects MODEL TURNS
         *
         *
         * toolCall.call_id
         *     ↓
         * function_call_output.call_id
         *     ↓
         * connects a TOOL REQUEST to its TOOL RESULT
         */
        previousResponseId = response.id;

        /**
         * STEP 9 — Make the calculator result the input for the
         * NEXT model request.
         *
         * We do NOT do this anymore:
         *
         *   agentInput = [
         *       ...agentInput,
         *       ...response.output,
         *       toolOutput,
         *   ];
         *
         * Why?
         *
         * We are using previous_response_id to continue from the
         * previous model response.
         *
         * Therefore the only NEW information we need to send is:
         *
         *   function_call_output
         *
         * Conceptually:
         *
         *   previous_response_id
         *           │
         *           │
         *           ▼
         *   previous model response
         *
         *           +
         *
         *   function_call_output
         *       output: "1161"
         *
         *           ↓
         *
         *       MODEL AGAIN
         */
        agentInput = [
            toolOutput,
        ];

        /**
         * STEP 10 — Reach the end of this while-loop iteration.
         *
         * There is:
         *
         *   no return
         *   no break
         *
         * here.
         *
         * Therefore while (true) automatically begins another
         * iteration.
         *
         *
         * ITERATION 1
         *
         *   User prompt
         *       ↓
         *   Model
         *       ↓
         *   calculator function_call
         *       ↓
         *   calculator()
         *       ↓
         *   1161
         *       ↓
         *   function_call_output
         *
         *
         * ITERATION 2
         *
         *   previous_response_id
         *       +
         *   function_call_output: "1161"
         *       ↓
         *   Model again
         *       │
         *       ├── calculator call → another loop iteration
         *       │
         *       └── final answer → return → STOP
         *
         *
         * IMPORTANT:
         *
         * We still handle only ONE function_call during each
         * iteration.
         *
         * Multiple tool calls from ONE model response belong
         * to Lesson 002-005.
         */
    }
}