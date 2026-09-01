/**
 * Lesson 002-006 — Safety Guard (Max Iterations)
 *
 * Goal:
 *
 * Add an APPLICATION-LEVEL safety boundary to our Agent Loop.
 *
 * In Lesson 002-005, our agent could:
 *
 *   Model
 *     ↓
 *   Tool(s)
 *     ↓
 *   Model
 *     ↓
 *   Tool(s)
 *     ↓
 *   Model
 *     ↓
 *   ...
 *
 * The model normally decides when it has enough information and
 * returns a final answer.
 *
 * But our APPLICATION had no hard limit on how many model turns
 * it could make.
 *
 * In this lesson we add:
 *
 *   MAX_ITERATIONS
 *
 * so the application remains in control even if the model keeps
 * requesting tools.
 *
 *
 * ============================================================
 * WHERE WE CAME FROM — LESSON 002-005
 * ============================================================
 *
 * Lesson 002-005 taught us how to handle MULTIPLE tool calls
 * from ONE model response.
 *
 * One model response can contain:
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
 *                 MODEL TURN #1
 *                       ↓
 *                response.output
 *                       ↓
 *          ┌────────────┼────────────┐
 *          ↓            ↓            ↓
 *     calculator   calculator   calculator
 *       27 × 43      81 + 19      144 ÷ 12
 *          ↓            ↓            ↓
 *        1161          100           12
 *          └────────────┼────────────┘
 *                       ↓
 *                  toolOutputs[]
 *                       ↓
 *                 MODEL TURN #2
 *                       ↓
 *                  final answer
 *
 *
 * Therefore:
 *
 *   MODEL TURNS:      2
 *
 *   TOOL CALLS:       3
 *
 *   TOOL EXECUTIONS:  3
 *
 *
 * This distinction becomes especially important in 002-006.
 *
 *
 * ============================================================
 * THE PROBLEM WITH AN UNBOUNDED AGENT LOOP
 * ============================================================
 *
 * Our previous agent used:
 *
 *   while (true) {
 *
 *       ask model what to do
 *
 *       if model is finished {
 *           return final answer
 *       }
 *
 *       execute requested tools
 *
 *       send results back
 *   }
 *
 *
 * Normally this works.
 *
 * The model eventually returns a response containing:
 *
 *   ZERO function_calls
 *
 * and our application exits normally.
 *
 *
 * But notice something important:
 *
 *   while (true)
 *
 * itself contains NO application-level upper bound.
 *
 *
 * If the model continues requesting tools, our application can
 * continue making additional model calls.
 *
 *
 * More precisely:
 *
 * Without an explicit iteration limit, the agent has no
 * APPLICATION-LEVEL bound on how many model/tool cycles it may
 * attempt before giving up.
 *
 *
 * ============================================================
 * "SHOULDN'T THE MODEL BE SMART ENOUGH TO STOP?"
 * ============================================================
 *
 * Usually, YES.
 *
 * A capable model will normally recognize when the task has been
 * completed and return a final answer.
 *
 *
 * For example:
 *
 *   MODEL TURN #1
 *
 *       calculator(27, 43)
 *
 *           ↓
 *
 *         1161
 *
 *           ↓
 *
 *   MODEL TURN #2
 *
 *       "I have the result."
 *
 *           ↓
 *
 *       final answer
 *
 *           ↓
 *
 *          STOP
 *
 *
 * That is the NORMAL exit path.
 *
 *
 * But there is an important engineering principle:
 *
 *   We EXPECT the model to stop.
 *
 *              ≠
 *
 *   We GUARANTEE the model will stop.
 *
 *
 * Model behavior is probabilistic.
 *
 * Application safety should have deterministic boundaries.
 *
 *
 * Therefore:
 *
 *   MODEL
 *     ↓
 *   decides what to do
 *
 *
 *   APPLICATION
 *     ↓
 *   decides what is allowed
 *
 *
 * The model may decide:
 *
 *   "I need another tool."
 *
 * But the application can still decide:
 *
 *   "You have reached the maximum number of model turns."
 *
 *
 * ============================================================
 * REALISTIC EXAMPLE #1 — SEARCH LOOP
 * ============================================================
 *
 * Imagine a future agent with:
 *
 *   searchDatabase(query)
 *
 *
 * The user asks:
 *
 *   "Find John's customer record and tell me his current plan."
 *
 *
 * But John does not exist in the database.
 *
 *
 * The agent might reasonably do:
 *
 *   MODEL TURN #1
 *       ↓
 *   searchDatabase("John")
 *       ↓
 *   no results
 *
 *
 *   MODEL TURN #2
 *       ↓
 *   searchDatabase("John customer")
 *       ↓
 *   no results
 *
 *
 *   MODEL TURN #3
 *       ↓
 *   searchDatabase("John account")
 *       ↓
 *   no results
 *
 *
 *   MODEL TURN #4
 *       ↓
 *   "Maybe I should try another query..."
 *
 *
 * Each individual decision may seem reasonable.
 *
 * But the requested goal remains unsatisfied.
 *
 * Without an application-level limit, the model may continue
 * trying alternative searches for more turns than we want.
 *
 *
 * ============================================================
 * REALISTIC EXAMPLE #2 — STATUS / POLLING LOOP
 * ============================================================
 *
 * Imagine another tool:
 *
 *   checkJobStatus()
 *
 *
 * The user asks:
 *
 *   "Wait until the report is finished, then summarize it."
 *
 *
 * The external job might be stuck:
 *
 *   MODEL TURN #1
 *       ↓
 *   checkJobStatus()
 *       ↓
 *   "processing"
 *
 *
 *   MODEL TURN #2
 *       ↓
 *   checkJobStatus()
 *       ↓
 *   "processing"
 *
 *
 *   MODEL TURN #3
 *       ↓
 *   checkJobStatus()
 *       ↓
 *   "processing"
 *
 *
 *   MODEL TURN #4
 *       ↓
 *   checkJobStatus()
 *       ↓
 *   "processing"
 *
 *
 *   ...
 *
 *
 * The model's reasoning is understandable:
 *
 *   "The job is still processing, so check again."
 *
 *
 * But if the external job never completes, the tool keeps
 * returning the same state.
 *
 * Our application needs its own stopping rule.
 *
 *
 * ============================================================
 * REALISTIC EXAMPLE #3 — RECOVERY / CYCLING LOOP
 * ============================================================
 *
 * Imagine an agent with:
 *
 *   fetchCustomer(...)
 *
 * and:
 *
 *   searchCustomer(...)
 *
 *
 * It could accidentally cycle:
 *
 *   MODEL
 *     ↓
 *   fetchCustomer("123")
 *     ↓
 *   ERROR: customer not found
 *     ↓
 *
 *   MODEL
 *     ↓
 *   searchCustomer("123")
 *     ↓
 *   no matches
 *     ↓
 *
 *   MODEL
 *     ↓
 *   fetchCustomer("123")
 *     ↓
 *   ERROR
 *     ↓
 *
 *   MODEL
 *     ↓
 *   searchCustomer("123")
 *     ↓
 *   no matches
 *     ↓
 *
 *   ...
 *
 *
 * Locally, each recovery decision may look plausible:
 *
 *   fetch failed
 *       ↓
 *   try search
 *
 *   search failed
 *       ↓
 *   maybe try fetch again
 *
 *
 * But globally the agent is cycling:
 *
 *   A → B → A → B → A → B → ...
 *
 *
 * A maximum iteration count gives the application a hard
 * boundary around this behavior.
 *
 *
 * ============================================================
 * IMPORTANT — "FOREVER" IS SHORTHAND
 * ============================================================
 *
 * When we say:
 *
 *   "The agent could run forever"
 *
 * we do NOT necessarily mean that the process would literally
 * execute for eternity.
 *
 *
 * Other infrastructure may eventually stop it:
 *
 *   - HTTP request timeout
 *
 *   - API/network failure
 *
 *   - rate limit
 *
 *   - process termination
 *
 *   - context/token limits
 *
 *   - infrastructure timeout
 *
 *
 * But those are NOT the same thing as deliberately designing an
 * application-level safety boundary.
 *
 *
 * The more precise statement is:
 *
 *   Without an explicit iteration limit, our agent has no
 *   application-level bound on how many model/tool cycles it
 *   may attempt before giving up.
 *
 *
 * ============================================================
 * WHAT WE ADD IN LESSON 002-006
 * ============================================================
 *
 * We define:
 *
 *   const MAX_ITERATIONS = 5;
 *
 *
 * Then instead of:
 *
 *   while (true)
 *
 *
 * we use a bounded outer loop:
 *
 *   for (
 *       let iteration = 1;
 *       iteration <= MAX_ITERATIONS;
 *       iteration++
 *   )
 *
 *
 * Conceptually:
 *
 *   MODEL TURN #1   ✓
 *
 *   MODEL TURN #2   ✓
 *
 *   MODEL TURN #3   ✓
 *
 *   MODEL TURN #4   ✓
 *
 *   MODEL TURN #5   ✓
 *
 *   MODEL TURN #6   ✗
 *
 *
 * After five model turns, the loop ends.
 *
 * If the model still has not produced a final answer, our
 * application returns a safety response.
 *
 *
 * ============================================================
 * TWO DIFFERENT WAYS THE AGENT CAN STOP
 * ============================================================
 *
 * We now have TWO termination paths.
 *
 *
 * ------------------------------------------------------------
 * NORMAL STOP
 * ------------------------------------------------------------
 *
 * The model returns ZERO function_calls:
 *
 *   toolCalls.length === 0
 *
 *       ↓
 *
 *   model is finished
 *
 *       ↓
 *
 *   return final answer
 *
 *       ↓
 *
 *   HTTP 200
 *
 *
 * Example:
 *
 *   iteration 1/5
 *       ↓
 *   model requests calculator
 *       ↓
 *   execute calculator
 *
 *
 *   iteration 2/5
 *       ↓
 *   model returns final answer
 *       ↓
 *   toolCalls.length === 0
 *       ↓
 *   NORMAL STOP
 *
 *
 * ------------------------------------------------------------
 * SAFETY STOP
 * ------------------------------------------------------------
 *
 * The model continues requesting tools through every allowed
 * model iteration:
 *
 *   iteration 1/5
 *       ↓
 *   tools requested
 *
 *   iteration 2/5
 *       ↓
 *   tools requested
 *
 *   iteration 3/5
 *       ↓
 *   tools requested
 *
 *   iteration 4/5
 *       ↓
 *   tools requested
 *
 *   iteration 5/5
 *       ↓
 *   tools requested
 *
 *       ↓
 *
 *   for loop ends
 *
 *       ↓
 *
 *   SAFETY STOP
 *
 *       ↓
 *
 *   HTTP 508
 *
 *
 * ============================================================
 * VERY IMPORTANT — WHAT DOES MAX_ITERATIONS COUNT?
 * ============================================================
 *
 * MAX_ITERATIONS counts:
 *
 *   MODEL TURNS
 *
 *
 * It does NOT count:
 *
 *   TOOL CALLS
 *
 *
 * Why?
 *
 * Because:
 *
 *   openai.responses.create(...)
 *
 * happens ONCE per OUTER loop iteration.
 *
 *
 * Therefore:
 *
 *   ONE outer-loop iteration
 *
 *       ↓
 *
 *   ONE openai.responses.create(...)
 *
 *       ↓
 *
 *   ONE MODEL CALL / MODEL TURN
 *
 *
 * But ONE model response can contain MULTIPLE tool calls.
 *
 *
 * Example:
 *
 *                ITERATION 1/5
 *
 *                       ↓
 *
 *                  MODEL TURN
 *
 *                       ↓
 *
 *            ┌──────────┼──────────┐
 *            ↓          ↓          ↓
 *          Tool #1    Tool #2    Tool #3
 *            ↓          ↓          ↓
 *          1161        100         12
 *
 *
 * Therefore:
 *
 *   MODEL ITERATIONS:  1
 *
 *   TOOL CALLS:        3
 *
 *   TOOL EXECUTIONS:   3
 *
 *
 * This is perfectly valid.
 *
 *
 * MAX_ITERATIONS = 5 does NOT mean:
 *
 *   "The agent may execute only five tools."
 *
 *
 * It means:
 *
 *   "The agent may make at most five model calls inside this
 *    request."
 *
 *
 * ============================================================
 * OUTER LOOP vs INNER LOOP
 * ============================================================
 *
 * Our architecture now contains TWO bounded/different loops.
 *
 *
 * OUTER LOOP:
 *
 *   for (
 *       let iteration = 1;
 *       iteration <= MAX_ITERATIONS;
 *       iteration++
 *   )
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
 *   handles TOOL CALLS from the CURRENT model response
 *
 *
 * The easiest way to remember:
 *
 *   OUTER for = MODEL TURNS
 *
 *   INNER for = TOOL CALLS inside CURRENT MODEL TURN
 *
 *
 * Or ask:
 *
 *   OUTER:
 *   "Does the MODEL get another turn?"
 *
 *
 *   INNER:
 *   "How many tool requests did THIS model turn give us?"
 *
 *
 * ============================================================
 * WHY THE SAFETY GUARD BELONGS ON THE OUTER LOOP
 * ============================================================
 *
 * Suppose one model response requests:
 *
 *   calculator(27, 43)
 *
 *   calculator(81, 19)
 *
 *   calculator(144, 12)
 *
 *
 * We want ALL THREE calls to execute.
 *
 *
 * It would be incorrect for:
 *
 *   MAX_ITERATIONS = 1
 *
 * to stop after calculator call #1.
 *
 *
 * The current model turn already requested all three tools.
 *
 * The application should execute the entire batch:
 *
 *   Tool #1 ✓
 *
 *   Tool #2 ✓
 *
 *   Tool #3 ✓
 *
 *
 * The safety question is asked before giving the MODEL another
 * turn.
 *
 *
 * Therefore the safety boundary belongs around MODEL TURNS,
 * not around individual tool calls.
 *
 *
 * ============================================================
 * MAX_ITERATIONS IS A BUDGET, NOT A TARGET
 * ============================================================
 *
 * MAX_ITERATIONS = 5 does NOT mean:
 *
 *   "Run the model exactly five times."
 *
 *
 * It means:
 *
 *   "The model may run UP TO five times."
 *
 *
 * If the task finishes on model turn #2:
 *
 *   iteration 1/5
 *       ↓
 *   tools
 *
 *   iteration 2/5
 *       ↓
 *   final answer
 *       ↓
 *   STOP
 *
 *
 * We do NOT continue with:
 *
 *   iteration 3
 *   iteration 4
 *   iteration 5
 *
 *
 * because:
 *
 *   return Response.json(...)
 *
 * immediately ends POST().
 *
 *
 * ============================================================
 * WHY USE A for LOOP INSTEAD OF while (true)?
 * ============================================================
 *
 * We could technically keep:
 *
 *   while (true)
 *
 * and manually maintain a counter.
 *
 *
 * For example:
 *
 *   let iteration = 0;
 *
 *   while (true) {
 *
 *       iteration++;
 *
 *       if (iteration > MAX_ITERATIONS) {
 *           ...
 *       }
 *   }
 *
 *
 * But for this lesson, a bounded for loop expresses the policy
 * more clearly:
 *
 *   for (
 *       let iteration = 1;
 *       iteration <= MAX_ITERATIONS;
 *       iteration++
 *   )
 *
 *
 * The maximum number of model turns is visible directly in the
 * loop condition.
 *
 *
 * ============================================================
 * IMPORTANT — THE LAST ALLOWED TURN IS STILL A REAL TURN
 * ============================================================
 *
 * Suppose:
 *
 *   MAX_ITERATIONS = 5
 *
 *
 * Model turn #5 is still allowed to complete normally.
 *
 *
 * If model turn #5 returns:
 *
 *   ZERO function_calls
 *
 *
 * then:
 *
 *   toolCalls.length === 0
 *
 *       ↓
 *
 *   return final answer
 *
 *       ↓
 *
 *   NORMAL STOP
 *
 *
 * We do NOT trigger the safety response merely because:
 *
 *   iteration === MAX_ITERATIONS
 *
 *
 * The safety response happens only AFTER all allowed iterations
 * have completed without a final answer.
 *
 *
 * ============================================================
 * WHY THE SAFETY RESPONSE IS AFTER THE for LOOP
 * ============================================================
 *
 * Inside the loop there are two possibilities:
 *
 *   1. model is finished
 *
 *          ↓
 *
 *      return final answer
 *
 *
 *   2. model requests more tools
 *
 *          ↓
 *
 *      execute tools
 *
 *          ↓
 *
 *      prepare next model input
 *
 *
 * If case #2 happens on the LAST allowed iteration, execution
 * reaches the bottom of the loop.
 *
 *
 * Then:
 *
 *   iteration++
 *
 * makes the loop condition fail.
 *
 *
 * Control exits the for loop and reaches:
 *
 *   return Response.json(
 *       {
 *           error:
 *               "Agent reached the maximum number of iterations."
 *       },
 *       {
 *           status: 508
 *       }
 *   );
 *
 *
 * That location is important.
 *
 * It means:
 *
 *   "We used every allowed model turn and STILL did not reach
 *    the normal completion condition."
 *
 *
 * ============================================================
 * TOOL SCOPE — STILL CALCULATOR ONLY
 * ============================================================
 *
 * Lesson 002-003 created:
 *
 *   calculator
 *
 * and:
 *
 *   format_final_answer
 *
 *
 * But 002-006 still exposes ONLY:
 *
 *   calculator
 *
 *
 * We are intentionally NOT adding another tool in this lesson.
 *
 *
 * Why?
 *
 * Because 002-006 should introduce exactly one major new idea:
 *
 *   APPLICATION-LEVEL ITERATION SAFETY
 *
 *
 * We will reconsider richer tool behavior when we build the
 * full Agent UI in Lesson 002-007.
 *
 *
 * ============================================================
 * NORMAL-BEHAVIOR TEST
 * ============================================================
 *
 * Keep:
 *
 *   const MAX_ITERATIONS = 5;
 *
 *
 * Then run:
 *
 * curl -X POST http://localhost:3000/api/llm \
 *   -H "Content-Type: application/json" \
 *   -d '{"prompt":"Use the calculator to calculate these three independent calculations: 27 multiplied by 43, 81 plus 19, and 144 divided by 12. Use the calculator for all three calculations before giving me the final answers."}'
 *
 *
 * We observed:
 *
 *   Agent iteration 1/5
 *
 *       ↓
 *
 *   Number of tool calls requested: 3
 *
 *       ↓
 *
 *   calculator(27, 43)
 *       → 1161
 *
 *   calculator(81, 19)
 *       → 100
 *
 *   calculator(144, 12)
 *       → 12
 *
 *       ↓
 *
 *   Agent iteration 2/5
 *
 *       ↓
 *
 *   Number of tool calls requested: 0
 *
 *       ↓
 *
 *   final answer
 *
 *       ↓
 *
 *   HTTP 200
 *
 *
 * This proves that adding the safety guard did NOT break the
 * normal multiple-tool-call Agent Loop.
 *
 *
 * ============================================================
 * DETERMINISTIC SAFETY-GUARD TEST
 * ============================================================
 *
 * We should NOT test the safety guard by hoping that the model
 * accidentally gets stuck.
 *
 * That would make the test nondeterministic.
 *
 *
 * Instead, temporarily change:
 *
 *   const MAX_ITERATIONS = 5;
 *
 * to:
 *
 *   const MAX_ITERATIONS = 1;
 *
 *
 * Then run the SAME known-good test.
 *
 *
 * We already know this task normally needs:
 *
 *   MODEL TURN #1
 *       ↓
 *   three calculator calls
 *
 *       ↓
 *
 *   MODEL TURN #2
 *       ↓
 *   final answer
 *
 *
 * But MAX_ITERATIONS = 1 allows only MODEL TURN #1.
 *
 *
 * Our actual test produced:
 *
 *   Number of tool calls requested: 3
 *
 *   calculator(27, 43)
 *       → 1161
 *
 *   calculator(81, 19)
 *       → 100
 *
 *   calculator(144, 12)
 *       → 12
 *
 *   Safety stop:
 *   agent reached the maximum of 1 iterations.
 *
 *   HTTP 508
 *
 *
 * This proves:
 *
 *   ✓ the first model turn was allowed
 *
 *   ✓ all THREE tool calls in that turn were executed
 *
 *   ✓ the application did NOT allow model turn #2
 *
 *   ✓ the safety response executed
 *
 *   ✓ MAX_ITERATIONS limits MODEL TURNS, not TOOL CALLS
 *
 *
 * After the test, restore:
 *
 *   const MAX_ITERATIONS = 5;
 *
 *
 * ============================================================
 * NORMAL STOP vs SAFETY STOP
 * ============================================================
 *
 * NORMAL:
 *
 *   Model
 *     ↓
 *   Tool(s)
 *     ↓
 *   Model
 *     ↓
 *   no function_calls
 *     ↓
 *   final answer
 *     ↓
 *   HTTP 200
 *
 *
 * SAFETY:
 *
 *   Model
 *     ↓
 *   Tool(s)
 *     ↓
 *   Model
 *     ↓
 *   Tool(s)
 *     ↓
 *   ...
 *     ↓
 *   MAX_ITERATIONS exhausted
 *     ↓
 *   HTTP 508
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
 *   ✓ preserving the Agent Loop from 002-004
 *
 *   ✓ preserving multiple tool calls from 002-005
 *
 *   ✓ collecting all function_calls with .filter()
 *
 *   ✓ executing every tool call with for...of
 *
 *   ✓ creating one function_call_output per tool call
 *
 *   ✓ preserving every call_id
 *
 *   ✓ sending all tool outputs back together
 *
 *   ✓ connecting model turns with previous_response_id
 *
 *   ✓ stopping normally when toolCalls.length === 0
 *
 *   ✓ limiting the number of MODEL TURNS
 *
 *   ✓ returning a safety response when the limit is exhausted
 *
 *
 * We are NOT yet:
 *
 *   ✗ exposing format_final_answer
 *
 *   ✗ building the full Agent UI
 *
 *
 * ============================================================
 * COMPLETE 002-006 CONTROL FLOW
 * ============================================================
 *
 *                 USER PROMPT
 *                      ↓
 *
 *              iteration = 1
 *                      ↓
 *
 *                   MODEL
 *                      ↓
 *
 *               response.output
 *                      ↓
 *
 *             collect toolCalls[]
 *                      ↓
 *
 *              ┌───────┴───────┐
 *              │               │
 *          ZERO calls       1+ calls
 *              │               │
 *              ↓               ↓
 *        FINAL ANSWER       for...of
 *              │               │
 *              ↓          execute ALL
 *          HTTP 200            │
 *                              ↓
 *                         toolOutputs[]
 *                              │
 *                              ↓
 *                    previousResponseId
 *                              +
 *                         toolOutputs[]
 *                              │
 *                              ↓
 *                     another iteration?
 *                              │
 *                   ┌──────────┴──────────┐
 *                   │                     │
 *                  YES                    NO
 *                   │                     │
 *                   ↓                     ↓
 *             NEXT MODEL TURN        SAFETY STOP
 *                                         │
 *                                         ↓
 *                                      HTTP 508
 *
 *
 * ============================================================
 * KEY LESSON
 * ============================================================
 *
 * The model decides:
 *
 *   "What should I do next?"
 *
 *
 * The application decides:
 *
 *   "How long am I willing to let this continue?"
 *
 *
 * Therefore:
 *
 *   Agent = Model + Tools + Control Loop
 *
 *
 * But a production-minded control loop also needs:
 *
 *   BOUNDARIES
 *
 *
 * So we can think of 002-006 as:
 *
 *   Agent
 *     =
 *   Model
 *     +
 *   Tools
 *     +
 *   Control Loop
 *     +
 *   Safety Boundary
 *
 *
 * ============================================================
 * DEFINITION OF DONE
 * ============================================================
 *
 * Lesson 002-006 is complete when:
 *
 *   ✓ MAX_ITERATIONS exists
 *
 *   ✓ the outer loop is bounded
 *
 *   ✓ one outer iteration equals one model turn
 *
 *   ✓ multiple tool calls can still execute inside one turn
 *
 *   ✓ MAX_ITERATIONS does NOT count individual tool calls
 *
 *   ✓ the model can still finish normally before the limit
 *
 *   ✓ the final allowed model turn can still return normally
 *
 *   ✓ exhausting the model-turn budget triggers a safety stop
 *
 *   ✓ the safety stop returns HTTP 508
 *
 *   ✓ MAX_ITERATIONS = 5 passes the normal behavior test
 *
 *   ✓ temporary MAX_ITERATIONS = 1 triggers the safety test
 *
 *   ✓ MAX_ITERATIONS is restored to 5 after testing
 *
 *
 * ============================================================
 * NEXT LESSON
 * ============================================================
 *
 * Lesson 002-007 — Agent UI
 *
 * We now have the important server-side pieces:
 *
 *   Model
 *     +
 *   Tool Calling
 *     +
 *   Tool Execution
 *     +
 *   Agent Loop
 *     +
 *   Multiple Tool Calls
 *     +
 *   Safety Guard
 *
 *
 * Next we will bring these pieces together into the full
 * interactive Agent UI.
 */

