/**
 * Lesson 002-007 — Agent UI
 *
 * Goal:
 *
 * Bring together everything built in Section 002 and expose the completed
 * server-side agent through an interactive browser UI.
 *
 * SECTION 002 RECAP
 *
 * 002-001 — What is an Agent?
 *   Agent = Model + Tools + Control Loop
 *
 * 002-002 — Function / Tool Calling
 *   The model can REQUEST a tool.
 *   The model does NOT execute our application functions itself.
 *
 * 002-003 — Calculator Tool
 *   Model → function_call → application executes calculator(...)
 *   → function_call_output
 *
 * 002-004 — Agent Loop
 *   Model → Tool → Result → Model → ... → Final Answer
 *
 * 002-005 — Multiple Tool Calls
 *   One model response may contain ZERO, ONE, or MULTIPLE function_calls.
 *   We collect them with .filter(...) and execute every request with
 *   for (const toolCall of toolCalls).
 *
 * 002-006 — Safety Guard
 *   MAX_ITERATIONS bounds MODEL TURNS, not tool calls.
 *
 * 002-007 — Agent UI
 *   Browser → POST /api/llm → server-side Agent Loop → Model ↔ Tools
 *   → final model response → Response.json(...) → Browser Agent UI
 *
 * ============================================================
 * COMPLETED 002-007 ARCHITECTURE
 * ============================================================
 *
 * The browser is intentionally thin. It collects the prompt, POSTs it to
 * /api/llm, shows a loading state while the agent runs, reads the completed
 * JSON response, and displays the final answer or API error.
 *
 * The browser does NOT call OpenAI directly, execute calculator(...),
 * execute formatFinalAnswer(...), control the Agent Loop, or control
 * MAX_ITERATIONS. Those responsibilities remain on the server.
 *
 * ============================================================
 * TWO MODEL-FACING TOOLS
 * ============================================================
 *
 * 1. calculator
 *    Performs add, subtract, multiply, and divide.
 *
 * 2. format_final_answer
 *    Accepts a final numeric result such as { total: 16254 }.
 *    Its application implementation returns:
 *
 *      "The final answer is 16254."
 *
 * This demonstrates both multiple calls to the same tool and multiple
 * TYPES of tools.
 *
 * ============================================================
 * TOOL DEFINITION vs IMPLEMENTATION vs DISPATCH
 * ============================================================
 *
 * Model-facing definitions such as:
 *
 *   name: "calculator"
 *   name: "format_final_answer"
 *
 * tell the MODEL which tools exist and what arguments they accept.
 *
 * Application implementations:
 *
 *   calculator(...)
 *   formatFinalAnswer(...)
 *
 * contain the TypeScript code that actually performs the work.
 *
 * Dispatch logic:
 *
 *   switch (toolCall.name) {
 *     case "calculator":
 *       execute calculator(...)
 *       break;
 *     case "format_final_answer":
 *       execute formatFinalAnswer(...)
 *       break;
 *     default:
 *       reject unknown tool
 *   }
 *
 * maps the model-facing tool name to the correct application function.
 *
 * Registering a tool with the model does NOT execute it.
 * The model REQUESTS the tool; our application EXECUTES the tool.
 *
 * ============================================================
 * AGENT LOOP
 * ============================================================
 *
 *   for (iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
 *     ask the model what to do next
 *     collect ALL function_calls from this model response
 *
 *     if there are no function_calls {
 *       return the final answer
 *     }
 *
 *     execute ALL requested tools
 *     create one function_call_output per tool request
 *     send ALL tool results into the next model turn
 *   }
 *
 * If every allowed model turn is exhausted without normal completion:
 *
 *   SAFETY STOP → HTTP 508
 *
 * ============================================================
 * OUTER LOOP vs INNER LOOP
 * ============================================================
 *
 * OUTER LOOP:
 *   for (iteration ...)
 *   → MODEL TURNS / openai.responses.create(...) calls
 *
 * INNER LOOP:
 *   for (const toolCall of toolCalls)
 *   → TOOL CALLS requested by the CURRENT model response
 *
 * Therefore MAX_ITERATIONS = 5 means at most five MODEL TURNS,
 * not at most five TOOL CALLS.
 *
 * ============================================================
 * TWO DIFFERENT LINKS
 * ============================================================
 *
 * call_id:
 *   tool request ↔ tool result
 *
 * response.id / previous_response_id:
 *   model turn ↔ next model turn
 *
 * These IDs solve different problems and should not be confused.
 *
 * ============================================================
 * OBSERVED END-TO-END TEST
 * ============================================================
 *
 * Test prompt:
 *
 *   "Use the calculator to multiply 27 by 43.
 *    Then multiply that result by 14.
 *    Finally, use format_final_answer to format the final numeric
 *    result before giving me the final answer."
 *
 * Observed run:
 *
 *   MODEL TURN #1
 *     → calculator(27, 43)
 *     → 1161
 *
 *   MODEL TURN #2
 *     → calculator(1161, 14)
 *     → 16254
 *
 *   MODEL TURN #3
 *     → format_final_answer(16254)
 *     → "The final answer is 16254."
 *
 *   MODEL TURN #4
 *     → final model message "16254"
 *     → ZERO tool calls
 *     → NORMAL STOP
 *     → HTTP 200
 *
 * Actual counts for that observed run:
 *
 *   4 agent iterations / model calls
 *   3 tool calls
 *   2 calculator executions
 *   1 formatFinalAnswer execution
 *
 * These counts describe the observed test run, not a universal guarantee.
 * Tool-calling behavior may vary for other prompts or model runs.
 *
 * ============================================================
 * FORMATTER OUTPUT vs FINAL MODEL OUTPUT
 * ============================================================
 *
 * formatFinalAnswer(16254) returned:
 *
 *   "The final answer is 16254."
 *
 * That string went back to the MODEL as function_call_output. It was not
 * sent directly to the browser. The model then took another turn and chose
 * the final response "16254".
 *
 * Therefore a tool result is not necessarily the final model response.
 *
 * ============================================================
 * SAFETY GUARD
 * ============================================================
 *
 * The server enforces MAX_ITERATIONS = 5.
 *
 * If the final allowed model turn still requests tools, the current
 * implementation executes those tools but does NOT allow another model
 * turn to consume their outputs. The loop ends and the API returns:
 *
 *   HTTP 508
 *
 *   {
 *     error: "Agent reached the maximum number of iterations.",
 *     maxIterations: 5
 *   }
 *
 * This intentionally preserves the 002-006 safety behavior.
 *
 * ============================================================
 * DEFINITION OF DONE — 002-007
 * ============================================================
 *
 *   ✓ calculator is registered and executable
 *   ✓ format_final_answer is registered and executable
 *   ✓ switch-based dispatch supports both tool types
 *   ✓ multiple function_calls from one model response are supported
 *   ✓ dependent tool calls can span multiple model turns
 *   ✓ every tool result preserves its call_id
 *   ✓ previous_response_id connects model turns
 *   ✓ MAX_ITERATIONS protects the server-side Agent Loop
 *   ✓ the browser can submit an agent task
 *   ✓ the browser shows a loading state while the agent runs
 *   ✓ the browser displays the final agent answer
 *   ✓ API errors / safety stops can be surfaced by the Agent UI
 *   ✓ the complete Section 002 agent works end-to-end
 */

