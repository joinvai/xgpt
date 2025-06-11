import OpenAI from "openai";
import { readFile } from "fs/promises";
import "dotenv/config";

type Row = { id: string; text: string; vec: number[] };

const rows: Row[] = JSON.parse(await readFile("vectors.json", "utf8"));
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

const q = process.argv.slice(2).join(" ");
if (!q) throw new Error("Usage: bun run ask.ts <your question>");

/* 1 — embed the question */
const qVec = (
    await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: q
    })
).data[0]?.embedding || [];

/* 2 — rank by cosine similarity */
function cosine(a: number[], b: number[]) {
    let dot = 0,
        na = 0,
        nb = 0;
    for (let i = 0; i < a.length; i++) {
        dot += (a[i] ?? 0) * (b[i] ?? 0);
        na += (a[i] ?? 0) * (a[i] ?? 0);
        nb += (b[i] ?? 0) * (b[i] ?? 0);
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

const top = rows
    .map(r => ({ ...r, score: cosine(qVec, r.vec) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

/* 3 — feed to GPT-4o (or 3.5) */
const context = top.map(r => `• ${r.text}`).join("\n");

const reply = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
        { role: "system", content: "Answer like @dev_username" },
        { role: "user", content: `${q}\n\nReference:\n${context}` }
    ]
});
console.log("\n" + reply.choices[0]?.message?.content);
