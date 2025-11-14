import prisma from "@/lib/prisma";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/≥/g, "gte")
    .replace(/≤/g, "lte")
    .replace(/%/g, "pct")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

async function run() {
  const rows = await prisma.forecast.findMany({
    select: { id: true, title: true, organizationId: true, slug: true },
    orderBy: { id: "asc" },
  });

  // ensure uniqueness per org
  const seen = new Map<string, Set<string>>(); // orgId -> slugs

  for (const r of rows) {
    if (!seen.has(r.organizationId)) seen.set(r.organizationId, new Set());
    const bag = seen.get(r.organizationId)!;

    const base = slugify(r.title) || `f-${r.id.slice(0, 8)}`;
    let slug = base;
    let i = 2;
    while (bag.has(slug)) slug = `${base}-${i++}`;
    bag.add(slug);

    if (r.slug !== slug) {
      await prisma.forecast.update({ where: { id: r.id }, data: { slug } });
      console.log(`Set slug for ${r.id} -> ${slug}`);
    }
  }
  console.log("Backfill complete.");
}

run().catch((e) => { console.error(e); process.exit(1); });
