"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { SpatialScene } from "@/components/spatial-scene";

const slides = [
  { title: "Give your next big idea a clear direction.", short: "Roadmap", description: "Connect milestones, map dependencies, and keep your team moving together.", label: "Plan your roadmap", model: "carousel-roadmap", alt: "A porcelain and cobalt roadmap rocket floating above a brass trajectory ring" },
  { title: "Make room for focused work.", short: "Focus", description: "Turn plans into tasks, organize priorities, and see what comes next in one shared space.", label: "Explore task templates", model: "carousel-tasks", alt: "Three floating sculpted task cards with mint checkboxes and gold headings" },
  { title: "Start with a spark. Build something together.", short: "Create", description: "Explore collaborative templates for brainstorming, diagrams, and your team's next breakthrough.", label: "Find your starting point", model: "carousel-ideas", alt: "A golden idea bulb surrounded by an orbit and colorful brainstorming tiles" },
] as const;

export function HomeCarousel() {
  const [index, setIndex] = useState(0);
  const move = (direction: number) => setIndex(current => (current + direction + slides.length) % slides.length);
  return <div className="home-carousel-host">
    <section aria-label="Workspace inspiration" aria-roledescription="carousel" className="home-carousel home-carousel--sculpture">
      <div className="home-carousel__panels">
        {slides.map((slide, position) => {
          const active = position === index;
          return <div key={slide.model} className={`home-carousel__panel home-carousel__panel--${position}${active ? " is-active" : ""}`} data-active={String(active)}>
            <span className="home-carousel__number" aria-hidden="true">0{position + 1}</span>
            {active ? <div className="home-carousel__stage">
              <div className="home-carousel__copy" aria-live="polite" aria-atomic="true">
                <span className="home-carousel__eyebrow">FLOWBOARD / {slide.short.toUpperCase()}</span>
                <h1>{slide.title}</h1>
                <p>{slide.description}</p>
                <Link href="/templates">{slide.label}<ArrowRight size={16} aria-hidden="true" /></Link>
              </div>
              <SpatialScene model={slide.model} alt={slide.alt} />
              <span className="home-carousel__watermark" aria-hidden="true">{slide.short}</span>
            </div> : <button type="button" className="home-carousel__collapsed" aria-label={`Expand ${slide.short} panel`} onClick={() => setIndex(position)}>
              <span className="home-carousel__vertical">{slide.short}</span>
              <Image unoptimized src={`/models/${slide.model}.png`} width={760} height={1000} alt="" className="home-carousel__teaser" />
              <span className="home-carousel__open" aria-hidden="true"><ArrowRight size={18} /></span>
            </button>}
          </div>;
        })}
      </div>
      <div className="home-carousel__controls">
        <div className="home-carousel__pagination" aria-label="Choose a slide">{slides.map((slide, position) => <button key={slide.short} type="button" aria-label={`Show slide ${position + 1}: ${slide.label}`} aria-pressed={position === index} onClick={() => setIndex(position)}>0{position + 1}</button>)}</div>
        <span className="home-carousel__hint">A little space. Endless possibilities.</span>
        <div className="home-carousel__arrows">{[-1, 1].map(direction => <button key={direction} type="button" aria-label={direction < 0 ? "Previous slide" : "Next slide"} onClick={() => move(direction)}>{direction < 0 ? <ChevronLeft size={20} aria-hidden="true" /> : <ChevronRight size={20} aria-hidden="true" />}</button>)}</div>
      </div>
    </section>
  </div>;
}
