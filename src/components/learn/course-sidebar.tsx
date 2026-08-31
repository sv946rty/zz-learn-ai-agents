import Link from "next/link";

const sections = [
  { number: "01", title: "LLMs", href: "/learn/01-llms" },
  { number: "02", title: "Agents", href: "/learn/02-agents" },
  { number: "03", title: "RAG", href: "/learn/03-rag" },
  { number: "04", title: "LangGraph", href: "/learn/04-langgraph" },
  { number: "05", title: "MCP", href: "/learn/05-mcp" },
  { number: "06", title: "Build", href: "/learn/06-build" },
  { number: "07", title: "Eval", href: "/learn/07-eval" },
];

export function CourseSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-75 border-r border-zinc-800 bg-[#09090b]">
      <div className="flex h-full flex-col px-8 py-10">
        <div>
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight text-white"
          >
            AI Agent Lab
          </Link>

          <p className="mt-2 text-base text-zinc-400">Learn by building.</p>
        </div>

        <nav className="mt-12 space-y-2">
          {sections.map((section) => (
            <Link
              key={section.number}
              href={section.href}
              className="group flex items-center gap-5 rounded-lg px-4 py-3.5 text-base text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
            >
              <span className="w-7 font-mono text-sm text-zinc-500 group-hover:text-zinc-300">
                {section.number}
              </span>

              <span className="font-medium">{section.title}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-zinc-800 pt-6">
          <p className="text-sm text-zinc-500">Next.js 16.3 · OpenAI</p>
        </div>
      </div>
    </aside>
  );
}
