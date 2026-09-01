/* url - http://localhost:3000/learn/02-agents/002-007 */

import { AgentChat } from "@/components/learn/agent-chat";

export default function Page() {
  return (
    <div className="max-w-4xl">
      <p className="font-mono text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">
        Lesson 002-007
      </p>

      <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white">
        Agent UI
      </h1>

      <p className="mt-6 max-w-3xl text-xl leading-8 text-zinc-300">
        Give the agent a task and let the server-side Agent Loop decide when to
        use tools before returning the final answer.
      </p>

      <AgentChat />
    </div>
  );
}
