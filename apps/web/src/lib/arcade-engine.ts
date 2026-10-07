import type { ThreeArcade } from "./three-arcade";
import type { GameId } from "./games";
export class ArcadeEngine {
  private generation = 0;
  private engine: ThreeArcade | null = null;
  async mount(canvas: HTMLCanvasElement, id: GameId): Promise<ThreeArcade | null> {
    this.dispose();
    const generation = this.generation;
    const { ThreeArcade } = await import("./three-arcade");
    if (generation !== this.generation) return null;
    this.engine = new ThreeArcade(canvas, id);
    return this.engine;
  }
  dispose() { this.generation++; this.engine?.dispose(); this.engine = null; }
}
