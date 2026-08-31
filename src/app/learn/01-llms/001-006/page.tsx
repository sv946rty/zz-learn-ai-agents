/* url - http://localhost:3000/learn/01-llms/001-006 */

import { LlmChat } from "@/components/learn/llm-chat";

export default function Page() {
  return (
    <div className="max-w-4xl">
      <p className="font-mono text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">
        Lesson 001-006
      </p>

      <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white">
        Simple LLM Chat UI
      </h1>

      <p className="mt-6 max-w-3xl text-xl leading-8 text-zinc-300">
        Send a prompt from the browser and display the model&apos;s response as
        it streams from OpenAI.
      </p>

      <LlmChat />
    </div>
  );
}
