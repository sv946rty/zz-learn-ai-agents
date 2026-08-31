"use client";

/**
 * Lesson 001-006 — Simple LLM Chat UI
 *
 * Goal: send a browser prompt to /api/llm and progressively render the
 * streamed HTTP response.
 *
 * Flow:
 * Browser → fetch() → /api/llm → OpenAI → TextEncoder → HTTP bytes
 * → response.body → getReader() → TextDecoder → setAnswer() → React UI
 *
 * Lesson 001-005 encoded strings into bytes on the server.
 * This lesson decodes those bytes back into strings in the browser.
 */

import { useState } from "react";

import { Button } from "@/components/ui/button";

const TEST_PROMPT =
  "Explain what a JavaScript Promise is in 5 short sentences.";

/** Teaching-only delay so incoming HTTP chunks are easier to observe. */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function LlmChat() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    // Reject empty or whitespace-only prompts.
    if (!prompt.trim()) return;

    setAnswer("");
    setIsLoading(true);

    try {
      // Send the prompt to the Next.js Route Handler.
      const response = await fetch("/api/llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      // fetch() resolves for HTTP errors, so check the status explicitly.
      if (!response.ok) {
        throw new Error(
          `Request failed: ${response.status} ${response.statusText}`,
        );
      }

      // /api/llm returns a streaming Response; without a body there is
      // nothing for the browser to read.
      if (!response.body) {
        throw new Error("Response body is missing.");
      }

      // getReader() acquires a reader; it does not read data yet.
      const reader = response.body.getReader();

      // Server: string → TextEncoder → bytes
      // Browser: bytes  → TextDecoder → string
      const decoder = new TextDecoder();

      // reader.read() waits asynchronously for each HTTP chunk and returns
      // { done, value }, where value is a Uint8Array of bytes.
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // stream:true preserves incomplete multi-byte UTF-8 characters
        // between chunks.
        const chunk = decoder.decode(value, { stream: true });

        // Functional state updates safely append each streamed chunk.
        setAnswer((current) => current + chunk);

        // Teaching delay only. One HTTP chunk is NOT guaranteed to equal
        // one word, token, OpenAI delta, or number. Remove in production.
        await sleep(200);
      }

      // Flush any bytes still buffered by TextDecoder after the stream ends.
      const finalChunk = decoder.decode();
      if (finalChunk) {
        setAnswer((current) => current + finalChunk);
      }
    } catch (error) {
      console.error(error);
      setAnswer("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 max-w-3xl space-y-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6"
    >
      {/* Playground title + React-state-driven request status. */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">LLM Playground</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-300">
            Send a prompt and watch the response stream into the browser.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span
            className={`h-2 w-2 rounded-full ${
              isLoading ? "animate-pulse bg-amber-400" : "bg-emerald-400"
            }`}
          />
          <span>{isLoading ? "Streaming" : "Ready"}</span>
        </div>
      </div>

      {/* Controlled prompt input. */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="prompt" className="text-sm font-medium text-zinc-300">
            Prompt
          </label>
          <span className="font-mono text-xs text-zinc-600">POST /api/llm</span>
        </div>

        <textarea
          id="prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ask the model something..."
          disabled={isLoading}
          className="min-h-36 w-full resize-y rounded-xl border border-zinc-800 bg-black/40 p-4 text-base leading-7 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
        />

        {/* Fills the textarea without submitting the form. */}
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="text-zinc-500">Try:</span>
          <Button
            type="button"
            variant="link"
            onClick={() => setPrompt(TEST_PROMPT)}
            disabled={isLoading}
            className="h-auto cursor-pointer p-0 text-sm text-zinc-300 underline-offset-4 hover:text-white disabled:cursor-not-allowed"
          >
            {TEST_PROMPT}
          </Button>
        </div>
      </div>

      {/* Primary action. Disabled remains visible but clearly inactive. */}
      <div className="space-y-4 border-t border-zinc-800 pt-6">
        <p className="text-sm leading-6 text-zinc-300">
          The response will appear progressively as HTTP chunks arrive.
        </p>

        <Button
          type="submit"
          size="lg"
          disabled={isLoading || !prompt.trim()}
          className="mt-8 min-w-36 cursor-pointer border border-zinc-200 bg-white px-8 text-base font-semibold text-black shadow-sm hover:bg-zinc-200 disabled:cursor-not-allowed disabled:border-zinc-500 disabled:bg-zinc-800 disabled:text-zinc-200 disabled:opacity-100"
        >
          {isLoading ? "Generating..." : "Send"}
        </Button>
      </div>

      {/* Streamed model output. whitespace-pre-wrap preserves line breaks. */}
      {answer && (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black/40">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-200">
                AI
              </div>
              <span className="text-sm font-semibold text-zinc-200">
                Response
              </span>
            </div>

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                <span>Streaming</span>
              </div>
            )}
          </div>

          <div className="min-h-24 px-5 py-5">
            <div className="whitespace-pre-wrap text-base leading-7 text-zinc-100">
              {answer}
            </div>

            {/* UI-only cursor; not part of the model response. */}
            {isLoading && (
              <span className="mt-1 inline-block h-4 w-1 animate-pulse bg-zinc-400" />
            )}
          </div>
        </div>
      )}
    </form>
  );
}
