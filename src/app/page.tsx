"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChartComponent } from "@/components/charts/LineChartComponent";
import { CheckCircle2, Code2, Palette, BarChart3, Zap, FileCode, ArrowRight } from "lucide-react";

const sampleChartData = [
  { name: "Jan", performance: 65, efficiency: 78 },
  { name: "Feb", performance: 72, efficiency: 82 },
  { name: "Mar", performance: 78, efficiency: 85 },
  { name: "Apr", performance: 85, efficiency: 88 },
  { name: "May", performance: 82, efficiency: 92 },
  { name: "Jun", performance: 90, efficiency: 95 },
];

const techStack = [
  {
    icon: Code2,
    title: "Next.js 14",
    description: "App Router with React Server Components",
    version: "14.2.35",
  },
  {
    icon: FileCode,
    title: "TypeScript",
    description: "Full type safety with strict mode",
    version: "5.x",
  },
  {
    icon: Palette,
    title: "Tailwind CSS",
    description: "Utility-first CSS framework",
    version: "3.4.19",
  },
  {
    icon: Zap,
    title: "shadcn/ui",
    description: "Beautifully designed components",
    version: "latest",
  },
  {
    icon: BarChart3,
    title: "Recharts",
    description: "Composable charting library",
    version: "3.6.0",
  },
];

const workflowSteps = [
  { step: 1, name: "Plan", description: "Analyze & propose approach" },
  { step: 2, name: "Review", description: "Get feedback & refine" },
  { step: 3, name: "Accept", description: "Approve the plan" },
  { step: 4, name: "Implement", description: "Write & validate code" },
  { step: 5, name: "Verify", description: "Manual testing" },
  { step: 6, name: "Commit", description: "Version control" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFmMjkzNyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Project initialized successfully</span>
            </div>

            <h1 className="font-display bg-gradient-to-r from-white via-emerald-200 to-emerald-500 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl">
              Blueprintos
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              A modern Next.js starter with TypeScript, Tailwind CSS, shadcn/ui, and Recharts.
              Built with a structured developer workflow for quality and traceability.
            </p>

            <div className="mt-10 flex items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
              >
                <Link href="/editor">
                  Open Editor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Link href="https://github.com/RaisinBread42/blueprintos" target="_blank">
                  View on GitHub
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Tech Stack</h2>
          <p className="mt-4 text-lg text-slate-400">
            Built with modern, production-ready technologies
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {techStack.map((tech) => (
            <Card
              key={tech.title}
              className="group border-slate-800 bg-slate-900/50 backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:bg-slate-900/80"
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
                    <tech.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-white">{tech.title}</CardTitle>
                    <span className="text-xs text-emerald-500 font-mono">v{tech.version}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400">{tech.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Workflow Section */}
      <section className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Developer Workflow</h2>
          <p className="mt-4 text-lg text-slate-400">
            Structured phases ensure quality at every step
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {workflowSteps.map((step, index) => (
            <div key={step.step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 font-bold text-lg border border-emerald-500/30">
                  {step.step}
                </div>
                <span className="mt-2 text-sm font-medium text-white">{step.name}</span>
                <span className="text-xs text-slate-500 text-center max-w-24">
                  {step.description}
                </span>
              </div>
              {index < workflowSteps.length - 1 && (
                <div className="mx-4 h-0.5 w-8 bg-gradient-to-r from-emerald-500/50 to-emerald-500/20 hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Chart Demo Section */}
      <section className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Recharts Integration</h2>
          <p className="mt-4 text-lg text-slate-400">
            Beautiful, responsive charts out of the box
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Performance Metrics</CardTitle>
            <CardDescription className="text-slate-400">
              Sample chart demonstrating Recharts integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LineChartComponent
              data={sampleChartData}
              lines={[
                { dataKey: "performance", stroke: "#10b981", name: "Performance" },
                { dataKey: "efficiency", stroke: "#6366f1", name: "Efficiency" },
              ]}
              height={350}
            />
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-500">
              Built with the CLAUDE.md workflow system
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-slate-500 hover:text-emerald-500 transition-colors">
                CLAUDE.md
              </a>
              <a href="#" className="text-sm text-slate-500 hover:text-emerald-500 transition-colors">
                PROGRESS.md
              </a>
              <a href="#" className="text-sm text-slate-500 hover:text-emerald-500 transition-colors">
                features.json
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
