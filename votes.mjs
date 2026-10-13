import { getStore } from "@netlify/blobs";

// The only people who can sign in. Add or remove names here.
// "aliases" are other spellings that sign in as the same person.
const MEMBERS = [
  { name: "Rodas",  ar: "رودس" },
  { name: "Andi",   ar: "آندي" },
  { name: "Rayan",  ar: "ريان" },
  { name: "Administrator", ar: "المسؤول", key: "julian" },
  { name: "Ziad",   ar: "زياد" },
  { name: "Onel",   ar: "أونيل" },
  { name: "Anwar",  ar: "أنور", aliases: ["Ano", "أنو"] }
];

// This member sees everyone's votes
const OWNER = "Administrator";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });

const clean = (s) => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
const findMember = (typed) => {
  const t = clean(typed);
  return MEMBERS.find((m) => [m.name, m.ar, ...(m.aliases || [])].some((n) => clean(n) === t)) || null;
};
const keyOf = (member) => member.key || member.name.toLowerCase();
const validDays = (days) =>
  Array.isArray(days) && days.length <= 31 && days.every((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d));

// Days before today (Iraq time) are never removed, so past votes stay in the results
const todayIQ = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Baghdad", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const keepPast = (list) => { const t = todayIQ(); return list.filter((d) => d < t); };

export default async (req) => {
  const store = getStore({ name: "nadi-votes", consistency: "strong" });

  if (req.method === "GET") {
    const member = findMember(new URL(req.url).searchParams.get("user"));
    if (!member) return json({ error: "unknown_name" }, 404);

    const mine = (await store.get(keyOf(member), { type: "json" })) || { name: member.name, days: [] };
    const me = { name: member.name, ar: member.ar, days: mine.days || [] };
    if (member.name !== OWNER) return json({ me });

    const all = await Promise.all(
      MEMBERS.map(async (m) => {
        const rec = await store.get(keyOf(m), { type: "json" });
        return { name: m.name, ar: m.ar, joined: !!rec, days: (rec && rec.days) || [] };
      })
    );
    return json({ me, all, owner: true });
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
    const member = findMember(body && body.user);
    if (!member) return json({ error: "unknown_name" }, 404);
    const days = body.days === undefined ? null : body.days;
    if (days !== null && !validDays(days)) return json({ error: "bad_days" }, 400);

    const existing = await store.get(keyOf(member), { type: "json" });
    const record = {
      name: member.name,
      days: days === null ? (existing && existing.days) || [] : [...new Set([...keepPast((existing && existing.days) || []), ...days])].sort(),
      at: new Date().toISOString()
    };
    await store.setJSON(keyOf(member), record);
    return json({ me: { name: record.name, ar: member.ar, days: record.days } });
  }

  return json({ error: "method_not_allowed" }, 405);
};

export const config = { path: "/api/votes" };
