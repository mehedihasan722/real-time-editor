import Link from "next/link";
import Image from "next/image";
import { Asterisk, ArrowDown, ArrowUpRight, Layers3, MousePointer2, Shapes, Users } from "lucide-react";
import { DashboardFooter } from "../(dashboard)/_components/dashboard-footer";
import { WorkflowShowcase } from "@/components/workflow-showcase";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = { title: "A space for what’s next", description: "Turn possibilities into plans with Flowboard’s collaborative visual workspace." };

export default function WelcomePage() {
  return <div className="editorial-site">
    <a tabIndex={0} className="editorial-skip" href="#main-content">Skip to content</a>
    <header className="editorial-nav"><Link href="/welcome" className="editorial-logo" aria-label="Flowboard home">flowboard<span aria-hidden="true"><Asterisk size="1em" strokeWidth={1.2} /></span></Link><nav aria-label="Product navigation"><a href="#possibilities">Explore</a><a href="#workflow">How it works</a><Link href="/sign-in">Sign in <ArrowUpRight size={14} aria-hidden="true" /></Link></nav><ThemeToggle /></header>
    <main id="main-content">
      <section className="editorial-hero" aria-labelledby="hero-title"><div className="editorial-hero__top"><p className="editorial-kicker"><span /> THE COLLABORATIVE WORKSPACE</p><span className="editorial-hero__index">IDEAS → ACTION</span></div><h1 id="hero-title">A space for<br /><span>what’s next.</span><span className="editorial-asterisk" aria-hidden="true"><Asterisk size="1em" strokeWidth={1.2} /></span></h1><div className="editorial-hero__bottom"><p>From a small thought to a shared direction.<br />Bring your ideas, your plans, and your people together.</p><Link href="/sign-up" className="editorial-pill">Start creating <ArrowUpRight size={18} aria-hidden="true" /></Link><a href="#possibilities" className="editorial-scroll" aria-label="Explore possibilities"><ArrowDown size={23} aria-hidden="true" /></a></div></section>
      <section id="possibilities" className="editorial-possibilities" aria-labelledby="possibilities-title"><div className="editorial-section-heading"><p className="editorial-kicker">ONE WORKSPACE. MANY POSSIBILITIES.</p><h2 id="possibilities-title">Good things happen<br />when ideas connect.</h2></div><div className="editorial-projects">
        {[{model:"carousel-roadmap",title:"Give the bigger picture a direction.",label:"Plan & prioritize",color:"peach"},{model:"carousel-ideas",title:"Make room for the unexpected.",label:"Imagine & explore",color:"lilac"},{model:"carousel-tasks",title:"Get on the same page. Move together.",label:"Organize & collaborate",color:"blue"}].map(({model,title,label,color},index)=><Link href="/templates" className={`editorial-project editorial-project--${color}`} key={model}><div className="editorial-project__art"><span className="editorial-kicker">0{index+1} / {label}</span><Image src={`/models/${model}.png`} alt="" width={760} height={1000} unoptimized sizes="(max-width: 700px) 100vw, 33vw" /><span className="editorial-project__arrow"><ArrowUpRight aria-hidden="true" /></span></div><h3>{title}</h3><span className="editorial-project__meta">Explore templates <ArrowUpRight size={14} aria-hidden="true" /></span></Link>)}
      </div></section>
      <section className="editorial-principles" aria-labelledby="principles-title"><p className="editorial-kicker">LESS FRICTION. MORE FLOW.</p><h2 id="principles-title">Your thinking.<br />A little more connected.</h2><div>{[{icon:MousePointer2,title:"A canvas without corners",copy:"Sketch, write, and connect ideas in a workspace that grows with your thinking."},{icon:Users,title:"Better, together",copy:"Share a board with your organization and collaborate in the same space."},{icon:Shapes,title:"A place to begin",copy:"Start from a planning, brainstorming, or diagram template and make it yours."},{icon:Layers3,title:"Your work, in context",copy:"Keep notes, diagrams, and next steps together so the details don’t get lost."}].map(({icon:Icon,title,copy})=><article key={title}><Icon size={23} aria-hidden="true" /><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
      <WorkflowShowcase />
    </main>
    <DashboardFooter />
  </div>;
}
