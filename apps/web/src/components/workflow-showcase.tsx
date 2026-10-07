import Link from "next/link";
import { ArrowUpRight, Lightbulb, Network, PackageCheck } from "lucide-react";
import { SpatialScene } from "./spatial-scene";

export function WorkflowShowcase() {
  return <section id="workflow" className="workflow-showcase" aria-labelledby="workflow-title">
    <div className="workflow-showcase__heading"><p className="editorial-kicker">FROM THE FIRST SPARK TO THE NEXT STEP</p><h2 id="workflow-title">Great ideas.<br /><span>Always in motion.</span></h2><p>A shared space to connect the dots, build a plan, and move forward together.</p></div>
    <div className="workflow-showcase__scene"><SpatialScene model="workflow" alt="An isometric Flowboard workshop: idea cards travel along conveyors between a planning board, collaborators, template shelves, and a delivery station" /></div>
    <div className="workflow-showcase__steps">
      {[{icon:Lightbulb,title:"01 / Imagine",copy:"Get every possibility out of your head and onto a board."},{icon:Network,title:"02 / Connect",copy:"Map the work. Add context. Bring your team into the picture."},{icon:PackageCheck,title:"03 / Make it happen",copy:"Turn a shared direction into clear, achievable next steps."}].map(({icon:Icon,title,copy})=><div key={title}><Icon size={22} aria-hidden="true" /><h3>{title}</h3><p>{copy}</p></div>)}
    </div>
    <Link className="editorial-text-link" href="/templates">Build your workflow <ArrowUpRight size={19} aria-hidden="true" /></Link>
  </section>;
}
