import Link from "next/link";
import { GenerateForm } from "@/components/generate-form";

export default function HomePage() {
  return (
    <>
      <section className="hero" aria-labelledby="brand-title">
        <p className="hero__brand" id="brand-title">
          Dertlyu
        </p>
        <h1 className="hero__headline">Turn prompts into lasting images.</h1>
        <p className="hero__lede">
          Describe a scene, choose style and size, then generate. Your results
          are stored for download and history.
        </p>
        <div className="hero__cta">
          <a className="btn btn-primary" href="#studio">
            Start generating
          </a>
          <Link className="btn btn-ghost" href="/history">
            View history
          </Link>
        </div>
      </section>

      <section id="studio" className="section" aria-labelledby="studio-title">
        <h2 className="section__title" id="studio-title">
          Studio
        </h2>
        <p className="section__lede">
          One prompt. Clear controls. Provider-agnostic generation behind the
          scenes.
        </p>
        <GenerateForm />
      </section>
    </>
  );
}
