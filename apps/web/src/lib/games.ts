export const games = [
  { id: "fps", name: "Neon Ops", category: "Action", emoji: "🎯", description: "A first-person target arena. Clear the drones before they fire.", controls: "A/D or ←/→ to strafe · click/tap targets to fire" },
  { id: "football", name: "Penalty Club", category: "Sports", emoji: "⚽", description: "Beat the moving goalkeeper in a ten-shot penalty challenge.", controls: "Move the aim with ←/→ · Space or tap the goal to shoot" },
  { id: "race", name: "Night Circuit", category: "Racing", emoji: "🏎️", description: "Weave through traffic on an ever-faster neon highway.", controls: "←/→ to change lanes · tap left/right controls" },
  { id: "runner", name: "Metro Dash", category: "Adventure", emoji: "🏃", description: "Switch lanes, jump barriers, and duck under signs.", controls: "←/→ lanes · ↑/Space jump · ↓ duck" },
  { id: "egg", name: "Egg Pop", category: "Puzzle", emoji: "🥚", description: "Aim colored eggs. Connect three matching eggs to clear them.", controls: "Click/tap to aim and shoot · match 3 adjacent colors" },
  { id: "plane", name: "Sky Patrol", category: "Action", emoji: "✈️", description: "Pilot your plane, dodge enemy fire, and clear the skies.", controls: "Arrow keys/WASD to fly · Space/fire button to shoot" },
  { id: "snake", name: "Pixel Snake", category: "Classics", emoji: "🐍", description: "Collect food and grow. Keep clear of walls and your own tail.", controls: "Arrow keys/WASD change direction" },
  { id: "pong", name: "Orbit Pong", category: "Sports", emoji: "🏓", description: "Outplay the computer in a first-to-seven paddle match.", controls: "↑/↓ or W/S move your paddle" },
  { id: "breakout", name: "Prism Breaker", category: "Classics", emoji: "🧱", description: "Bounce the ball and break every brick without dropping it.", controls: "←/→ or pointer move paddle" },
  { id: "invaders", name: "Star Invaders", category: "Action", emoji: "👾", description: "Defend your base from marching alien waves.", controls: "←/→ move · Space/fire button to shoot" },
  { id: "flappy", name: "Cloud Hopper", category: "Adventure", emoji: "🐤", description: "Stay airborne and thread the gaps between the towers.", controls: "Space, ↑, or tap the playfield to flap" },
  { id: "asteroids", name: "Asteroid Drift", category: "Action", emoji: "☄️", description: "Rotate, thrust, and blast drifting asteroids in deep space.", controls: "←/→ turn · ↑ thrust · Space fire" },
  { id: "catch", name: "Star Catcher", category: "Classics", emoji: "⭐", description: "Catch falling stars in your basket. Avoid the red bombs.", controls: "←/→ move basket · pointer/touch aim" },
  { id: "dodge", name: "Laser Dodge", category: "Action", emoji: "⚡", description: "Survive a storm of moving hazards as long as you can.", controls: "Arrow keys/WASD move in all directions" },
  { id: "aim", name: "Target Rush", category: "Action", emoji: "🔫", description: "Hit as many moving targets as possible in thirty seconds.", controls: "Click/tap targets · misses cost a point" },
  { id: "reaction", name: "Flash Reflex", category: "Classics", emoji: "⏱️", description: "Wait for green, then react. Five rounds test your reflexes.", controls: "Space or tap when the screen turns green" },
  { id: "memory", name: "Match Garden", category: "Puzzle", emoji: "🌸", description: "Find eight matching pairs using as few turns as possible.", controls: "Select two cards to reveal them" },
  { id: "mines", name: "Mine Scout", category: "Puzzle", emoji: "💣", description: "Reveal the safe squares and flag ten hidden mines.", controls: "Tap to reveal · switch to Flag mode to mark mines" },
  { id: "tictactoe", name: "Triple Line", category: "Strategy", emoji: "❎", description: "Take on the computer. Connect three marks to win.", controls: "Choose an empty square · you play X" },
  { id: "connect", name: "Connect Four", category: "Strategy", emoji: "🔴", description: "Drop discs and make a line of four before the computer.", controls: "Select a column to drop your disc" },
  { id: "2048", name: "Merge 2048", category: "Puzzle", emoji: "🔢", description: "Slide and merge matching numbers to reach the 2048 tile.", controls: "Arrow keys or direction buttons to slide" },
  { id: "simon", name: "Color Echo", category: "Puzzle", emoji: "🎨", description: "Watch the color sequence, then repeat it from memory.", controls: "Watch the lights · tap colors in the same order" },
] as const;
export type GameId = typeof games[number]["id"];
export type Game = typeof games[number];
export const puzzleIds: readonly GameId[] = ["memory", "mines", "tictactoe", "connect", "2048", "simon"];