import OpenAI from "openai";

import {
    calculator,
    type CalculatorOperation,
} from "@/lib/tools/calculator";

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
 * TOOL DEFINITION
 *
 * Lesson 002-006 intentionally continues exposing only:
 *
 *   calculator
 *
 * The new concept in this lesson is the safety boundary around
 * MODEL TURNS, not adding another tool type.
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

        /**
         * STEP 4 — Prepare to collect ALL tool results from THIS
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
         * IMPORTANT FOR 002-006:
         *
         * All three calls belong to the SAME model iteration.
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
             * STEP 5A — Protect the tool boundary.
             *
             * 002-006 still exposes only calculator.
             */
            if (toolCall.name !== "calculator") {
                throw new Error(
                    `Unknown tool requested: ${toolCall.name}`
                );
            }

            /**
             * STEP 5B — Parse THIS calculator call's arguments.
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
             * The TypeScript "as" assertion describes the expected
             * compile-time shape.
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
             * STEP 5D — Create the function_call_output for THIS
             * tool request.
             *
             * Preserve the SAME call_id:
             *
             *   function_call
             *
             *       call_id: call_A
             *
             *           ↓
             *
             *   function_call_output
             *
             *       call_id: call_A
             *
             *
             * call_id links a specific TOOL REQUEST to its result.
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
             * STEP 5E — Save this result in the current batch.
             *
             * If the model requested three tools:
             *
             *   toolOutputs
             *       ↓
             *   [
             *       output #1,
             *       output #2,
             *       output #3
             *   ]
             *
             *
             * Again:
             *
             * THREE tool executions can still equal ONE model
             * iteration.
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