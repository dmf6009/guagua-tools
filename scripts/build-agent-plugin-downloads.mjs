import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const agentsDir = path.join(root, "agents");
const buildDir = path.join(root, ".plugin-build");
const downloadsDir = path.join(root, "downloads");
const zipDir = path.join(downloadsDir, "agent-plugins");
const skillsDir = path.join(downloadsDir, "skills");
const pluginCreator = "/Users/yingnanli/.codex/skills/.system/plugin-creator/scripts/create_basic_plugin.py";
const skillCreator = "/Users/yingnanli/.codex/skills/.system/skill-creator/scripts/init_skill.py";
const pluginValidator = "/Users/yingnanli/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py";
const skillValidator = "/Users/yingnanli/.codex/skills/.system/skill-creator/scripts/quick_validate.py";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  return result.stdout.trim();
}

function decode(value) {
  return value
    .replaceAll("&#10;", "\n").replaceAll("&amp;", "&").replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
}

function plain(value) {
  return decode(value.replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function capture(html, pattern, label, slug) {
  const match = html.match(pattern);
  if (!match) throw new Error(`Missing ${label} in ${slug}`);
  return plain(match[1]);
}

function yamlString(value) {
  return JSON.stringify(value);
}

function skillMarkdown(data) {
  return `---
name: ${data.slug}
description: ${yamlString(`${data.title} workflow supporting this outcome: ${data.deck} Use when the user needs a structured ${data.title.toLowerCase()} process, review, plan, or decision-support artifact.`)}
---

# ${data.title}

## Operating principles

- Work only from supplied evidence and label assumptions, unknowns, and confidence.
- Keep the task bounded to the requested artifact, decision, or workflow.
- Preserve an accountable human checkpoint for consequential actions.
- Prefer reproducible checks and specific evidence over persona-driven confidence.

## Inputs

Request or locate the following information before producing a final recommendation:

${data.inputs}

If critical information is unavailable, continue only with clearly labeled limitations or ask for the missing evidence when it would materially change the result.

## Workflow

Follow this sequence and adapt depth to the task:

${data.workflow}

Do not skip verification merely because an output looks plausible.

## Output contract

Return an artifact containing:

${data.output}

Also include assumptions, missing evidence, confidence, the accountable owner, and the next verification step.

## Guardrail

${data.guardrail}

## Example

${data.example}
`;
}

const entries = fs.readdirSync(agentsDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && fs.existsSync(path.join(agentsDir, entry.name, "index.html")))
  .map(entry => entry.name)
  .sort();

fs.rmSync(buildDir, { recursive: true, force: true });
fs.rmSync(zipDir, { recursive: true, force: true });
fs.rmSync(skillsDir, { recursive: true, force: true });
fs.mkdirSync(buildDir, { recursive: true });
fs.mkdirSync(zipDir, { recursive: true });
fs.mkdirSync(skillsDir, { recursive: true });

const catalog = [];
for (const slug of entries) {
  const pageFile = path.join(agentsDir, slug, "index.html");
  let html = fs.readFileSync(pageFile, "utf8");
  const title = capture(html, /<h1>(.*?)<\/h1>/s, "title", slug).replace(/\.$/, "");
  const deck = capture(html, /<p class="agent-deck">(.*?)<\/p>/s, "deck", slug);
  const inputs = capture(html, /<h2 id="inputs">.*?<\/h2><p>(.*?)<\/p>/s, "inputs", slug);
  const workflow = capture(html, /<h2 id="workflow">.*?<\/h2><p>(.*?)<\/p>/s, "workflow", slug);
  const output = capture(html, /<h2 id="output">.*?<\/h2>([\s\S]*?)<h2 id="example">/s, "output", slug)
    .replace(/ Every response should expose assumptions[\s\S]*$/, "");
  const example = capture(html, /<h2 id="example">.*?<\/h2><p>(.*?)<\/p>/s, "example", slug);
  const guardrail = capture(html, /<div class="agent-note"><p><strong>(?:Human checkpoint|Boundary|Safety rule):<\/strong>\s*(.*?)<\/p><\/div>/s, "guardrail", slug);
  const pluginName = `${slug}-agent`;
  const pluginPath = path.join(buildDir, pluginName);

  run("python3", [pluginCreator, pluginName, "--path", buildDir, "--with-skills"]);
  run("python3", [skillCreator, slug, "--path", path.join(pluginPath, "skills"),
    "--interface", `display_name=${title}`,
    "--interface", `short_description=${deck.slice(0, 62)}`,
    "--interface", `default_prompt=Use $${slug} to help with this task.`]);

  const data = { slug, title, deck, inputs, workflow, output, example, guardrail };
  const skillPath = path.join(pluginPath, "skills", slug);
  fs.writeFileSync(path.join(skillPath, "SKILL.md"), skillMarkdown(data));
  fs.writeFileSync(path.join(skillPath, "agents", "openai.yaml"), `interface:\n  display_name: ${yamlString(title)}\n  short_description: ${yamlString(deck.slice(0, 62))}\n  default_prompt: ${yamlString(`Use $${slug} to help with this task.`)}\n`);

  const manifest = {
    name: pluginName,
    version: "1.0.0",
    description: deck,
    author: { name: "Guagua Tools", url: "https://guagua-alvin.top/" },
    homepage: `https://guagua-alvin.top/agents/${slug}`,
    repository: "https://github.com/dmf6009/guagua-tools",
    license: "MIT",
    keywords: ["ai-agent", "agent-skill", slug],
    skills: "./skills/",
    interface: {
      displayName: `${title} Agent`, shortDescription: deck.slice(0, 96),
      longDescription: deck, developerName: "Guagua Tools", category: "Developer Tools",
      capabilities: ["Instructions"], websiteURL: `https://guagua-alvin.top/agents/${slug}`,
      privacyPolicyURL: "https://guagua-alvin.top/privacy", termsOfServiceURL: "https://guagua-alvin.top/terms",
      defaultPrompt: [`Use the ${title} workflow for this task.`], brandColor: "#315F49"
    }
  };
  fs.writeFileSync(path.join(pluginPath, ".codex-plugin", "plugin.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  run("python3", [skillValidator, skillPath]);
  run("python3", [pluginValidator, pluginPath]);

  const publicSkillDir = path.join(skillsDir, slug);
  fs.mkdirSync(publicSkillDir, { recursive: true });
  fs.copyFileSync(path.join(skillPath, "SKILL.md"), path.join(publicSkillDir, "SKILL.md"));
  const zipName = `${slug}-agent-plugin.zip`;
  const zipPath = path.join(zipDir, zipName);
  run("zip", ["-qr", zipPath, pluginName], { cwd: buildDir });
  const zipBuffer = fs.readFileSync(zipPath);
  catalog.push({ slug, title, version: "1.0.0", file: `/downloads/agent-plugins/${zipName}`, skill: `/downloads/skills/${slug}/SKILL.md`, bytes: zipBuffer.length, sha256: crypto.createHash("sha256").update(zipBuffer).digest("hex") });

  const downloadBlock = `<section class="agent-download" id="download"><p class="section-kicker">Portable agent package</p><h2>Download the ${title} plugin</h2><p>The ZIP contains a standalone Codex plugin with this blueprint as a validated <code>SKILL.md</code>. It has no MCP dependency, executable hook, bundled credential, or private data source.</p><div class="download-actions"><a class="plugin-download" href="/downloads/agent-plugins/${zipName}" download>Download plugin.zip <span>↘</span></a><a href="/downloads/skills/${slug}/SKILL.md" download>Download SKILL.md</a></div><ol><li>Download and extract the ZIP.</li><li>Review <code>.codex-plugin/plugin.json</code> and <code>skills/${slug}/SKILL.md</code>.</li><li>Add the extracted plugin with the plugin installer supported by your agent host.</li></ol><p class="download-note">Version 1.0.0 · MIT · Review instructions before installing any agent package.</p></section>`;
  if (html.includes('class="agent-download"')) html = html.replace(/<section class="agent-download"[\s\S]*?<\/section>/, downloadBlock);
  else html = html.replace('<section class="agent-faq"', `${downloadBlock}<section class="agent-faq"`);
  if (!html.includes('href="#download"')) html = html.replace('<a href="#faq">FAQ</a>', '<a href="#download">Download</a><a href="#faq">FAQ</a>');
  fs.writeFileSync(pageFile, html);
}

fs.writeFileSync(path.join(downloadsDir, "agent-plugins.json"), `${JSON.stringify({ generated: "2026-08-03", count: catalog.length, plugins: catalog }, null, 2)}\n`);
fs.rmSync(buildDir, { recursive: true, force: true });
console.log(`Built and validated ${catalog.length} agent plugins.`);
