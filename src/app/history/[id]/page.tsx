import type { Metadata } from "next";
import { GenerationDetail } from "@/components/generation-detail";

export const metadata: Metadata = {
  title: "Generation",
  robots: { index: false, follow: false },
};

export default async function GenerationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <section className="section">
      <GenerationDetail id={id} />
    </section>
  );
}
