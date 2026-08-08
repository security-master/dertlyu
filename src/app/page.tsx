import { GenerationForm } from "@/components/generation-form";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          AI Image Generator
        </h1>
        <p className="mt-2 text-muted-foreground">
          Describe your vision and let AI create stunning images for you.
        </p>
      </div>
      <GenerationForm />
    </div>
  );
}
