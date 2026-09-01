"use client";

/**
 * Lesson 002-007 — Agent UI
 *
 * Goal:
 *
 * Send a browser prompt to /api/llm and display the final answer
 * produced by our server-side agent.
 *
 *
 * Unlike Lesson 001-006, the browser is NOT responsible for
 * reading a streaming HTTP response.
 *
 *
 * 001-006:
 *
 *   Browser
 *      ↓
 *   POST /api/llm
 *      ↓
 *   streaming Response
 *      ↓
 *   response.body
 *      ↓
 *   getReader()
 *      ↓
 *   TextDecoder
 *      ↓
 *   progressively update React state
 *
 *
 * 002-007:
 *
 *   Browser
 *      ↓
 *   POST /api/llm
 *      ↓
 *   SERVER-SIDE AGENT LOOP
 *      ↓
 *   Model
 *      ↓
 *   Tool(s)
 *      ↓
 *   Model
 *      ↓
 *   Tool(s)
 *      ↓
 *   ...
 *      ↓
 *   final model response
 *      ↓
 *   Response.json(...)
 *      ↓
 *   response.json()
 *      ↓
 *   data.answer
 *      ↓
 *   React UI
 *
 *
 * IMPORTANT:
 *
 * The browser does NOT:
 *
 *   - execute calculator()
 *   - execute formatFinalAnswer()
 *   - control the Agent Loop
 *   - control MAX_ITERATIONS
 *   - call OpenAI directly
 *
 * Those responsibilities remain on the server.
 */

import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * This prompt intentionally requires dependent tool calls.
 *
 * Expected conceptual flow:
 *
 *   Model
 *     ↓
 *   calculator(27 × 43)
 *     ↓
 *   1161
 *     ↓
 *   Model
 *     ↓
 *   calculator(1161 × 14)
 *     ↓
 *   16254
 *     ↓
 *   Model
 *     ↓
 *   format_final_answer(16254)
 *     ↓
 *   "The final answer is 16254."
 *     ↓
 *   Model
 *     ↓
 *   final response
 *
 * The exact number of model turns is controlled by model behavior,
 * so the observed execution should always be verified from the
 * server logs rather than assumed.
 */
const TEST_PROMPT =
  "Use the calculator to multiply 27 by 43. Then multiply that result by 14. Finally, use format_final_answer to format the final numeric result before giving me the final answer.";

/**
 * Shape of the JSON returned by /api/llm.
 *
 * NORMAL STOP:
 *
 *   {
 *     output: [...],
 *     answer: "..."
 *   }
 *
 *
 * SAFETY STOP:
 *
 *   {
 *     error: "Agent reached the maximum number of iterations.",
 *     maxIterations: 5
 *   }
 */
type AgentResponse = {
  answer?: string;
  error?: string;
  maxIterations?: number;
};

export function AgentChat() {
  /**
   * Controlled textarea value.
   */
  const [prompt, setPrompt] = useState("");

  /**
   * Final agent answer or an error message.
   */
  const [answer, setAnswer] = useState("");

  /**
   * True while the browser is waiting for the server-side
   * Agent Loop to finish.
   */
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();

    /**
     * Do not submit:
     *
     *   - an empty prompt
     *   - another request while one is already running
     */
    if (!trimmedPrompt || isLoading) {
      return;
    }

    setAnswer("");
    setIsLoading(true);

    try {
      /**
       * Send the user's prompt to our Next.js Route Handler.
       *
       * The browser does NOT call OpenAI directly.
       *
       * While this fetch() is waiting, /api/llm may perform
       * multiple model turns and multiple tool executions.
       */
      const response = await fetch("/api/llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: trimmedPrompt,
        }),
      });

      /**
       * 002-007 currently returns JSON.
       *
       * This is intentionally different from the streaming HTTP
       * response used by LlmChat in Lesson 001-006.
       */
      const data = (await response.json()) as AgentResponse;

      /**
       * fetch() does not throw automatically for HTTP errors.
       *
       * For example, our safety guard currently returns HTTP 508.
       */
      if (!response.ok) {
        throw new Error(
          data.error ??
            `Request failed: ${response.status} ${response.statusText}`,
        );
      }

      /**
       * The server-side Agent Loop has finished successfully.
       *
       * Display the final model answer.
       */
      setAnswer(data.answer ?? "");
    } catch (error) {
      console.error(error);

      setAnswer(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mt-10 max-w-3xl space-y-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6"
    >
      {/* Loading overlay while the server-side Agent Loop is running. */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/80 backdrop-blur-sm">
          <div className="flex max-w-sm flex-col items-center px-6 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-white" />

            <h3 className="mt-5 text-lg font-semibold text-white">
              Agent is working...
            </h3>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              The agent may call multiple tools before returning the final
              answer.
            </p>
          </div>
        </div>
      )}
      {/* Playground title + current agent request status. */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Agent Playground</h2>

          <p className="mt-1 text-sm leading-6 text-zinc-300">
            Send a task and let the agent decide when to use its tools.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span
            className={`h-2 w-2 rounded-full ${
              isLoading ? "animate-pulse bg-amber-400" : "bg-emerald-400"
            }`}
          />

          <span>{isLoading ? "Agent running" : "Ready"}</span>
        </div>
      </div>

      {/* Controlled prompt input. */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="agent-prompt"
            className="text-sm font-medium text-zinc-300"
          >
            Prompt
          </label>

          <span className="font-mono text-xs text-zinc-600">POST /api/llm</span>
        </div>

        <textarea
          id="agent-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Give the agent a task..."
          disabled={isLoading}
          className="min-h-36 w-full resize-y rounded-xl border border-zinc-800 bg-black/40 p-4 text-base leading-7 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
        />

        {/* Fill the textarea with our known multi-tool test prompt. */}
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="text-zinc-500">Try:</span>

          <Button
            type="button"
            variant="link"
            onClick={() => setPrompt(TEST_PROMPT)}
            disabled={isLoading}
            className="h-auto cursor-pointer p-0 text-left text-sm text-zinc-300 underline-offset-4 hover:text-white disabled:cursor-not-allowed"
          >
            {TEST_PROMPT}
          </Button>
        </div>
      </div>

      {/* Primary action. */}
      <div className="space-y-4 border-t border-zinc-800 pt-6">
        <p className="text-sm leading-6 text-zinc-300">
          The Agent Loop runs on the server and may call multiple tools before
          returning the final answer.
        </p>

        <Button
          type="submit"
          size="lg"
          disabled={isLoading || !prompt.trim()}
          className="mt-8 min-w-36 cursor-pointer border border-zinc-200 bg-white px-8 text-base font-semibold text-black shadow-sm hover:bg-zinc-200 disabled:cursor-not-allowed disabled:border-zinc-500 disabled:bg-zinc-800 disabled:text-zinc-200 disabled:opacity-100"
        >
          {isLoading ? "Agent running..." : "Run Agent"}
        </Button>
      </div>

      {/* Final agent response. */}
      {answer && (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black/40">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-200">
                AI
              </div>

              <span className="text-sm font-semibold text-zinc-200">
                Agent Response
              </span>
            </div>
          </div>

          <div className="min-h-24 px-5 py-5">
            <div className="whitespace-pre-wrap text-base leading-7 text-zinc-100">
              {answer}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
