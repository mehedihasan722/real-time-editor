import { GameId } from "./games";
import { eggCluster } from "./game-rules";
const W = 720, H = 440;
const colors = ["#a78bfa", "#34d399", "#fb7185", "#fbbf24", "#38bdf8"];
const random = (low: number, high: number) => low + Math.random() * (high - low);
type Body = { x: number; y: number; vx: number; vy: number; r: number; kind?: number };
export class ArcadeWorld {
  score = 0; lives = 3; time = 0; over = false; won = false; message = "";
  x = 360; y = 370; vx = 210; vy = -210; angle = -Math.PI / 2;
  lane = 1; jump = 0; duck = 0; timer = 0; cooldown = 0; round = 0; wait = 0; ready = false;
  objects: Body[] = []; shots: Body[] = []; snake = [[9, 10], [8, 10], [7, 10]]; direction = [1, 0]; nextDirection = [1, 0]; food = [15, 10]; grid: number[] = []; egg = 0;
  constructor(public id: GameId) {
    if (id === "pong") { this.x = 360; this.y = 220; this.angle = 220; this.wait = 220; }
    if (id === "breakout") { this.y = 320; this.angle = 360; this.grid = Array(50).fill(1); }
    if (id === "invaders") this.objects = Array.from({ length: 32 }, (_, i) => ({ x: 120 + i % 8 * 60, y: 55 + Math.floor(i / 8) * 40, vx: 28, vy: 0, r: 14 }));
    if (id === "egg") { this.grid = Array.from({ length: 100 }, (_, i) => i < 40 ? Math.floor(random(0, 5)) : -1); this.egg = Math.floor(random(0, 5)); }
    if (id === "asteroids") { this.y = 220; this.vx = 0; this.vy = 0; this.jump = 2; this.objects = Array.from({ length: 7 }, () => ({ x: random(0, W), y: random(0, H), vx: random(-70, 70), vy: random(-70, 70), r: random(18, 35) })); }
    if (id === "flappy") { this.x = 160; this.y = 200; this.vy = 0; }
    if (id === "reaction") this.wait = random(1.5, 4);
    if (id === "football") this.message = "Aim past the goalkeeper. 10 shots.";
  }
  end(won = false) { this.over = true; this.won = won; }
  hit() { this.lives--; if (this.lives <= 0) this.end(); }
  input(key: string) {
    if (this.over) return;
    if (this.id === "race" || this.id === "runner") {
      if (key === "ArrowLeft") this.lane = Math.max(0, this.lane - 1);
      if (key === "ArrowRight") this.lane = Math.min(2, this.lane + 1);
      if (this.id === "runner" && (key === " " || key === "ArrowUp")) this.jump = .8;
      if (this.id === "runner" && key === "ArrowDown") this.duck = .8;
    }
    if (this.id === "snake") {
      const next = key === "ArrowLeft" ? [-1, 0] : key === "ArrowRight" ? [1, 0] : key === "ArrowUp" ? [0, -1] : key === "ArrowDown" ? [0, 1] : null;
      if (next && (next[0] !== -this.direction[0] || next[1] !== -this.direction[1])) this.nextDirection = next;
    }
    if ((key === " " || key === "ArrowUp") && this.id === "flappy") this.vy = -235;
    if (key === " " && this.id === "reaction") {
      if (!this.ready) { this.message = "Too early! Wait for green."; this.wait = this.time + random(1.5, 4); return; }
      const ms = Math.round((this.time - this.wait) * 1000); this.score += Math.max(0, 1000 - ms); this.round++; this.message = `${ms} ms · Round ${this.round}/5`; this.ready = false; this.wait = this.time + random(1.5, 4); if (this.round >= 5) this.end(true);
    }
    if (key === " " && this.id === "football") {
      const keeper = 360 + Math.sin(this.time * 2) * 170;
      const goal = Math.abs(this.x - keeper) > 55; this.score += goal ? 100 : 0; this.round++; this.message = `${goal ? "GOAL!" : "Saved!"} · ${this.round}/10`; if (this.round >= 10) this.end(this.score >= 500);
    }
  }
  click(x: number, y: number) {
    if (this.over) return;
    if (this.id === "flappy" || this.id === "reaction") this.input(" ");
    if (this.id === "football") { this.x = Math.max(190, Math.min(530, x)); this.input(" "); }
    if (this.id === "fps" || this.id === "aim") {
      const index = this.objects.findIndex(object => Math.hypot(x - object.x, y - object.y) < object.r);
      if (index >= 0) { this.score += this.id === "fps" ? 100 : 10; this.objects.splice(index, 1); } else this.score = Math.max(0, this.score - 1);
    }
    if (this.id === "egg" && !this.shots.length) { const angle = Math.atan2(y - 400, x - 360); if (Math.sin(angle) >= -.15) return; this.shots.push({ x: 360, y: 400, vx: Math.cos(angle) * 460, vy: Math.sin(angle) * 460, r: 15, kind: this.egg }); }
  }
  step(dt: number, keys: Set<string>, pointer: { x: number; y: number } | null) {
    if (this.over) return;
    this.time += dt; this.timer += dt; this.cooldown -= dt; this.jump = Math.max(0, this.jump - dt); this.duck = Math.max(0, this.duck - dt);
    const horizontal = Number(keys.has("ArrowRight")) - Number(keys.has("ArrowLeft"));
    const vertical = Number(keys.has("ArrowDown")) - Number(keys.has("ArrowUp"));
    if (["plane", "dodge", "invaders", "catch", "football", "fps"].includes(this.id)) this.x = Math.max(this.id === "football" ? 190 : 22, Math.min(this.id === "football" ? 530 : 698, this.x + horizontal * 300 * dt));
    if (["plane", "dodge"].includes(this.id)) this.y = Math.max(30, Math.min(410, this.y + vertical * 300 * dt));
    if (pointer && ["catch", "breakout"].includes(this.id)) this.x = Math.max(45, Math.min(675, pointer.x));
    if (["plane", "invaders", "asteroids"].includes(this.id) && keys.has(" ") && this.cooldown <= 0) {
      this.cooldown = .18;
      const angle = this.id === "asteroids" ? this.angle : -Math.PI / 2;
      this.shots.push({ x: this.x, y: this.y - 15, vx: Math.cos(angle) * 430, vy: Math.sin(angle) * 430, r: 3 });
    }
    if (this.id === "race" || this.id === "runner") {
      this.score = Math.floor(this.time * 10) + this.round * 10;
      if (this.timer > Math.max(.4, 1.1 - this.time / 150)) { this.timer = 0; this.objects.push({ x: 210 + Math.floor(random(0, 3)) * 150, y: -60, vx: 0, vy: 160 + this.time * 3, r: 24, kind: this.id === "runner" ? Math.floor(random(0, 3)) : 0 }); }
      for (const object of this.objects) {
        object.y += object.vy * dt;
        if (Math.abs(object.y - 355) < 30 && object.x === 210 + this.lane * 150) {
          if (this.id === "runner" && (object.kind === 2 || (object.kind === 0 && this.jump > 0) || (object.kind === 1 && this.duck > 0))) { if (object.kind === 2) this.round++; }
          else this.hit(); object.y = H + 100;
        }
      }
    }
    if (this.id === "plane" || this.id === "catch" || this.id === "dodge") {
      if (this.id === "dodge") this.score = Math.floor(this.time * 10);
      if (this.timer > (this.id === "dodge" ? .3 : .7)) { this.timer = 0; this.objects.push({ x: random(25, 695), y: -30, vx: random(-35, 35), vy: random(100, 200) + this.time, r: 16, kind: Math.random() < .2 ? 1 : 0 }); }
      this.objects.forEach(object => { object.x += object.vx * dt; object.y += object.vy * dt; if (Math.hypot(this.x - object.x, this.y - object.y) < (this.id === "catch" ? 37 : 28)) { if (this.id === "catch" && !object.kind) this.score += 10; else this.hit(); object.y = 500; } else if (this.id === "catch" && object.y > H && !object.kind) { this.hit(); object.kind = 2; } });
    }
    if (this.id === "fps" || this.id === "aim") {
      if (this.time > (this.id === "fps" ? 60 : 30)) this.end(true);
      if (this.timer > (this.id === "fps" ? 1.1 : .65)) { this.timer = 0; this.objects.push({ x: random(90, 630), y: random(70, 325), vx: random(-22, 22), vy: 0, r: this.id === "fps" ? random(20, 35) : 23, kind: 0 }); }
      this.objects.forEach(object => { object.x += object.vx * dt; object.kind = (object.kind ?? 0) + dt; if (object.kind > (this.id === "fps" ? 4 : 2.5)) { if (this.id === "fps") this.hit(); object.y = 600; } });
    }
    if (this.id === "snake" && this.timer > Math.max(.075, .16 - this.score / 2000)) {
      this.timer = 0; this.direction = this.nextDirection; const head = [this.snake[0][0] + this.direction[0], this.snake[0][1] + this.direction[1]];
      const eat = head[0] === this.food[0] && head[1] === this.food[1];
      if (head[0] < 0 || head[0] >= 30 || head[1] < 0 || head[1] >= 18 || this.snake.slice(0, eat ? undefined : -1).some(part => part[0] === head[0] && part[1] === head[1])) this.end();
      else { this.snake.unshift(head); if (!eat) this.snake.pop(); else { this.score += 10; const empty = Array.from({ length: 540 }, (_, i) => [i % 30, Math.floor(i / 30)]).filter(cell => !this.snake.some(part => part[0] === cell[0] && part[1] === cell[1])); if (!empty.length) this.end(true); else this.food = empty[Math.floor(random(0, empty.length))]; } }
    }
    if (this.id === "pong") {
      this.angle = Math.max(50, Math.min(390, this.angle + vertical * 300 * dt));
      this.wait += Math.max(-170 * dt, Math.min(170 * dt, this.y - this.wait));
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.y < 10 || this.y > 430) { this.y = Math.max(10, Math.min(430, this.y)); this.vy *= -1; }
      if ((this.x < 35 && this.vx < 0 && Math.abs(this.y - this.angle) < 55) || (this.x > 685 && this.vx > 0 && Math.abs(this.y - this.wait) < 55)) this.vx *= -1.05;
      if (this.x < 0 || this.x > W) { const playerPoint = this.x > W; if (playerPoint) this.score++; else this.round++; this.x = 360; this.y = 220; this.vx = playerPoint ? -210 : 210; if (this.score >= 7 || this.round >= 7) this.end(this.score >= 7); }
    }
    if (this.id === "breakout") {
      this.angle = pointer ? pointer.x : Math.max(50, Math.min(670, this.angle + horizontal * 360 * dt));
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.x < 10 || this.x > 710) this.vx *= -1;
      if (this.y < 10) this.vy = Math.abs(this.vy);
      if (this.y > 395 && this.y < 415 && this.vy > 0 && Math.abs(this.x - this.angle) < 60) { this.vy = -Math.abs(this.vy); this.vx = (this.x - this.angle) * 5; }
      for (let i = 0; i < this.grid.length; i++) if (this.grid[i] && Math.abs(this.x - (47 + i % 10 * 69)) < 34 && Math.abs(this.y - (45 + Math.floor(i / 10) * 27)) < 15) { this.grid[i] = 0; this.vy *= -1; this.score += 10; break; }
      if (this.y > H) { this.hit(); this.x = 360; this.y = 300; this.vy = -210; }
      if (this.grid.every(value => !value)) this.end(true);
    }
    if (this.id === "flappy") {
      this.vy += 580 * dt; this.y += this.vy * dt;
      if (this.timer > 1.6) { this.timer = 0; this.objects.push({ x: 760, y: random(110, 290), vx: -150, vy: 0, r: 65, kind: 0 }); }
      this.objects.forEach(object => { object.x += object.vx * dt; if (Math.abs(object.x - this.x) < 34 && Math.abs(object.y - this.y) > 58) this.end(); if (object.x < this.x && !object.kind) { object.kind = 1; this.score++; } });
      if (this.y < 0 || this.y > H) this.end();
    }
    if (this.id === "invaders") {
      this.objects.forEach(object => { object.x += object.vx * dt; });
      if (this.objects.some(object => object.x < 25 || object.x > 695)) this.objects.forEach(object => { object.vx *= -1; object.x = Math.max(26, Math.min(694, object.x)); object.y += 18; });
      if (this.timer > .9 && this.objects.length) { this.timer = 0; const enemy = this.objects[Math.floor(random(0, this.objects.length))]; this.shots.push({ x: enemy.x, y: enemy.y, vx: 0, vy: 160, r: 4, kind: 1 }); }
      if (this.objects.some(object => object.y > 340)) this.end();
      if (!this.objects.length) this.end(true);
    }
    if (this.id === "asteroids") {
      this.angle += horizontal * 3 * dt;
      if (keys.has("ArrowUp")) { this.vx += Math.cos(this.angle) * 140 * dt; this.vy += Math.sin(this.angle) * 140 * dt; }
      this.vx *= .99; this.vy *= .99; this.x = (this.x + this.vx * dt + W) % W; this.y = (this.y + this.vy * dt + H) % H;
      this.objects.forEach(object => { object.x = (object.x + object.vx * dt + W) % W; object.y = (object.y + object.vy * dt + H) % H; if (Math.hypot(object.x - this.x, object.y - this.y) < object.r + 10 && this.jump <= 0) { this.hit(); this.jump = 2; } });
      if (!this.objects.length) this.end(true);
    }
    if (this.id === "reaction") this.ready = this.time >= this.wait;
    this.shots.forEach(shot => {
      shot.x += shot.vx * dt; shot.y += shot.vy * dt;
      if (this.id === "egg") {
        if (shot.x < 214 || shot.x > 506) shot.vx *= -1;
        const collision = this.grid.some((value, i) => value >= 0 && Math.hypot(shot.x - (225 + i % 10 * 30), shot.y - (35 + Math.floor(i / 10) * 30)) < 29);
        if (shot.y <= 20 || collision) {
          const empty = this.grid.map((value, i) => ({ value, i, d: Math.hypot(shot.x - (225 + i % 10 * 30), shot.y - (35 + Math.floor(i / 10) * 30)) })).filter(cell => cell.value < 0 && (cell.i < 10 || this.grid[cell.i - 10] >= 0 || (cell.i % 10 > 0 && this.grid[cell.i - 1] >= 0) || (cell.i % 10 < 9 && this.grid[cell.i + 1] >= 0))).sort((a, b) => a.d - b.d)[0];
          if (empty) { this.grid[empty.i] = shot.kind!; const cluster = eggCluster(this.grid, empty.i); if (cluster.length >= 3) { cluster.forEach(i => { this.grid[i] = -1; }); this.score += cluster.length * 10; } }
          this.egg = Math.floor(random(0, 5)); shot.y = -100; if (this.grid.slice(80).some(value => value >= 0)) this.end(); if (this.grid.every(value => value < 0)) this.end(true);
        }
      } else if (shot.kind === 1) { if (Math.hypot(shot.x - this.x, shot.y - this.y) < 22) { this.hit(); shot.y = -100; } }
      else { const index = this.objects.findIndex(object => Math.hypot(shot.x - object.x, shot.y - object.y) < object.r + 5); if (index >= 0) { this.objects.splice(index, 1); this.score += 20; shot.y = -100; } }
    });
    this.shots = this.shots.filter(shot => shot.y > -40 && shot.y < 480 && shot.x > 0 && shot.x < W);
    this.objects = this.objects.filter(object => object.y < 500 && object.x > -60 && object.x < 800);
  }
}

