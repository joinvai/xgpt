import { Scraper } from "@the-convocation/twitter-scraper";
import { writeFile } from "fs/promises";
import "dotenv/config";

const user = process.argv[2];
if (!user) throw new Error("Usage: bun run scrape.ts <handle>");

const cookies = [
    // 1) auth_token
    `auth_token=${process.env.AUTH_TOKEN}; Path=/; Domain=.x.com; Secure; HttpOnly`,
    // 2) ct0  (CSRF token)
    `ct0=${process.env.CT0}; Path =/; Domain=.x.com; Secure`
];

const scraper = new Scraper();
await scraper.setCookies(cookies);   // array of TWO strings       //  ←  ONE string, not array

// quick sanity check
// const me = await scraper.verifyCredentials?.();
// console.log("Logged in as:", me?.screen_name ?? "(unknown)");

const out: { id: string; text: string }[] = [];
for await (const t of scraper.getTweets(user)) {
    if (t.isRetweet || t.isReply) continue;
    out.push({ id: t.id!, text: (t.text ?? "").replace(/\s+/g, " ").trim() });
    if (out.length >= 10_000) break;
}
await writeFile("tweets.json", JSON.stringify(out, null, 2));
console.log(`Saved ${out.length} tweets`);