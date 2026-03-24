import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("changeme123", 10);

  await prisma.user.upsert({
    where: { email: "admin@halalflow.app" },
    update: {},
    create: {
      email: "admin@halalflow.app",
      password: hashedPassword,
      role: "admin",
    },
  });

  const stocks = [
    { ticker: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", sector: "Technology", country: "US", debtRatio: 0.32, cashRatio: 0.28, revenueRatio: 0.05, status: "COMPLIANT", score: 85 },
    { ticker: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", sector: "Technology", country: "US", debtRatio: 0.25, cashRatio: 0.35, revenueRatio: 0.03, status: "COMPLIANT", score: 92 },
    { ticker: "NESM", name: "Nestle Malaysia Bhd", exchange: "KLSE", sector: "Consumer Staples", country: "MY", debtRatio: 0.18, cashRatio: 0.12, revenueRatio: 0.01, status: "COMPLIANT", score: 95 },
    { ticker: "TOPG", name: "Top Glove Corporation", exchange: "KLSE", sector: "Healthcare", country: "MY", debtRatio: 0.22, cashRatio: 0.15, revenueRatio: 0.02, status: "COMPLIANT", score: 88 },
    { ticker: "CIMB", name: "CIMB Group Holdings", exchange: "KLSE", sector: "Financials", country: "MY", debtRatio: 0.85, cashRatio: 0.65, revenueRatio: 0.42, status: "NON_COMPLIANT", score: 15 },
    { ticker: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE", sector: "Financials", country: "US", debtRatio: 0.91, cashRatio: 0.72, revenueRatio: 0.58, status: "NON_COMPLIANT", score: 8 },
    { ticker: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", sector: "Consumer Discretionary", country: "US", debtRatio: 0.15, cashRatio: 0.22, revenueRatio: 0.01, status: "COMPLIANT", score: 90 },
    { ticker: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", sector: "Consumer Discretionary", country: "US", debtRatio: 0.28, cashRatio: 0.18, revenueRatio: 0.04, status: "DOUBTFUL", score: 62 },
    { ticker: "PETR", name: "Petronas Chemicals Group", exchange: "KLSE", sector: "Materials", country: "MY", debtRatio: 0.12, cashRatio: 0.08, revenueRatio: 0.01, status: "COMPLIANT", score: 94 },
    { ticker: "2222.SR", name: "Saudi Aramco", exchange: "TADAWUL", sector: "Energy", country: "SA", debtRatio: 0.08, cashRatio: 0.05, revenueRatio: 0.00, status: "COMPLIANT", score: 98 },
    { ticker: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", sector: "Communication Services", country: "US", debtRatio: 0.10, cashRatio: 0.40, revenueRatio: 0.02, status: "DOUBTFUL", score: 68 },
    { ticker: "BABA", name: "Alibaba Group Holdings", exchange: "HKEX", sector: "Consumer Discretionary", country: "CN", debtRatio: 0.19, cashRatio: 0.30, revenueRatio: 0.06, status: "DOUBTFUL", score: 55 },
  ];

  for (const stock of stocks) {
    const created = await prisma.stock.upsert({
      where: { ticker: stock.ticker },
      update: stock,
      create: stock,
    });

    await prisma.screening.create({
      data: {
        stockId: created.id,
        result: stock.status,
        ratios: JSON.stringify({
          debtRatio: stock.debtRatio,
          cashRatio: stock.cashRatio,
          revenueRatio: stock.revenueRatio,
        }),
        method: "AAOIFI",
      },
    });
  }

  console.log("Seed completed: 12 stocks, 12 screenings, 1 admin user");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
