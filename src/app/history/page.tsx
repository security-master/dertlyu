import { HistoryGrid } from "@/components/history-grid";

export const metadata = {
  title: "My Generations | AI Image Generator",
  robots: { index: false, follow: false },
};

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">
        My Generations
      </h1>
      <HistoryGrid />
    </div>
  );
}
