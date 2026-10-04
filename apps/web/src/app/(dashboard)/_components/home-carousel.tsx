"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ArrowRight, ChevronLeft, ChevronRight, GitBranch, ListTodo, Sparkles } from "lucide-react";

const slides = [
  { title: "Give your next big idea a clear direction.", description: "Connect milestones, map dependencies, and keep your team moving together.", label: "Plan your roadmap", icon: GitBranch, alt: "An illuminated blue Flowboard cloud connecting ideas across a shared workspace" },
  { title: "Make room for focused work.", description: "Turn plans into tasks, organize priorities, and see what comes next in one shared space.", label: "Explore task templates", icon: ListTodo, image: "/carousel/tasks.svg", alt: "Organized task workspace with colorful priority cards" },
  { title: "Start with a spark. Build something together.", description: "Explore collaborative templates for brainstorming, diagrams, and your team's next breakthrough.", label: "Find your starting point", icon: Sparkles, image: "/carousel/ideas.svg", alt: "Colorful brainstorming notes connected around a creative spark" },
];

const ThreePreview = dynamic(() => import("./three-template-preview"), { ssr: false });
const models = ["cloud", "tasks", "workspace"] as const;

export function HomeCarousel() {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const Icon = slide.icon;
  const move = (direction: number) => setIndex(current => (current + direction + slides.length) % slides.length);

  return <div className="home-carousel-host"><section aria-label="Workspace inspiration" aria-roledescription="carousel" className="home-carousel relative mb-8 overflow-hidden rounded-3xl border border-border bg-background/80 shadow-sm backdrop-blur-md">
    <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-32 size-96 rounded-full bg-primary/10 blur-3xl" />
    <div className="home-carousel__stage">
      <div key={`copy-${index}`} className="home-carousel__copy" aria-live="polite" aria-atomic="true">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary"><Icon size={16} aria-hidden="true" /> Your creative space</span>
        <h1 className="mt-4 max-w-lg text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{slide.title}</h1>
        <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">{slide.description}</p>
        <Link href="/templates" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">{slide.label}<ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
      <div key={`art-${index}`} className="home-carousel__art">
        <Image unoptimized src={`/models/${models[index]}.png`} alt={slide.alt} width={720} height={460} className="home-carousel__image" />
        <div className="home-carousel__model"><ThreePreview model={models[index]} /></div>
      </div>
    </div>
    <div className="home-carousel__controls relative flex items-center justify-between border-t border-border">
      <div className="flex gap-2" aria-label="Choose a slide">{slides.map((item, position) => <button key={item.label} type="button" aria-label={`Show slide ${position + 1}: ${item.label}`} aria-pressed={position === index} onClick={() => setIndex(position)} className={`h-3 rounded-full transition-all motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${position === index ? "w-8 bg-primary" : "w-3 bg-muted-foreground/30 hover:bg-muted-foreground/60"}`} />)}</div>
      <div className="flex gap-2">{[-1, 1].map(direction => <button key={direction} type="button" aria-label={direction < 0 ? "Previous slide" : "Next slide"} onClick={() => move(direction)} className="rounded-lg border border-border p-2 text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{direction < 0 ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}</button>)}</div>
    </div>
  </section></div>;
}