import OpenAI from "openai";

import {
    calculator,
    type CalculatorOperation,
} from "@/lib/tools/calculator";

import { formatFinalAnswer } from "@/lib/tools/format-final-answer";

const openai = new OpenAI();

/**
 * Maximum number of MODEL TURNS allowed for one agent request.
 *
 * IMPORTANT:
 *
 * This limits calls to:
 *
 *   openai.responses.create(...)
 *
 * It does NOT limit the number of tool calls inside one model
 * response.
 *
 * For example, one model turn may request:
 *
 *   calculator(...)
 *   calculator(...)
 *   calculator(...)
 *
 * All three tool calls may execute while consuming only ONE
 * agent iteration.
 */
const MAX_ITERATIONS = 5;

/**
 * ==========================================================
 * TOOL DEFINITIONS — 002-007
 * ==========================================================
 *
 * Our agent now exposes TWO tools to the model:
 *
 *   1. calculator
 *
 *      Performs arithmetic:
 *
 *        add
 *        subtract
 *        multiply
 *        divide
 *
 *
 *   2. format_final_answer
 *
 *      Formats the final numeric result after the required
 *      calculations are complete.
 *
 *
 * IMPORTANT:
 *
 * These objects describe the tools to the MODEL.
 *
 * They do NOT execute the tools.
 *
 *
 * MODEL-FACING TOOL DEFINITION
 *
 *   {
 *       name: "calculator",
 *       ...
 *   }
 *
 *           ↓
 *
 * tells the model:
 *
 *   "This tool exists and these are its arguments."
 *
 *
 * APPLICATION IMPLEMENTATION
 *
 *   calculator(...)
 *
 *           ↓
 *
 * is the actual TypeScript function our application executes.
 *
 *
 * The same distinction applies to:
 *
 *   format_final_answer
 *
 *           ↓
 *
 *   formatFinalAnswer(...)
 *
 *
 * Later in the Agent Loop, toolCall.name is used to dispatch
 * each model-requested tool to the correct implementation.
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
            "Format the final numeric result after all required calculations are complete.",

        parameters: {
            type: "object",

            properties: {
                total: {
                    type: "number",
                    description: "The final numeric result to format.",
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
     * Read the user's original prompt.
     */
    const { prompt } = await request.json();

    console.log("Prompt received:", prompt);

    /**
     * agentInput contains ONLY the NEW input for the CURRENT
     * model request.
     *
     * FIRST MODEL TURN:
     *
     *   agentInput
     *       ↓
     *   user's original prompt
     *
     *
     * LATER MODEL TURNS:
     *
     *   agentInput
     *       ↓
     *   function_call_outputs produced from the previous model
     *   response
     *
     *
     * We use previous_response_id to continue from the previous
     * model response, so we do NOT manually copy response.output
     * into agentInput.
     */
    let agentInput: OpenAI.Responses.ResponseInput = [
        {
            role: "user",
            content: prompt,
        },
    ];

    /**
     * There is no previous model response on the first turn.
     *
     * After a model requests tools:
     *
     *   response.id
     *       ↓
     *   previousResponseId
     *       ↓
     *   previous_response_id on the next model request
     *
     *
     * This connects MODEL TURNS.
     *
     * Remember:
     *
     *   response.id
     *       ↓
     *   connects MODEL TURNS
     *
     *
     *   toolCall.call_id
     *       ↓
     *   connects a TOOL REQUEST to its TOOL RESULT
     */
    let previousResponseId: string | undefined;

    /**
     * ==========================================================
     * SAFETY-GUARDED AGENT LOOP
     * ==========================================================
     *
     * 002-005 used conceptually:
     *
     *   while (true)
     *
     *
     * 002-006 changes the OUTER loop to:
     *
     *   for (
     *       let iteration = 1;
     *       iteration <= MAX_ITERATIONS;
     *       iteration++
     *   )
     *
     *
     * ONE outer iteration:
     *
     *       ↓
     *
     * ONE openai.responses.create(...)
     *
     *       ↓
     *
     * ONE MODEL TURN
     *
     *
     * Inside that model turn, the inner for...of may still
     * execute ZERO, ONE, or MULTIPLE tool calls.
     */
    for (
        let iteration = 1;
        iteration <= MAX_ITERATIONS;
        iteration++
    ) {
        console.log(
            `Agent iteration ${iteration}/${MAX_ITERATIONS}`
        );

        /**
         * STEP 1 — Ask the model what to do next.
         *
         * Every execution of openai.responses.create(...) is ONE
         * MODEL CALL / MODEL TURN.
         *
         * FIRST ITERATION:
         *
         *   input:
         *       user's original prompt
         *
         *   previous_response_id:
         *       undefined
         *
         *
         * LATER ITERATIONS:
         *
         *   input:
         *       toolOutputs[]
         *
         *   previous_response_id:
         *       ID of previous model response
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
         * STEP 2 — Collect ALL tool requests from THIS model turn.
         *
         * .filter() gives us an array containing:
         *
         *   ZERO function_calls
         *
         *   OR
         *
         *   ONE function_call
         *
         *   OR
         *
         *   MULTIPLE function_calls
         *
         *
         * This multiple-tool-call behavior comes from 002-005
         * and remains unchanged in 002-006.
         */
        const toolCalls = response.output.filter(
            (item) => item.type === "function_call"
        );

        console.log(
            "Number of tool calls requested:",
            toolCalls.length
        );

        /**
         * STEP 3 — NORMAL TERMINATION.
         *
         * If the current model response contains ZERO tool calls,
         * the model has finished.
         *
         *   toolCalls.length === 0
         *
         *       ↓
         *
         *   final answer
         *
         *       ↓
         *
         *   return Response.json(...)
         *
         *       ↓
         *
         *   POST() immediately ends
         *
         *
         * IMPORTANT:
         *
         * This can happen on ANY allowed iteration:
         *
         *   1/5
         *   2/5
         *   3/5
         *   4/5
         *   or 5/5
         *
         *
         * MAX_ITERATIONS is a maximum, not a target.
         */
        if (toolCalls.length === 0) {
            console.log("No tools requested.");
            console.log("Agent finished.");
            console.log("Final answer:", response.output_text);

            return Response.json({
                output: response.output,
                answer: response.output_text,
            });
        }

        /** STEP 4 — Prepare to collect ALL tool results from THIS
         * model response.
         *
         * Example:
         *
         *   toolCalls.length === 3
         *
         *
         * After execution:
         *
         *   toolOutputs = [
         *       result for call #1,
         *       result for call #2,
         *       result for call #3
         *   ];
         *
         *
         * IMPORTANT:
         *
         * All tool calls in this array came from the SAME model
         * response and therefore belong to the SAME model iteration.
         *
         * In 002-007, those calls may now represent different tool
         * types, such as:
         *
         *   calculator(...)
         *
         * or:
         *
         *   format_final_answer(...)
         */
        const toolOutputs: OpenAI.Responses.ResponseInputItem.FunctionCallOutput[] =
            [];

        /**
         * STEP 5 — Execute EVERY tool request from the CURRENT
         * model response.
         *
         *
         * OUTER LOOP:
         *
         *   bounded for loop
         *
         *       ↓
         *
         *   controls MODEL TURNS
         *
         *
         * INNER LOOP:
         *
         *   for (const toolCall of toolCalls)
         *
         *       ↓
         *
         *   handles TOOL CALLS from ONE model response
         *
         *
         * MAX_ITERATIONS applies to the OUTER loop.
         *
         * It does NOT stop this inner loop after some number of
         * tool calls.
         */
        for (const toolCall of toolCalls) {
            /**
             * STEP 5A — Dispatch THIS tool request.
             *
             * The model can now request TWO different tool types:
             *
             *   calculator
             *
             *       OR
             *
             *   format_final_answer
             *
             *
             * The MODEL chooses which tool it wants to use.
             *
             * Our APPLICATION decides how that model-facing tool name
             * maps to an actual TypeScript function.
             *
             *
             * Conceptually:
             *
             *               toolCall.name
             *                     ↓
             *             ┌───────┴────────┐
             *             │                │
             *             ↓                ↓
             *       "calculator"   "format_final_answer"
             *             │                │
             *             ↓                ↓
             *       calculator(...)  formatFinalAnswer(...)
             *
             *
             * This is TOOL DISPATCH.
             */
            let toolResult: number | string;

            switch (toolCall.name) {
                /**
                 * ==================================================
                 * CALCULATOR
                 * ==================================================
                 *
                 * Example model request:
                 *
                 *   {
                 *       name: "calculator",
                 *       arguments:
                 *           '{"operation":"multiply","a":27,"b":43}'
                 *   }
                 *
                 *
                 * toolCall.arguments is a JSON STRING.
                 *
                 * We parse it before calling our TypeScript function.
                 */
                case "calculator": {
                    const args = JSON.parse(toolCall.arguments) as {
                        operation: CalculatorOperation;
                        a: number;
                        b: number;
                    };

                    console.log("Calculator arguments:", args);

                    /**
                     * The MODEL requested calculator.
                     *
                     * Our APPLICATION executes calculator.
                     */
                    toolResult = calculator(
                        args.operation,
                        args.a,
                        args.b
                    );

                    console.log("Calculator result:", toolResult);

                    break;
                }

                /**
                 * ==================================================
                 * FORMAT FINAL ANSWER
                 * ==================================================
                 *
                 * Example model request:
                 *
                 *   {
                 *       name: "format_final_answer",
                 *       arguments:
                 *           '{"total":16254}'
                 *   }
                 *
                 *
                 * Again:
                 *
                 *   model-facing tool name
                 *
                 *       format_final_answer
                 *
                 *              ↓
                 *
                 *   TypeScript implementation
                 *
                 *       formatFinalAnswer(...)
                 */
                case "format_final_answer": {
                    const args = JSON.parse(toolCall.arguments) as {
                        total: number;
                    };

                    console.log(
                        "Format final answer arguments:",
                        args
                    );

                    /**
                     * The MODEL requested format_final_answer.
                     *
                     * Our APPLICATION executes formatFinalAnswer.
                     */
                    toolResult = formatFinalAnswer(args.total);

                    console.log(
                        "Formatted final answer:",
                        toolResult
                    );

                    break;
                }

                /**
                 * ==================================================
                 * UNKNOWN TOOL
                 * ==================================================
                 *
                 * Never silently execute an unknown tool.
                 *
                 * The model may only use tools that our application
                 * explicitly knows how to execute.
                 */
                default: {
                    throw new Error(
                        `Unknown tool requested: ${toolCall.name}`
                    );
                }
            }

            /**
             * STEP 5B — Create ONE function_call_output for THIS
             * tool request.
             *
             * Notice that this part does NOT care which tool ran.
             *
             * calculator might produce:
             *
             *   16254
             *
             *
             * format_final_answer might produce:
             *
             *   "The final answer is 16254."
             *
             *
             * Both become a function_call_output that is returned
             * to the model.
             *
             *
             * Most importantly, preserve the SAME call_id:
             *
             *   function_call
             *
             *       call_id: call_A
             *
             *           ↓
             *
             *   execute requested tool
             *
             *           ↓
             *
             *   function_call_output
             *
             *       call_id: call_A
             *
             *
             * call_id connects THIS tool result to THIS tool request.
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
             * STEP 5C — Add THIS tool result to the current batch.
             *
             * One model response may contain multiple function_calls.
             *
             * They may even be DIFFERENT tool types.
             *
             * For example:
             *
             *   toolCalls
             *       ↓
             *   [
             *       calculator(...),
             *       calculator(...),
             *       format_final_answer(...)
             *   ]
             *
             *
             * Each request produces its own:
             *
             *   function_call_output
             *
             *
             * and every output is collected in:
             *
             *   toolOutputs[]
             */
            toolOutputs.push(toolOutput);
        }

        /**
         * STEP 6 — Remember which MODEL RESPONSE the next model
         * request will continue from.
         *
         *   response.id
         *       ↓
         *   previousResponseId
         *       ↓
         *   previous_response_id
         *
         *
         * This connects MODEL TURNS.
         */
        previousResponseId = response.id;

        /**
         * STEP 7 — Send ALL tool results back on the NEXT model
         * turn.
         *
         *              CURRENT MODEL TURN
         *                       ↓
         *          ┌────────────┼────────────┐
         *          ↓            ↓            ↓
         *       call #1      call #2      call #3
         *          ↓            ↓            ↓
         *       result #1    result #2    result #3
         *          │            │            │
         *          └────────────┼────────────┘
         *                       ↓
         *                  toolOutputs
         *                       +
         *             previous_response_id
         *                       ↓
         *                NEXT MODEL TURN
         *
         *
         * Unless, of course, the current iteration was the LAST
         * iteration allowed by MAX_ITERATIONS.
         */
        agentInput = toolOutputs;

        /**
         * STEP 8 — End of the CURRENT model iteration.
         *
         * If more iteration budget remains:
         *
         *   next outer-loop iteration
         *       ↓
         *   another model turn
         *
         *
         * If this was the LAST allowed iteration:
         *
         *   for loop ends
         *       ↓
         *   execution continues AFTER the loop
         *       ↓
         *   SAFETY STOP
         *
         *
         * Example with MAX_ITERATIONS = 5:
         *
         *   iteration 1 → may continue
         *   iteration 2 → may continue
         *   iteration 3 → may continue
         *   iteration 4 → may continue
         *   iteration 5 → final allowed model turn
         *
         *
         * If iteration 5 still requested tools, those tools are
         * executed, but MODEL TURN #6 is not allowed.
         */
    }

    /**
     * ==========================================================
     * SAFETY TERMINATION
     * ==========================================================
     *
     * Reaching this code means:
     *
     *   ✓ every allowed model iteration was used
     *
     *   AND
     *
     *   ✗ no model response reached the normal completion
     *     condition:
     *
     *       toolCalls.length === 0
     *
     *
     * Therefore the application stops the agent.
     *
     *
     * This is fundamentally different from the normal stop:
     *
     * NORMAL STOP
     * ===========
     *
     *   model says:
     *       "I'm finished."
     *
     *   application:
     *       returns final answer
     *
     *
     * SAFETY STOP
     * ===========
     *
     *   model still wants another turn
     *
     *   application says:
     *       "No more model turns are allowed."
     */
    console.log(
        `Safety stop: agent reached the maximum of ${MAX_ITERATIONS} iterations.`
    );

    return Response.json(
        {
            error: "Agent reached the maximum number of iterations.",
            maxIterations: MAX_ITERATIONS,
        },
        {
            status: 508,
        }
    );
}