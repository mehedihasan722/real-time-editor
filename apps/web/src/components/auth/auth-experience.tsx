"use client";

import Link from "next/link";
import { SignIn, SignUp } from "@clerk/nextjs";
import { ArrowUpRight, Layers3, Sparkles, Users, LockKeyhole } from "lucide-react";
import { SpatialScene } from "@/components/spatial-scene";

const appearance = {
  variables: { colorPrimary: "#6773ff", colorPrimaryForeground: "#ffffff", colorBackground: "#10162d", colorForeground: "#f0f3ff", colorMutedForeground: "#aebada", colorNeutral: "#f0f3ff", colorInput: "#090f24", colorInputForeground: "#f0f3ff", borderRadius: "0.75rem" },
  elements: { rootBox: "auth-clerk-root", cardBox: "auth-clerk-box", card: "auth-clerk-card", header: "auth-clerk-header", footer: "auth-clerk-footer", socialButtonsBlockButton: "auth-social-button", formButtonPrimary: "auth-primary-button", formFieldInput: "auth-field-input" },
};

export function AuthExperience({ mode = "sign-in", configured }: { mode?: "sign-in" | "sign-up"; configured: boolean }) {
  const signIn = mode === "sign-in";
  return <main className="auth-experience spatial-site">
    <div className="auth-experience__glow" aria-hidden="true" />
    <header className="auth-experience__nav"><Link href="/" className="spatial-brand"><span><Layers3 size={23} aria-hidden="true" /></span>Flowboard<span className="spatial-brand__dot">.</span></Link><Link href={signIn ? "/sign-up" : "/sign-in"} className="auth-experience__switch">{signIn ? "New here?" : "Already a member?"}<strong>{signIn ? "Create an account" : "Sign in"}</strong><ArrowUpRight size={15} aria-hidden="true" /></Link></header>
    <div className="auth-experience__grid">
      <section className="auth-experience__story" aria-label="Welcome to Flowboard"><p className="spatial-eyebrow"><span /> YOUR IDEAS, CONNECTED</p><h1>Big ideas.<br /><span>One shared space.</span></h1><p className="auth-experience__intro">Bring your team, your plans, and your next breakthrough together. Make room for what comes next.</p><SpatialScene />
        <div className="auth-experience__features"><span><Layers3 size={16} aria-hidden="true" /> Visual boards</span><span><Users size={16} aria-hidden="true" /> Team collaboration</span><span><Sparkles size={16} aria-hidden="true" /> AI assistance</span></div>
      </section>
      <section className="auth-experience__form" aria-label={signIn ? "Sign in to Flowboard" : "Create your Flowboard account"}><div className="auth-experience__form-heading"><span className="auth-experience__form-icon"><LockKeyhole size={22} aria-hidden="true" /></span><p className="spatial-eyebrow">YOUR CREATIVE WORKSPACE</p><h2>{signIn ? "Welcome back." : "Start something great."}</h2><p>{signIn ? "Sign in and pick up where your ideas left off." : "Create your account and bring your ideas to life."}</p></div>
        {configured ? signIn ? <SignIn appearance={appearance} routing="path" path="/sign-in" signUpUrl="/sign-up" /> : <SignUp appearance={appearance} routing="path" path="/sign-up" signInUrl="/sign-in" /> : <div className="auth-experience__pending" role="status"><strong>Your workspace is almost ready.</strong><p>Account access is being configured. Please check back soon or contact your workspace administrator.</p><Link href={signIn ? "/sign-up" : "/sign-in"}>{signIn ? "Explore account creation" : "Back to sign in"}<ArrowUpRight size={15} aria-hidden="true" /></Link></div>}
        <p className="auth-experience__security"><LockKeyhole size={13} aria-hidden="true" /> Your boards stay connected to your team.</p>
      </section>
    </div><footer className="auth-experience__footer"><span>Flowboard — a little space for your next big idea.</span><span>Plan. Create. Move forward.</span></footer>
  </main>;
}
