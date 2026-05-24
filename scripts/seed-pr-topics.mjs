/**
 * Seed default press release topics into the database.
 * Run: node scripts/seed-pr-topics.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const topics = [
  {
    title: "Solar Homeowners Win Contract Cancellations in Record Numbers Across the US",
    angle: "Focus on the growing trend of successful solar contract exits. Mention that thousands of homeowners have successfully cancelled predatory solar contracts using consumer protection laws.",
    targetKeywords: "solar contract cancellation, cancel solar contract, solar contract exit",
    targetUrl: "https://breakyoursolarcontract.com",
    sortOrder: 10,
  },
  {
    title: "What Solar Companies Don't Want You to Know About Cancelling Your Contract",
    angle: "Expose the tactics solar companies use to keep homeowners locked in. Highlight the 3-day right of rescission and state-level consumer protection laws.",
    targetKeywords: "solar contract rights, solar contract cancellation, solar lease cancellation",
    targetUrl: "https://breakyoursolarcontract.com",
    sortOrder: 20,
  },
  {
    title: "Sunrun Customers Report Billing Fraud and Contract Violations — Legal Help Now Available",
    angle: "Focus on Sunrun specifically. Cite BBB complaints and consumer reports. Mention that affected homeowners may have grounds for contract cancellation.",
    targetKeywords: "Sunrun cancel contract, Sunrun complaints, Sunrun solar contract problems",
    targetUrl: "https://breakyoursolarcontract.com/cancel-sunrun-solar-contract",
    sortOrder: 30,
  },
  {
    title: "New Consumer Protection Laws Give Solar Homeowners More Rights to Exit Contracts",
    angle: "Highlight recent state-level legislation strengthening consumer rights against predatory solar contracts. Focus on states like FL, TX, CA, AZ.",
    targetKeywords: "solar consumer protection, solar contract law, solar homeowner rights",
    targetUrl: "https://breakyoursolarcontract.com/solar-contract-laws",
    sortOrder: 40,
  },
  {
    title: "How to Sell Your Home When You Have a Solar Lease or Loan",
    angle: "Address the common problem of solar contracts blocking home sales. Explain the options: transfer, buyout, or cancellation.",
    targetKeywords: "selling house with solar lease, solar contract home sale, solar lien removal",
    targetUrl: "https://breakyoursolarcontract.com/selling-house-with-solar",
    sortOrder: 50,
  },
  {
    title: "SunPower Bankruptcy Leaves Thousands of Homeowners Without Support — What Are Your Options?",
    angle: "SunPower filed for bankruptcy in 2024. Homeowners with SunPower contracts may have additional legal grounds for cancellation. Explain their rights.",
    targetKeywords: "SunPower bankruptcy, SunPower solar contract cancel, SunPower homeowners",
    targetUrl: "https://breakyoursolarcontract.com",
    sortOrder: 60,
  },
  {
    title: "Solar Loan vs Solar Lease: Which Is Harder to Cancel and What You Can Do",
    angle: "Compare the two main contract types and explain the different legal strategies for cancelling each. Include GoodLeap, Mosaic, and Sunrun examples.",
    targetKeywords: "solar loan cancellation, solar lease cancellation, cancel solar loan, cancel solar lease",
    targetUrl: "https://breakyoursolarcontract.com",
    sortOrder: 70,
  },
];

const conn = await mysql.createConnection(process.env.DATABASE_URL);

for (const t of topics) {
  await conn.execute(
    `INSERT INTO pressReleaseTopics (title, angle, targetKeywords, targetUrl, sortOrder, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 'pending', NOW(), NOW())
     ON DUPLICATE KEY UPDATE title = VALUES(title)`,
    [t.title, t.angle, t.targetKeywords, t.targetUrl, t.sortOrder]
  );
}

await conn.end();
console.log(`Seeded ${topics.length} press release topics.`);
