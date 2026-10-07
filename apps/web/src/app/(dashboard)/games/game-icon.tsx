import { Crosshair, CircleDot, Car, Footprints, Egg, Plane, Move, Circle, Blocks, Bot, Bird, Orbit, Star, Zap, Target, Timer, Flower2, Flag, Grid3X3, CircleDashed, Hash, Palette, type LucideIcon } from "lucide-react";
import type { GameId } from "@/lib/games";
const icons: Record<GameId, LucideIcon> = {fps:Crosshair,football:CircleDot,race:Car,runner:Footprints,egg:Egg,plane:Plane,snake:Move,pong:Circle,breakout:Blocks,invaders:Bot,flappy:Bird,asteroids:Orbit,catch:Star,dodge:Zap,aim:Target,reaction:Timer,memory:Flower2,mines:Flag,tictactoe:Grid3X3,connect:CircleDashed,"2048":Hash,simon:Palette};
export function GameIcon({id,size=20}:{id:GameId;size?:number}){const Icon=icons[id];return <Icon size={size} aria-hidden="true" />;}
