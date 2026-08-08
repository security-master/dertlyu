import type { Metadata } from "next";
import { HistoryGrid } from "@/components/history-grid";

export const metadata: Metadata = {
  title: "My Generations",
  robots: { index: false, follow: false },
};

export default function HistoryPage() {
  return (
    <section className="section" aria-labelledby="history-title">
      <h1 className="section__title" id="history-title">
        My Generations
      </h1>
      <p className="section__lede">
        Browse images you have generated in this browser session.
      </p>
      <HistoryGrid />
    </section>
  );
}
