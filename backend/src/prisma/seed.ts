import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Starting BookLeaf database seeding...");

  // 1. Clean reset (idempotent)
  await prisma.ticketMessage.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();
  console.log("🧹 Cleared existing database records.");

  // 2. Create Admin Account
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const admin = await prisma.user.create({
    data: {
      name: "BookLeaf Operations Admin",
      email: "admin@bookleaf.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      city: "Delhi",
      phone: "+91-11-45678900",
      bankDetailsLinked: true,
    },
  });
  console.log(`✅ Admin created: ${admin.email} (Password: Admin@123)`);

  // 3. Read bookleaf_sample_data.json
  let sampleDataPath = path.resolve(process.cwd(), "bookleaf_sample_data.json");
  if (!fs.existsSync(sampleDataPath)) {
    sampleDataPath = path.resolve(process.cwd(), "../bookleaf_sample_data.json");
  }
  if (!fs.existsSync(sampleDataPath)) {
    throw new Error(`Sample data file not found at: ${sampleDataPath}`);
  }

  const rawData = fs.readFileSync(sampleDataPath, "utf-8");
  const data = JSON.parse(rawData);

  const defaultAuthorPasswordHash = await bcrypt.hash("Author@123", 10);

  let totalBooksCreated = 0;

  for (const authorData of data.authors) {
    const author = await prisma.user.create({
      data: {
        authorCode: authorData.author_id,
        name: authorData.name,
        email: authorData.email,
        passwordHash: defaultAuthorPasswordHash,
        phone: authorData.phone,
        city: authorData.city,
        joinedDate: authorData.joined_date ? new Date(authorData.joined_date) : new Date(),
        role: "AUTHOR",
        bankDetailsLinked: true,
      },
    });

    console.log(`👤 Author [${authorData.author_id}]: ${author.name} (${author.email})`);

    for (const b of authorData.books) {
      await prisma.book.create({
        data: {
          bookCode: b.book_id,
          authorId: author.id,
          title: b.title,
          isbn: b.isbn || null,
          genre: b.genre,
          publicationDate: b.publication_date ? new Date(b.publication_date) : null,
          status: b.status,
          mrp: b.mrp ?? null,
          authorRoyaltyPerCopy: b.author_royalty_per_copy ?? null,
          totalCopiesSold: b.total_copies_sold || 0,
          totalRoyaltyEarned: b.total_royalty_earned || 0,
          royaltyPaid: b.royalty_paid || 0,
          royaltyPending: b.royalty_pending || 0,
          lastRoyaltyPayoutDate: b.last_royalty_payout_date ? new Date(b.last_royalty_payout_date) : null,
          printPartner: b.print_partner || null,
          availableOn: b.available_on || [],
        },
      });
      totalBooksCreated++;
    }
  }

  console.log(`\n🎉 Seeding complete!`);
  console.log(`   - Authors seeded: ${data.authors.length}`);
  console.log(`   - Books seeded:   ${totalBooksCreated}`);
  console.log(`   - Admin seeded:   ${admin.email}`);
  console.log(`   - Author password: Author@123`);
  console.log(`   - Admin password:  Admin@123\n`);
}

seed()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
