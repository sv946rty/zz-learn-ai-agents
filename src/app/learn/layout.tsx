import { CourseSidebar } from "@/components/learn/course-sidebar";

export default function LearnLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <CourseSidebar />

      <main className="min-h-screen pl-75">
        <div className="mx-auto max-w-6xl px-16 py-20">{children}</div>
      </main>
    </div>
  );
}
