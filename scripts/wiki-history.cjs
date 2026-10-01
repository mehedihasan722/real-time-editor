const { execFileSync } = require("node:child_process");
const { writeFileSync } = require("node:fs");

const target = process.argv[2];
if (!target) throw new Error("Provide an output Markdown path.");
const lines = execFileSync("git", ["log", "-20", "--format=%H%x09%s"], { encoding: "utf8" }).trim().split("\n");
const escape = value => value.replace(/[\\`*_{}[\]<>()#!|]/g, "\\$&");
const repo = process.env.GITHUB_REPOSITORY ?? "mehedihasan722/real-time-editor";
const content = lines.map(line => {
  const [sha, ...title] = line.split("\t");
  return `- [${sha.slice(0, 7)}](https://github.com/${repo}/commit/${sha}) ${escape(title.join("\t"))}`;
}).join("\n");
writeFileSync(target, `# Recent changes\n\nGenerated from the latest 20 commits on main. Maintained automatically after each push.\n\n${content}\n`);
