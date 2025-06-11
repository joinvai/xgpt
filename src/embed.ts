import OpenAI from "openai";
import { readFile, writeFile } from "fs/promises";
import "dotenv/config";

type Row = { id: string; text: string; vec: number[] };

const tweets: { id: string; text: string }[] = JSON.parse(
    await readFile("tweets.json", "utf8")
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

const rows: Row[] = [];
for (const chunk of chunkArray(tweets, 1000)) {
    const resp = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk.map(t => t.text)
    });
    resp.data.forEach((obj, i) =>
        rows.push({ id: chunk[i]?.id || "", text: chunk[i]?.text || "", vec: obj.embedding })
    );
    console.log(`embedded ${rows.length}/${tweets.length}`);
}

await writeFile("vectors.json", JSON.stringify(rows, null, 2));
console.log("vectors.json written");

function chunkArray<T>(arr: T[], n: number) {
    return Array.from({ length: Math.ceil(arr.length / n) }, (_v, i) =>
        arr.slice(i * n, i * n + n)
    );
}
