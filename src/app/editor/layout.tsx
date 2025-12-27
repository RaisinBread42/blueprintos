import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Line Editor | BlueprintOS",
  description: "Visual DAG editor for service lines",
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950">
      {children}
    </div>
  );
}

