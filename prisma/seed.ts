// Demo verisi: bir ofis, bir şirket sahibi, bir danışman, üç daire, bir müşteri odası.
// Çalıştır: npm run db:seed  (şifreler: demo1234)
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Photo Sphere Viewer'ın herkese açık örnek panoraması; gerçek çekimler gelince değişir.
const SAMPLE_PANORAMA = "https://photo-sphere-viewer-data.netlify.app/assets/sphere.jpg";

async function main() {
  const passwordHash = await hash("demo1234", 10);

  const office = await prisma.office.upsert({
    where: { id: "demo-office" },
    update: {},
    create: { id: "demo-office", name: "Demo Gayrimenkul" },
  });

  const owner = await prisma.user.upsert({
    where: { email: "sahip@demo.local" },
    update: {},
    create: { email: "sahip@demo.local", name: "Şirket Sahibi", role: "OWNER", officeId: office.id, passwordHash },
  });

  const agent = await prisma.user.upsert({
    where: { email: "danisman@demo.local" },
    update: {},
    create: {
      email: "danisman@demo.local",
      name: "Demo Danışman",
      phone: "+905000000000",
      role: "AGENT",
      officeId: office.id,
      passwordHash,
    },
  });

  const existing = await prisma.property.count({ where: { officeId: office.id } });
  if (existing > 0) {
    console.log("Demo portföy zaten var, atlandı.");
    return;
  }

  const seaView = await prisma.property.create({
    data: {
      officeId: office.id,
      agentId: agent.id,
      title: "Mavişehir'de deniz manzaralı 2+1",
      listingType: "RENT",
      price: 45000,
      dues: 3500,
      deposit: 90000,
      roomsLabel: "2+1",
      sqm: 110,
      floor: 12,
      buildingAge: 18,
      city: "İzmir",
      district: "Karşıyaka",
      neighborhood: "Mavişehir",
      description: "Site içinde, kapalı otopark, 24 saat güvenlik. Salon ve yatak odası denize bakar.",
      photos: {
        create: [
          { url: "https://picsum.photos/seed/salon1/1200/800", caption: "Salon", order: 0 },
          { url: "https://picsum.photos/seed/mutfak1/1200/800", caption: "Mutfak", order: 1 },
          { url: "https://picsum.photos/seed/yatak1/1200/800", caption: "Yatak odası", order: 2 },
        ],
      },
    },
  });

  // 360° tur: iki oda, birbirine kapıyla bağlı
  const salon = await prisma.tourScene.create({
    data: { propertyId: seaView.id, name: "Salon", panoramaUrl: SAMPLE_PANORAMA, order: 0 },
  });
  const mutfak = await prisma.tourScene.create({
    data: { propertyId: seaView.id, name: "Mutfak", panoramaUrl: SAMPLE_PANORAMA, order: 1 },
  });
  await prisma.tourScene.update({
    where: { id: salon.id },
    data: { links: [{ toSceneId: mutfak.id, yaw: 1.2, pitch: 0 }] },
  });
  await prisma.tourScene.update({
    where: { id: mutfak.id },
    data: { links: [{ toSceneId: salon.id, yaw: -1.6, pitch: 0 }] },
  });

  const bostanli = await prisma.property.create({
    data: {
      officeId: office.id,
      agentId: agent.id,
      title: "Bostanlı'da yenilenmiş 3+1",
      listingType: "RENT",
      price: 38000,
      dues: 1500,
      roomsLabel: "3+1",
      sqm: 130,
      floor: 3,
      buildingAge: 25,
      city: "İzmir",
      district: "Karşıyaka",
      neighborhood: "Bostanlı",
      description: "Vapur iskelesine 5 dakika yürüme. Mutfak ve banyo 2024'te yenilendi.",
      photos: {
        create: [
          { url: "https://picsum.photos/seed/salon2/1200/800", caption: "Salon", order: 0 },
          { url: "https://picsum.photos/seed/banyo2/1200/800", caption: "Banyo", order: 1 },
        ],
      },
    },
  });

  const satilik = await prisma.property.create({
    data: {
      officeId: office.id,
      agentId: agent.id,
      title: "Alaybey'de satılık 3+1, yüksek giriş",
      listingType: "SALE",
      price: 7900000,
      dues: 800,
      roomsLabel: "3+1",
      sqm: 125,
      floor: 1,
      buildingAge: 8,
      city: "İzmir",
      district: "Karşıyaka",
      neighborhood: "Alaybey",
      photos: { create: [{ url: "https://picsum.photos/seed/salon3/1200/800", caption: "Salon", order: 0 }] },
    },
  });

  await prisma.room.create({
    data: {
      token: "demo-oda",
      agentId: agent.id,
      customerName: "Ayşe ve Mehmet",
      customerPhone: "+905111111111",
      note: "Konuştuğumuz gibi deniz manzaralı olanı başa koydum; diğer ikisi bütçe için alternatif.",
      items: {
        create: [
          { propertyId: seaView.id, order: 0, agentNote: "Manzara tam istediğiniz gibi, 12. kat." },
          { propertyId: bostanli.id, order: 1 },
          { propertyId: satilik.id, order: 2, agentNote: "Satın alma düşünürseniz diye." },
        ],
      },
    },
  });

  console.log("Demo verisi hazır.");
  console.log("Giriş: sahip@demo.local / demo1234  veya  danisman@demo.local / demo1234");
  console.log("Müşteri odası: /r/demo-oda");
  void owner;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
