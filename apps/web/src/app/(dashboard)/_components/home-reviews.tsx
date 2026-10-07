"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Layers, Lightbulb, MessageCircle, Quote, Star, Users } from "lucide-react";

// Clearly marked sample content until approved customer quotes are available.
const reviews = [
  { name: "Product team", initials: "PT", category: "Planning", icon: Layers, quote: "A shared place to turn the big picture into a clear next step. Everyone can see how the pieces connect." },
  { name: "Design team", initials: "DT", category: "Design", icon: Lightbulb, quote: "Room for the messy first idea, the thoughtful discussion, and the moment it all comes together." },
  { name: "Workshop team", initials: "WT", category: "Teamwork", icon: Users, quote: "Bring every voice into the room. Capture ideas together and leave with a plan the whole team can follow." },
];

export function HomeReviews() {
  const [index, setIndex] = useState(0);
  const move = (direction: number) => setIndex(current => (current + direction + reviews.length) % reviews.length);
  return <section className="home-reviews" aria-label="Community reviews" aria-roledescription="carousel">
    <div className="home-reviews__surface">
      <div className="home-reviews__topline"><span><MessageCircle size={14} aria-hidden="true" /> COMMUNITY VOICES</span><span className="home-reviews__preview">Sample reviews · design preview</span></div>
      <div className="home-reviews__body">
        <div className="home-reviews__copy">
          <span className="home-reviews__eyebrow">A LITTLE COLLABORATION GOES A LONG WAY</span>
          <h2>Good work.<br /><em>Shared stories.</em></h2>
          <p>Great things start with people thinking together. Make space for your team’s next chapter.</p>
          <Link href="/templates">Find your starting point <ArrowUpRight size={17} aria-hidden="true" /></Link>
          <p className="home-reviews__notice">Illustrative quotes shown for this design. Customer reviews will appear here when available.</p>
        </div>
        <div className="home-reviews__showcase">
          <div className="home-reviews__phone" aria-hidden="true"><span /><i /><i /><i /></div>
          <div className="home-reviews__arrows"><button type="button" aria-label="Previous review" onClick={() => move(-1)}><ChevronLeft size={18} aria-hidden="true" /></button><button type="button" aria-label="Next review" onClick={() => move(1)}><ChevronRight size={18} aria-hidden="true" /></button></div>
          <div className="home-reviews__deck" aria-live="polite" aria-atomic="true">
            {reviews.map((review, position) => {
              const offset = position === index ? 0 : position === (index + 1) % reviews.length ? 1 : -1;
              return <figure key={review.category} className={`home-reviews__card${offset === 0 ? " is-current" : ""}`} aria-hidden={offset !== 0} style={{ transform: `translateX(calc(${offset} * (100% + 18px))) scale(${offset === 0 ? 1 : .92})` }}>
                <figcaption><span className="home-reviews__avatar">{review.initials}</span><span><strong>{review.name}</strong><small>Sample reviewer</small></span><Quote size={19} aria-hidden="true" /></figcaption>
                <div className="home-reviews__stars" aria-label="Illustrative five-star rating">{Array.from({ length: 5 }, (_, star) => <Star key={star} size={15} fill="currentColor" aria-hidden="true" />)}</div>
                <blockquote>{review.quote}</blockquote>
                <div className="home-reviews__card-footer"><span>{review.category}</span><span>Sample review</span></div>
              </figure>;
            })}
          </div>
          <span className="home-reviews__count" aria-live="polite">0{index + 1} <span>/ 03</span></span>
        </div>
      </div>
    </div>
    <div className="home-reviews__base"><div className="home-reviews__signature"><MessageCircle size={20} aria-hidden="true" /><span><strong>Made for shared ideas</strong><small>Imagine. Connect. Create.</small></span></div><div className="home-reviews__selectors">{reviews.map((review, position) => { const Icon = review.icon; return <button key={review.category} type="button" aria-label={`Show review ${position + 1}: ${review.category}`} aria-pressed={position === index} onClick={() => setIndex(position)}><Icon size={16} aria-hidden="true" />{review.category}</button>; })}</div></div>
  </section>;
}
