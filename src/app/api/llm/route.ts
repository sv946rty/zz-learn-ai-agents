/**
 * Lesson 002-005 — Multiple Tool Calls
 *
 * Goal:
 * Expand our Agent Loop so that ONE model response can contain
 * MULTIPLE function_call items and our application can execute
 * ALL of them before returning their results to the model.
 *
 * The major new concept in this lesson is:
 *
 *   ONE model response
 *       ↓
 *   MULTIPLE function_calls
 *       ↓
 *   execute ALL requested tools
 *       ↓
 *   create ALL function_call_outputs
 *       ↓
 *   send ALL results back together
 *       ↓
 *   MODEL AGAIN
 *
 *
 * ============================================================
 * WHERE WE CAME FROM — LESSON 002-004
 * ============================================================
 *
 * Lesson 002-004 gave us the BASIC Agent Loop:
 *
 *   User prompt
 *       ↓
 *   Model
 *       ↓
 *   ONE function_call handled
 *       ↓
 *   Application executes calculator()
 *       ↓
 *   Tool result
 *       ↓
 *   function_call_output
 *       ↓
 *   Model again
 *       │
 *       ├── requests calculator again → LOOP
 *       │
 *       └── returns final answer       → STOP
 *
 *
 * The important breakthrough in 002-004 was:
 *
 *   Tool Result → Model Again
 *
 *
 * This allowed calculator to be executed many times over the
 * lifetime of the Agent Loop.
 *
 *
 * For example:
 *
 *   MODEL RESPONSE #1
 *       ↓
 *   calculator(27, 43)
 *       ↓
 *   1161
 *       ↓
 *   MODEL AGAIN
 *
 *
 *   MODEL RESPONSE #2
 *       ↓
 *   calculator(1161, 14)
 *       ↓
 *   16254
 *       ↓
 *   MODEL AGAIN
 *
 *
 *   MODEL RESPONSE #3
 *       ↓
 *   final answer
 *
 *
 * So calculator was executed TWICE.
 *
 * But those two calculator calls came from TWO DIFFERENT
 * model responses.
 *
 *
 * ============================================================
 * THE LIMITATION OF 002-004
 * ============================================================
 *
 * In 002-004 we used:
 *
 *   response.output.find(
 *       (item) => item.type === "function_call"
 *   );
 *
 *
 * .find() returns only ONE matching item.
 *
 *
 * Conceptually:
 *
 *   response.output
 *       │
 *       ├── function_call #1
 *       ├── function_call #2
 *       └── function_call #3
 *
 *              ↓
 *
 *           .find()
 *
 *              ↓
 *
 *       function_call #1
 *
 *
 * Our 002-004 application therefore HANDLED only ONE
 * function_call from each model response.
 *
 *
 * IMPORTANT:
 *
 * This does NOT mean the model is guaranteed to return only
 * one function_call.
 *
 * It means OUR 002-004 CODE intentionally handled only one.
 *
 *
 * ============================================================
 * WHAT WE ADD IN LESSON 002-005
 * ============================================================
 *
 * A single model response can contain multiple function_call
 * items.
 *
 *
 * For example:
 *
 *               ONE MODEL RESPONSE
 *                       ↓
 *                response.output
 *                       ↓
 *          ┌────────────┼────────────┐
 *          ↓            ↓            ↓
 *     function_call function_call function_call
 *          #1           #2           #3
 *          ↓            ↓            ↓
 *     calculator   calculator   calculator
 *       27 × 43      81 + 19      144 ÷ 12
 *
 *
 * Our application must now:
 *
 *   1. collect ALL function_calls
 *
 *   2. execute EACH function_call
 *
 *   3. create a function_call_output for EACH call
 *
 *   4. preserve EACH call_id
 *
 *   5. collect ALL results into one array
 *
 *   6. send ALL results back to the model together
 *
 *   7. let the model decide what to do next
 *
 *
 * ============================================================
 * TOOL SCOPE — STILL CALCULATOR ONLY
 * ============================================================
 *
 * Lesson 002-003 created two tool implementations:
 *
 *   1. calculator
 *   2. format_final_answer
 *
 *
 * Lesson 002-005 still intentionally exposes ONLY:
 *
 *   calculator
 *
 *
 * We are NOT exposing:
 *
 *   format_final_answer
 *
 *
 * Why?
 *
 * Because we want this lesson to introduce exactly ONE major
 * new concept:
 *
 *   Multiple function_calls from ONE model response.
 *
 *
 * We do NOT need multiple different tool TYPES to demonstrate
 * multiple tool CALLS.
 *
 *
 * The model can request calculator several times:
 *
 *   calculator(...)
 *   calculator(...)
 *   calculator(...)
 *
 *
 * inside one model response.
 *
 *
 * ============================================================
 * .find() → .filter()
 * ============================================================
 *
 * This is the first important code change.
 *
 *
 * 002-004:
 *
 *   const toolCall = response.output.find(
 *       (item) => item.type === "function_call"
 *   );
 *
 *
 * Result:
 *
 *   ONE function_call
 *
 *   OR
 *
 *   undefined
 *
 *
 * ------------------------------------------------------------
 *
 * 002-005:
 *
 *   const toolCalls = response.output.filter(
 *       (item) => item.type === "function_call"
 *   );
 *
 *
 * Result:
 *
 *   ARRAY containing:
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
 * Example:
 *
 *   toolCalls = [
 *       function_call #1,
 *       function_call #2,
 *       function_call #3
 *   ];
 *
 *
 * ============================================================
 * IMPORTANT — AN EMPTY ARRAY IS TRUTHY
 * ============================================================
 *
 * In 002-004 we could write:
 *
 *   if (!toolCall)
 *
 *
 * because .find() returned:
 *
 *   function_call
 *
 * or:
 *
 *   undefined
 *
 *
 * But .filter() ALWAYS returns an array.
 *
 *
 * Even when there are no matches:
 *
 *   []
 *
 *
 * In JavaScript:
 *
 *   Boolean([]) === true
 *
 *
 * Therefore this would be WRONG:
 *
 *   if (!toolCalls)
 *
 *
 * because:
 *
 *   ![] === false
 *
 *
 * Instead we check:
 *
 *   if (toolCalls.length === 0)
 *
 *
 * That means:
 *
 *   "The current model response contains ZERO tool calls."
 *
 *
 * Therefore:
 *
 *   the model has finished
 *       ↓
 *   return the final answer
 *       ↓
 *   STOP
 *
 *
 * ============================================================
 * WHY WE NEED for...of
 * ============================================================
 *
 * Once toolCalls can contain multiple items, we need to
 * execute EACH one.
 *
 *
 * Conceptually:
 *
 *   for (const toolCall of toolCalls) {
 *
 *       parse this tool call
 *
 *       execute this tool call
 *
 *       create this tool call's result
 *
 *       save this result
 *   }
 *
 *
 * Example:
 *
 *   toolCalls
 *       │
 *       ├── call_A: calculator(27, 43)
 *       │
 *       ├── call_B: calculator(81, 19)
 *       │
 *       └── call_C: calculator(144, 12)
 *
 *
 *              ↓ for...of
 *
 *
 *   ITERATION #1
 *
 *     calculator(27, 43)
 *
 *         ↓
 *
 *       1161
 *
 *
 *   ITERATION #2
 *
 *     calculator(81, 19)
 *
 *         ↓
 *
 *       100
 *
 *
 *   ITERATION #3
 *
 *     calculator(144, 12)
 *
 *         ↓
 *
 *       12
 *
 *
 * IMPORTANT:
 *
 * This for...of loop is DIFFERENT from our outer:
 *
 *   while (true)
 *
 *
 * while (true)
 *     ↓
 * controls MODEL TURNS
 *
 *
 * for...of
 *     ↓
 * handles TOOL CALLS inside ONE model response
 *
 *
 * ============================================================
 * TWO LOOPS WITH TWO DIFFERENT JOBS
 * ============================================================
 *
 * We now effectively have:
 *
 *   while (true) {
 *
 *       MODEL TURN
 *
 *       collect ALL tool calls
 *
 *       for (const toolCall of toolCalls) {
 *
 *           execute this tool
 *       }
 *
 *       send ALL results back
 *
 *   }
 *
 *
 * Think of it like this:
 *
 *   OUTER LOOP
 *   ==========
 *
 *   while (true)
 *
 *       controls:
 *
 *       MODEL → MODEL → MODEL → ...
 *
 *
 *   INNER LOOP
 *   ==========
 *
 *   for (const toolCall of toolCalls)
 *
 *       controls:
 *
 *       Tool #1
 *       Tool #2
 *       Tool #3
 *       ...
 * ============================================================
 * MODEL CALLS vs TOOL CALLS — VERY IMPORTANT
 * ============================================================
 *
 * At this point it is important to distinguish TWO different
 * kinds of "calls":
 *
 *   1. MODEL CALL
 *
 *   2. TOOL CALL
 *
 *
 * ------------------------------------------------------------
 * MODEL CALL
 * ------------------------------------------------------------
 *
 * Every time our application executes:
 *
 *   await openai.responses.create(...)
 *
 * we make ONE call to the model.
 *
 *
 * In our code, that happens inside:
 *
 *   while (true)
 *
 *
 * Therefore:
 *
 *   ONE while-loop iteration
 *       ↓
 *   ONE openai.responses.create(...)
 *       ↓
 *   ONE MODEL CALL / MODEL TURN
 *       ↓
 *   ONE model response
 *
 *
 * IMPORTANT:
 *
 * ONE model response can contain:
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
 * ------------------------------------------------------------
 * TOOL CALL
 * ------------------------------------------------------------
 *
 * A function_call inside response.output is a TOOL REQUEST
 * made by the model.
 *
 *
 * For example, ONE model response could contain:
 *
 *   response.output = [
 *
 *       calculator(27, 43),
 *
 *       calculator(81, 19),
 *
 *       calculator(144, 12)
 *   ];
 *
 *
 * That means:
 *
 *   MODEL CALLS: 1
 *
 *   TOOL CALLS:  3
 *
 *
 * Our inner:
 *
 *   for (const toolCall of toolCalls)
 *
 * executes those THREE tool requests.
 *
 *
 * The for...of loop does NOT call the model again.
 *
 * It only executes the tools that the CURRENT model response
 * already requested.
 *
 *
 * ============================================================
 * WHY CAN ONE MODEL CALL REQUEST MULTIPLE TOOLS?
 * ============================================================
 *
 * Consider our 002-005 test:
 *
 *   27 × 43
 *
 *   81 + 19
 *
 *   144 ÷ 12
 *
 *
 * These calculations are INDEPENDENT.
 *
 * The second calculation does NOT need the result of the first.
 *
 * The third calculation does NOT need the result of either
 * previous calculation.
 *
 *
 * The model already knows every argument needed:
 *
 *   calculator("multiply", 27, 43)
 *
 *   calculator("add", 81, 19)
 *
 *   calculator("divide", 144, 12)
 *
 *
 * Therefore the model CAN request all three tool calls in
 * ONE model response:
 *
 *
 *                  MODEL CALL #1
 *                        ↓
 *                 ONE response
 *                        ↓
 *            ┌───────────┼───────────┐
 *            ↓           ↓           ↓
 *       calculator   calculator   calculator
 *        27 × 43      81 + 19      144 ÷ 12
 *            ↓           ↓           ↓
 *          1161         100          12
 *            └───────────┼───────────┘
 *                        ↓
 *                  toolOutputs[]
 *                        ↓
 *                  MODEL CALL #2
 *                        ↓
 *                   final answer
 *
 *
 * Notice the totals for the COMPLETE agent interaction:
 *
 *   MODEL CALLS:       2
 *
 *   TOOL CALLS:        3
 *
 *   TOOL EXECUTIONS:   3
 *
 *
 * MODEL CALL #1 requested all three tools.
 *
 * MODEL CALL #2 received all three results and produced the
 * final answer.
 *
 *
 * ============================================================
 * WHEN DO WE NEED ANOTHER MODEL CALL?
 * ============================================================
 *
 * Another model turn becomes necessary when the model needs
 * information produced by a tool before it can determine the
 * next action.
 *
 *
 * This creates a TOOL DEPENDENCY or TOOL CHAIN.
 *
 *
 * Imagine that we exposed TWO tools:
 *
 *   calculator
 *
 *   format_final_answer
 *
 *
 * And the user asks:
 *
 *   "Use the calculator to multiply 27 by 43.
 *    Then format the final answer."
 *
 *
 * The desired dependency is:
 *
 *   calculator(27, 43)
 *
 *       ↓
 *
 *      1161
 *
 *       ↓
 *
 *   format_final_answer(1161)
 *
 *
 * format_final_answer needs the RESULT produced by calculator.
 *
 * Therefore the calculator result must first be returned to
 * the model before the model can request the dependent tool
 * using that result.
 *
 *
 * Conceptually:
 *
 *   MODEL CALL #1
 *
 *       ↓
 *
 *   function_call:
 *
 *       calculator(27, 43)
 *
 *       ↓
 *
 *   APPLICATION executes calculator
 *
 *       ↓
 *
 *      1161
 *
 *       ↓
 *
 *   function_call_output
 *
 *       ↓
 *
 *
 *   MODEL CALL #2
 *
 *       ↓
 *
 *   The model now receives:
 *
 *       1161
 *
 *       ↓
 *
 *   function_call:
 *
 *       format_final_answer(1161)
 *
 *       ↓
 *
 *   APPLICATION executes format_final_answer
 *
 *       ↓
 *
 *   "The final answer is 1161."
 *
 *       ↓
 *
 *   function_call_output
 *
 *       ↓
 *
 *
 *   MODEL CALL #3
 *
 *       ↓
 *
 *   final assistant response
 *
 *       ↓
 *
 *   STOP
 *
 *
 * Therefore:
 *
 *   MODEL CALLS:       3
 *
 *   TOOL CALLS:        2
 *
 *   TOOL EXECUTIONS:   2
 *
 *
 * ============================================================
 * INDEPENDENT vs DEPENDENT TOOL CALLS
 * ============================================================
 *
 * INDEPENDENT:
 *
 *   Tool B does NOT need Tool A's result.
 *
 *
 * Example:
 *
 *   calculator(27, 43)
 *   calculator(81, 19)
 *   calculator(144, 12)
 *
 *
 * These CAN often be requested together:
 *
 *               ONE MODEL CALL
 *
 *               ┌────┼────┐
 *               ↓    ↓    ↓
 *             Tool Tool Tool
 *
 *
 * ------------------------------------------------------------
 *
 * DEPENDENT / TOOL CHAIN:
 *
 *   Tool B NEEDS Tool A's result.
 *
 *
 * Example:
 *
 *   calculator(27, 43)
 *
 *       ↓
 *
 *      1161
 *
 *       ↓
 *
 *   format_final_answer(1161)
 *
 *
 * This normally requires:
 *
 *   MODEL
 *     ↓
 *   Tool A
 *     ↓
 *   Result A
 *     ↓
 *   MODEL
 *     ↓
 *   Tool B
 *     ↓
 *   Result B
 *     ↓
 *   MODEL
 *
 *
 * ============================================================
 * IMPORTANT — BATCHING IS NOT GUARANTEED
 * ============================================================
 *
 * Independent tools CAN be requested together in one model
 * response.
 *
 * That does NOT mean the model is guaranteed to batch them.
 *
 * The model may still choose to request independent tools
 * across multiple model turns.
 *
 *
 * The architectural rule to remember is:
 *
 *   If Tool B needs Tool A's RESULT before Tool B's arguments
 *   can be determined, Tool A's result must become available
 *   before that dependent tool call can be performed correctly.
 *
 *
 * ============================================================
 * THE EASIEST WAY TO REMEMBER THE TWO LOOPS
 * ============================================================
 *
 *   while (true)
 *
 *       ↓
 *
 *   "Does the MODEL need another turn?"
 *
 *
 * ------------------------------------------------------------
 *
 *   for (const toolCall of toolCalls)
 *
 *       ↓
 *
 *   "How many tool requests did the CURRENT model turn
 *    give our application?"
 *
 *
 * Or, in one line:
 *
 *   while = MODEL TURNS
 *
 *   for   = TOOL CALLS inside the CURRENT MODEL TURN
 *
 * ============================================================
 * WHY WE NEED toolOutputs[]
 * ============================================================
 *
 * In 002-004 we created ONE:
 *
 *   const toolOutput = {
 *       type: "function_call_output",
 *       ...
 *   };
 *
 *
 * and then sent:
 *
 *   agentInput = [
 *       toolOutput
 *   ];
 *
 *
 * But now we may produce:
 *
 *   toolOutput #1
 *   toolOutput #2
 *   toolOutput #3
 *
 *
 * Therefore we need an array:
 *
 *   const toolOutputs = [];
 *
 *
 * Each time we execute a tool:
 *
 *   toolOutputs.push(toolOutput);
 *
 *
 * After the for...of loop:
 *
 *   toolOutputs
 *
 * might contain:
 *
 *   [
 *       {
 *           type: "function_call_output",
 *           call_id: "call_A",
 *           output: "1161"
 *       },
 *
 *       {
 *           type: "function_call_output",
 *           call_id: "call_B",
 *           output: "100"
 *       },
 *
 *       {
 *           type: "function_call_output",
 *           call_id: "call_C",
 *           output: "12"
 *       }
 *   ]
 *
 *
 * ============================================================
 * EACH TOOL CALL HAS ITS OWN call_id
 * ============================================================
 *
 * This becomes even more important when handling multiple
 * tool calls.
 *
 *
 * Suppose the model returns:
 *
 *   function_call #1
 *
 *     call_id: "call_A"
 *     calculator(27, 43)
 *
 *
 *   function_call #2
 *
 *     call_id: "call_B"
 *     calculator(81, 19)
 *
 *
 *   function_call #3
 *
 *     call_id: "call_C"
 *     calculator(144, 12)
 *
 *
 * Our application executes them and creates:
 *
 *   function_call_output #1
 *
 *     call_id: "call_A"
 *     output: "1161"
 *
 *
 *   function_call_output #2
 *
 *     call_id: "call_B"
 *     output: "100"
 *
 *
 *   function_call_output #3
 *
 *     call_id: "call_C"
 *     output: "12"
 *
 *
 * Therefore:
 *
 *   call_A → result for call_A
 *
 *   call_B → result for call_B
 *
 *   call_C → result for call_C
 *
 *
 * The call_id lets the model correctly match each result
 * with the tool request that produced it.
 *
 *
 * ============================================================
 * response.id STILL HAS A DIFFERENT JOB
 * ============================================================
 *
 * Do not confuse:
 *
 *   response.id
 *
 * with:
 *
 *   toolCall.call_id
 *
 *
 * They still have two different responsibilities.
 *
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
 * connects EACH TOOL REQUEST to ITS TOOL RESULT
 *
 *
 * With multiple tool calls:
 *
 *                  MODEL RESPONSE
 *                       │
 *                       │ response.id
 *                       │
 *                       ▼
 *              previous_response_id
 *
 *
 * But inside that model response:
 *
 *     call_A ─────────→ result_A
 *
 *     call_B ─────────→ result_B
 *
 *     call_C ─────────→ result_C
 *
 *
 * ============================================================
 * SEND ALL RESULTS BACK TOGETHER
 * ============================================================
 *
 * After every tool call from the current model response has
 * been executed, we send:
 *
 *   agentInput = toolOutputs;
 *
 *
 * NOT:
 *
 *   agentInput = [toolOutput];
 *
 *
 * Conceptually:
 *
 *              ONE MODEL RESPONSE
 *                      ↓
 *          ┌───────────┼───────────┐
 *          ↓           ↓           ↓
 *       call_A      call_B      call_C
 *          ↓           ↓           ↓
 *       result_A    result_B    result_C
 *          │           │           │
 *          └───────────┼───────────┘
 *                      ↓
 *                 toolOutputs
 *                      ↓
 *
 *   previous_response_id + toolOutputs
 *
 *                      ↓
 *
 *                 MODEL AGAIN
 *
 *
 * Because we use previous_response_id, we do NOT manually
 * copy response.output into agentInput.
 *
 *
 * The only NEW information is:
 *
 *   all function_call_outputs produced from that response.
 *
 *
 * ============================================================
 * 002-004 vs 002-005
 * ============================================================
 *
 * This distinction is extremely important.
 *
 *
 * 002-004
 * =======
 *
 * The application HANDLED:
 *
 *   ONE function_call
 *
 * from each model response.
 *
 *
 * Example:
 *
 *   Model response #1
 *       ↓
 *   ONE tool
 *       ↓
 *   Model response #2
 *       ↓
 *   ONE tool
 *       ↓
 *   Model response #3
 *
 *
 * Pattern:
 *
 *   Model → ONE Tool → Model → ONE Tool → Model
 *
 *
 * ------------------------------------------------------------
 *
 * 002-005
 * =======
 *
 * The application can HANDLE:
 *
 *   MULTIPLE function_calls
 *
 * from ONE model response.
 *
 *
 * Example:
 *
 *                     Model
 *                       ↓
 *                ONE response
 *                       ↓
 *             ┌─────────┼─────────┐
 *             ↓         ↓         ↓
 *           Tool #1   Tool #2   Tool #3
 *             ↓         ↓         ↓
 *           Result 1  Result 2  Result 3
 *             └─────────┼─────────┘
 *                       ↓
 *                     Model
 *
 *
 * The key question is:
 *
 *   "How many tool calls can OUR APPLICATION handle
 *    from ONE model response?"
 *
 *
 * 002-004:
 *
 *   ONE
 *
 *
 * 002-005:
 *
 *   ZERO, ONE, OR MANY
 *
 *
 * ============================================================
 * INDEPENDENT vs DEPENDENT CALCULATIONS
 * ============================================================
 *
 * To clearly test multiple tool calls from ONE response, we
 * should use INDEPENDENT calculations.
 *
 *
 * Good 002-005 test:
 *
 *   27 × 43
 *
 *   81 + 19
 *
 *   144 ÷ 12
 *
 *
 * None of these calculations depends on another result.
 *
 * Therefore the model can potentially request all three
 * calculator calls in ONE model response.
 *
 *
 * Compare that with:
 *
 *   27 × 43
 *
 *       ↓
 *
 *   take THAT result × 14
 *
 *
 * The second calculation depends on the first result.
 *
 * Therefore the model normally needs:
 *
 *   Model
 *       ↓
 *   calculator #1
 *       ↓
 *   result #1
 *       ↓
 *   Model again
 *       ↓
 *   calculator #2
 *
 *
 * That was an excellent test for 002-004.
 *
 * It is NOT the clearest test for 002-005.
 *
 *
 * ============================================================
 * COMPLETE 002-005 CONTROL FLOW
 * ============================================================
 *
 * FIRST MODEL TURN
 * ------------------------------------------------------------
 *
 *   User prompt
 *       ↓
 *   Model
 *       ↓
 *   response.output
 *       ↓
 *   .filter(function_call)
 *       ↓
 *   toolCalls[]
 *
 *
 * Suppose:
 *
 *   toolCalls.length === 3
 *
 *
 * Then:
 *
 *   for (const toolCall of toolCalls)
 *
 *       ↓
 *
 *   execute call #1
 *       ↓
 *   create output #1
 *       ↓
 *   push into toolOutputs
 *
 *       ↓
 *
 *   execute call #2
 *       ↓
 *   create output #2
 *       ↓
 *   push into toolOutputs
 *
 *       ↓
 *
 *   execute call #3
 *       ↓
 *   create output #3
 *       ↓
 *   push into toolOutputs
 *
 *
 * Now:
 *
 *   toolOutputs.length === 3
 *
 *
 * Then:
 *
 *   previousResponseId = response.id;
 *
 *   agentInput = toolOutputs;
 *
 *
 *       ↓
 *
 *   while (true) begins another iteration
 *
 *
 * SECOND MODEL TURN
 * ------------------------------------------------------------
 *
 *   previous_response_id
 *
 *       +
 *
 *   [
 *       output #1,
 *       output #2,
 *       output #3
 *   ]
 *
 *       ↓
 *
 *   Model
 *
 *
 * The model can now:
 *
 *   - request more tools
 *
 * OR:
 *
 *   - return the final answer
 *
 *
 * If there are no function_calls:
 *
 *   toolCalls.length === 0
 *
 *       ↓
 *
 *   return Response.json(...)
 *
 *       ↓
 *
 *   STOP
 *
 *
 * ============================================================
 * WHAT WE ARE DOING NOW
 * ============================================================
 *
 * We ARE:
 *
 *   ✓ using calculator
 *
 *   ✓ using the Agent Loop from 002-004
 *
 *   ✓ using .filter() to collect ALL function_calls
 *
 *   ✓ checking toolCalls.length
 *
 *   ✓ using for...of to execute each tool call
 *
 *   ✓ creating one function_call_output per function_call
 *
 *   ✓ preserving every call_id
 *
 *   ✓ collecting results in toolOutputs[]
 *
 *   ✓ sending all toolOutputs back together
 *
 *   ✓ using response.id as previous_response_id
 *
 *   ✓ allowing the model to request more tools on later turns
 *
 *   ✓ stopping when a model response contains no tool calls
 *
 *
 * We are NOT yet:
 *
 *   ✗ using format_final_answer
 *
 *   ✗ adding a maximum iteration count
 *
 *   ✗ protecting while (true) from an infinite agent loop
 *
 *   ✗ building the full Agent UI
 *
 *
 * ============================================================
 * IMPORTANT — NO SAFETY GUARD YET
 * ============================================================
 *
 * Our code still uses:
 *
 *   while (true)
 *
 *
 * without a maximum iteration count.
 *
 *
 * That is intentional.
 *
 *
 * According to our course roadmap:
 *
 *   002-005
 *       ↓
 *   Multiple Tool Calls
 *
 *   002-006
 *       ↓
 *   Safety Guard (Max Iterations)
 *
 *
 * We should NOT implement the max-iteration guard early,
 * because that would mix the next lesson into this one.
 *
 *
 * ============================================================
 * KEY LESSON
 * ============================================================
 *
 * Lesson 002-002:
 *
 *   Model
 *       ↓
 *   function_call
 *       ↓
 *   STOP
 *
 *
 * Lesson 002-003:
 *
 *   Model
 *       ↓
 *   function_call
 *       ↓
 *   Tool
 *       ↓
 *   Result
 *       ↓
 *   STOP
 *
 *
 * Lesson 002-004:
 *
 *   Model
 *       ↓
 *   ONE function_call handled
 *       ↓
 *   Tool
 *       ↓
 *   Result
 *       ↓
 *   function_call_output
 *       ↓
 *   Model again
 *       │
 *       └────────────────────────↺
 *
 *
 * Lesson 002-005:
 *
 *                       Model
 *                         ↓
 *                  ONE response
 *                         ↓
 *              ┌──────────┼──────────┐
 *              ↓          ↓          ↓
 *           call #1    call #2    call #3
 *              ↓          ↓          ↓
 *           Tool #1    Tool #2    Tool #3
 *              ↓          ↓          ↓
 *           result #1  result #2  result #3
 *              └──────────┼──────────┘
 *                         ↓
 *                    Model again
 *                         │
 *                         └──────────────↺
 *
 *
 * The formula remains:
 *
 *   Agent = Model + Tools + Control Loop
 *
 *
 * But our control loop is now capable of handling a BATCH
 * of tool calls from one model response.
 *
 *
 * ============================================================
 * TEST COMMAND
 * ============================================================
 *
 * We want INDEPENDENT calculations so the model has a reason
 * to request multiple calculator calls in ONE response.
 *
 *
 * curl -X POST http://localhost:3000/api/llm \
 *   -H "Content-Type: application/json" \
 *   -d '{"prompt":"Use the calculator to calculate these three independent calculations: 27 multiplied by 43, 81 plus 19, and 144 divided by 12. Use the calculator for all three calculations before giving me the final answers."}'
 *
 *
 * Expected mathematical results:
 *
 *   27 × 43 = 1161
 *
 *   81 + 19 = 100
 *
 *   144 ÷ 12 = 12
 *
 *
 * The IMPORTANT thing to inspect is NOT merely the answers.
 *
 *
 * We want the FIRST relevant model response to contain
 * multiple function_call items:
 *
 *   response.output
 *       │
 *       ├── function_call #1
 *       │     calculator(27, 43)
 *       │
 *       ├── function_call #2
 *       │     calculator(81, 19)
 *       │
 *       └── function_call #3
 *             calculator(144, 12)
 *
 *
 * Then our log should show:
 *
 *   Number of tool calls requested: 3
 *
 *
 * followed by THREE calculator executions and THREE
 * function_call_outputs.
 *
 *
 * Then:
 *
 *   agentInput = toolOutputs
 *
 *
 * sends all three results back to the model.
 *
 *
 * ============================================================
 * DEFINITION OF DONE
 * ============================================================
 *
 * Lesson 002-005 is complete when:
 *
 *   ✓ response.output.filter(...) collects all function_calls
 *
 *   ✓ zero tool calls are detected using:
 *       toolCalls.length === 0
 *
 *   ✓ one model response can be handled when it contains
 *       multiple function_calls
 *
 *   ✓ for...of executes every collected tool call
 *
 *   ✓ each calculator request is executed
 *
 *   ✓ each tool result becomes its own function_call_output
 *
 *   ✓ every function_call_output preserves its call_id
 *
 *   ✓ all outputs are collected into toolOutputs[]
 *
 *   ✓ all toolOutputs are sent back together
 *
 *   ✓ response.id is still used as previous_response_id
 *
 *   ✓ the model gets another turn after receiving the results
 *
 *   ✓ the loop stops when the model returns no function_calls
 *
 *   ✓ our independent-calculation test can demonstrate
 *       multiple tool calls from one model response
 *
 *
 * ============================================================
 * NEXT LESSON
 * ============================================================
 *
 * Lesson 002-006 — Safety Guard (Max Iterations)
 *
 *
 * Our Agent Loop currently uses:
 *
 *   while (true)
 *
 *
 * That means a badly behaving agent could theoretically keep
 * requesting tools forever.
 *
 *
 * In 002-006 we will add a maximum iteration guard so the
 * application can safely stop an agent that does not finish.
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
 * Lesson 002-005 still exposes ONLY ONE tool:
 *
 *   calculator
 *
 * The new concept is NOT adding more tool types.
 *
 * The new concept is:
 *
 *   ONE model response
 *       ↓
 *   MULTIPLE function_call items
 *       ↓
 *   execute ALL of them
 *       ↓
 *   send ALL function_call_outputs back together
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
     * agentInput contains ONLY the NEW input that we want to
     * send in the CURRENT model request.
     *
     *
     * FIRST ITERATION:
     *
     *   agentInput
     *       ↓
     *   user's original prompt
     *
     *
     * LATER ITERATIONS:
     *
     *   agentInput
     *       ↓
     *   ALL function_call_outputs produced from the previous
     *   model response
     *
     *
     * We do NOT manually copy response.output into agentInput.
     *
     * previousResponseId tells OpenAI which previous model
     * response the new input continues from.
     */
    let agentInput: OpenAI.Responses.ResponseInput = [
        {
            role: "user",
            content: prompt,
        },
    ];

    /**
     * On the first iteration there is no previous model
     * response, so this starts as undefined.
     *
     *
     * After each model response:
     *
     *   previousResponseId = response.id;
     *
     *
     * On the next model request:
     *
     *   previous_response_id: previousResponseId
     *
     *
     * This connects:
     *
     *   MODEL TURN
     *       ↓
     *   NEXT MODEL TURN
     */
    let previousResponseId: string | undefined;

    /**
     * MULTIPLE-TOOL-CALL AGENT LOOP
     *
     * The OUTER while loop controls MODEL TURNS.
     *
     * Inside each model turn, we can now process ZERO, ONE,
     * or MULTIPLE function_calls.
     *
     *
     * Conceptually:
     *
     *   while (true) {
     *
     *       ask model what to do
     *
     *       collect ALL function_calls
     *
     *       if there are ZERO {
     *           return final answer
     *       }
     *
     *       for EACH function_call {
     *           execute tool
     *           create function_call_output
     *           save output
     *       }
     *
     *       send ALL outputs back
     *
     *       continue
     *   }
     *
     *
     * IMPORTANT:
     *
     * There is intentionally NO maximum-iteration guard yet.
     *
     * That belongs to Lesson 002-006.
     */
    while (true) {
        /**
         * STEP 1 — Ask the model what to do next.
         *
         *
         * FIRST ITERATION:
         *
         *   input:
         *       user prompt
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
         * STEP 2 — Collect ALL function_call items from this
         * model response.
         *
         *
         * 002-004 used:
         *
         *   .find(...)
         *
         * which selected ONE function_call.
         *
         *
         * 002-005 uses:
         *
         *   .filter(...)
         *
         * which gives us an ARRAY containing:
         *
         *   ZERO
         *   ONE
         *   or MULTIPLE
         *
         * function_calls.
         */
        const toolCalls = response.output.filter(
            (item) => item.type === "function_call"
        );

        console.log(
            "Number of tool calls requested:",
            toolCalls.length
        );

        /**
         * STEP 3 — If there are ZERO function_calls, the model
         * has finished its work.
         *
         *
         * .filter() always returns an array.
         *
         * Therefore:
         *
         *   if (!toolCalls)
         *
         * would NOT correctly detect an empty array.
         *
         *
         * We check:
         *
         *   toolCalls.length === 0
         *
         *
         * If true:
         *
         *   no tool calls
         *       ↓
         *   model is finished
         *       ↓
         *   return final answer
         *       ↓
         *   POST() ends
         *       ↓
         *   while (true) ends
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

        /**
         * STEP 4 — Create an array for ALL tool results from
         * THIS model response.
         *
         *
         * Example:
         *
         *   toolCalls.length === 3
         *
         *
         * After execution we want:
         *
         *   toolOutputs = [
         *       output for call #1,
         *       output for call #2,
         *       output for call #3
         *   ];
         */
        const toolOutputs: OpenAI.Responses.ResponseInputItem.FunctionCallOutput[] =
            [];

        /**
         * STEP 5 — Execute EVERY function_call from this
         * model response.
         *
         *
         * This inner for...of loop is the major new behavior
         * introduced in Lesson 002-005.
         *
         *
         * OUTER LOOP:
         *
         *   while (true)
         *
         *   controls MODEL TURNS.
         *
         *
         * INNER LOOP:
         *
         *   for (const toolCall of toolCalls)
         *
         *   handles EVERY tool call inside the CURRENT
         *   model response.
         */
        for (const toolCall of toolCalls) {
            /**
             * STEP 5A — Protect the tool boundary.
             *
             * Lesson 002-005 still exposes only calculator.
             */
            if (toolCall.name !== "calculator") {
                throw new Error(
                    `Unknown tool requested: ${toolCall.name}`
                );
            }

            /**
             * STEP 5B — Parse THIS calculator call's arguments.
             *
             *
             * toolCall.arguments is a JSON string:
             *
             *   '{"operation":"multiply","a":27,"b":43}'
             *
             *                ↓
             *
             *            JSON.parse()
             *
             *                ↓
             *
             *   {
             *       operation: "multiply",
             *       a: 27,
             *       b: 43
             *   }
             *
             *
             * IMPORTANT:
             *
             * The TypeScript "as" assertion describes the
             * expected compile-time shape.
             *
             * It is NOT runtime validation.
             */
            const args = JSON.parse(toolCall.arguments) as {
                operation: CalculatorOperation;
                a: number;
                b: number;
            };

            console.log("Calculator arguments:", args);

            /**
             * STEP 5C — Execute THIS calculator request.
             *
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
             * STEP 5D — Create the function_call_output for
             * THIS specific tool request.
             *
             *
             * The SAME call_id must be preserved:
             *
             *   function_call
             *
             *       call_id: call_A
             *
             *            ↓
             *
             *   function_call_output
             *
             *       call_id: call_A
             *
             *
             * With multiple tool calls, every call has its own
             * call_id.
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
             * STEP 5E — Save this result in the batch.
             *
             *
             * First iteration:
             *
             *   toolOutputs = [
             *       output #1
             *   ]
             *
             *
             * Second iteration:
             *
             *   toolOutputs = [
             *       output #1,
             *       output #2
             *   ]
             *
             *
             * Third iteration:
             *
             *   toolOutputs = [
             *       output #1,
             *       output #2,
             *       output #3
             *   ]
             */
            toolOutputs.push(toolOutput);
        }

        /**
         * At this point the for...of loop is finished.
         *
         * Therefore EVERY function_call collected from the
         * current model response has been executed.
         *
         *
         * Example:
         *
         *   MODEL RESPONSE
         *       │
         *       ├── call_A
         *       │      ↓
         *       │   calculator()
         *       │      ↓
         *       │   result_A
         *       │
         *       ├── call_B
         *       │      ↓
         *       │   calculator()
         *       │      ↓
         *       │   result_B
         *       │
         *       └── call_C
         *              ↓
         *           calculator()
         *              ↓
         *           result_C
         *
         *
         * toolOutputs now contains ALL THREE results.
         */

        /**
         * STEP 6 — Remember which MODEL RESPONSE we are
         * continuing from.
         *
         *
         * response.id
         *     ↓
         * previousResponseId
         *     ↓
         * previous_response_id on next request
         *
         *
         * This connects MODEL TURNS.
         *
         *
         * It is different from call_id:
         *
         * response.id
         *     ↓
         * connects MODEL TURNS
         *
         *
         * toolCall.call_id
         *     ↓
         * connects each TOOL REQUEST to its TOOL RESULT
         */
        previousResponseId = response.id;

        /**
         * STEP 7 — Make ALL tool results the NEW input for the
         * next model request.
         *
         *
         * 002-004:
         *
         *   agentInput = [
         *       toolOutput
         *   ];
         *
         *
         * 002-005:
         *
         *   agentInput = toolOutputs;
         *
         *
         * Conceptually:
         *
         *              ONE MODEL RESPONSE
         *                      ↓
         *          ┌───────────┼───────────┐
         *          ↓           ↓           ↓
         *       call #1     call #2     call #3
         *          ↓           ↓           ↓
         *       result #1   result #2   result #3
         *          │           │           │
         *          └───────────┼───────────┘
         *                      ↓
         *                 toolOutputs
         *
         *                      +
         *
         *            previous_response_id
         *
         *                      ↓
         *
         *                 MODEL AGAIN
         *
         *
         * We do NOT manually add response.output because
         * previous_response_id continues from that response.
         *
         * The only NEW information is the collection of
         * function_call_outputs.
         */
        agentInput = toolOutputs;

        /**
         * STEP 8 — Reach the end of this while-loop iteration.
         *
         *
         * There is:
         *
         *   no return
         *   no break
         *
         * here.
         *
         *
         * Therefore while (true) begins another MODEL TURN.
         *
         *
         * The next model response may contain:
         *
         *   ZERO tool calls
         *       ↓
         *   final answer → STOP
         *
         *
         * OR:
         *
         *   ONE tool call
         *       ↓
         *   execute it → LOOP
         *
         *
         * OR:
         *
         *   MULTIPLE tool calls
         *       ↓
         *   execute ALL → LOOP
         *
         *
         * IMPORTANT:
         *
         * There is still no maximum iteration guard.
         *
         * That is the next lesson:
         *
         *   002-006 — Safety Guard (Max Iterations)
         */
    }
}