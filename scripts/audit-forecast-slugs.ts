import prisma from "@/lib/prisma";

async function run() {
  const nullCount = await prisma.forecast.count({ where: { slug: null } });
  console.log("NULL slugs:", nullCount);

  // duplicates per (org, slug)
  const rows = await prisma.$queryRaw<Array<{ organizationId: string; slug: string; cnt: bigint }>>`
    SELECT "organizationId", "slug", COUNT(*)::bigint AS cnt
    FROM "Forecast"
    WHERE "slug" IS NOT NULL
    GROUP BY "organizationId", "slug"
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC;
  `;

  if (rows.length === 0) {
    console.log("No duplicates found.");
  } else {
    console.log("Duplicates:");
    for (const r of rows) {
      console.log(`${r.organizationId} :: ${r.slug} -> ${r.cnt.toString()} rows`);
    }
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
