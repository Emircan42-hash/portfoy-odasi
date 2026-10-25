# Portföy Odası

Emlak danışmanının müşteriye WhatsApp'tan attığı tek link. Müşteri linkte kendisi için seçilmiş daireleri gezer, 360° turda evin içinde dolaşır, fotoğraflara tepki verir, randevu ister. Danışman ve şirket sahibi her hareketi panelde görür.

Ürün tanımı ve yol haritası: Portföy Odası PRD (Claude Docs).

## Ne var (faz 1 iskeleti)

| Taraf | Sayfa | Durum |
| --- | --- | --- |
| Müşteri | `/r/[token]` oda, `/r/[token]/[daire]` daire sayfası, `/r/[token]/[daire]/tur` 360° tur | Çalışır |
| Müşteri | Beğen / ele / not, gerçek maliyet kartı, randevu isteği | Çalışır |
| Müşteri | Teklif verme (tutar + not); müşteri yalnız "iletildi" görür, tutarlar sadece panelde | Çalışır |
| Danışman | `/teklifler`: teklifleri ilan fiyatına göre yüzdesiyle görür, kabul / ret / iç not | Çalışır |
| Danışman | `/panel` özet, `/portfoy` daireler, `/odalar` müşteri odaları, `/randevular` | Çalışır |
| Danışman | Oda linki üretme, WhatsApp'tan gönderme, ilgi takibi (görüntüleme, süre, tur) | Çalışır |
| Şirket sahibi | Aynı panel, ofisin tüm danışmanlarını görür | Çalışır |
| Medya | Fotoğraf ve 360° kareler URL ile girilir | Dosya yükleme sonraki adım |

## Kurulum (bir kez)

Gerekenler: Node 20+, Docker Desktop (yerel PostgreSQL için), git.

```bash
git clone https://github.com/Emircan42-hash/portfoy-odasi.git
cd portfoy-odasi
cp .env.example .env        # Windows PowerShell: copy .env.example .env
docker compose up -d        # yerel PostgreSQL
npm install                 # postinstall: prisma generate
npm run setup               # migration'ları uygular + demo verisini yükler
npm run dev                 # http://localhost:3000
```

## Geliştirme akışı

Claude Code oturumunu **bu klasörde, kendi bilgisayarında** çalıştır (Claude Desktop'ta klasörü aç ya da terminalde `claude remote-control`). Dosyalar doğrudan diskinde değişir, `npm run dev` açıkken localhost anında yenilenir; git'ten indirme-push döngüsü gerekmez. Git yalnız yedek ve paylaşım içindir.

Şema değiştiğinde: `npm run db:migrate` (migration üretir ve uygular, ardından client'ı yeniler).

5432 ya da 3000 başka bir projede doluysa: `.env`'e `DB_PORT=5434` ekle ve `DATABASE_URL`'deki portu 5434 yap; siteyi `npm run dev -- -p 3100` ile aç, `NEXT_PUBLIC_APP_URL`'yi `http://localhost:3100` yap. (Bu makinede böyle kurulu.)

Demo girişleri (şifre `demo1234`):

- `sahip@demo.local` — şirket sahibi
- `danisman@demo.local` — danışman

Demo müşteri odası: <http://localhost:3000/r/demo-oda>

## Yığın

- Next.js 16 (App Router, Server Actions), React 19, TypeScript
- Tailwind v4 + shadcn/ui bileşenleri (`src/components/ui`, `npx shadcn add …` ile uyumlu)
- Prisma 7 + PostgreSQL (`@prisma/adapter-pg`)
- Auth.js v5 (e-posta + şifre, JWT oturum)
- Photo Sphere Viewer 5 (360° tur, jiroskop, kapı noktaları)

`cacheComponents` pilot sürümde kapalı; her sayfa istek anında veritabanından okur.

## Klasörler

```
prisma/schema.prisma        veri modeli (Office, User, Property, Photo, TourScene, Room, RoomItem, Reaction, RoomEvent, Appointment)
prisma/seed.ts              demo verisi
src/auth.ts                 Auth.js yapılandırması, requireUser()
src/lib/cost.ts             gerçek maliyet hesabı (kira / satılık)
src/lib/scope.ts            şirket sahibi vs danışman görünürlüğü
src/lib/actions/            server action'lar (giriş, daire ekle, oda oluştur, randevu durumu)
src/app/(auth)/giris        giriş
src/app/(panel)/            danışman ve şirket sahibi paneli
src/app/r/[token]/          müşteri odası (hesapsız)
src/app/api/r/[token]/      müşteri olayları: events, reactions, appointments
src/components/room/        tracker, tepki çubuğu, randevu formu, maliyet kartı
src/components/tour/        360° tur bileşeni
```

## 360° çekim

Her odanın ortasında, göz hizasında, 2:1 oranlı equirectangular bir kare (Insta360 vb. "360 fotoğraf" modu). Daireye eklerken her satır `Oda adı | panorama URL`. Kapı noktaları (`TourScene.links`: `[{ toSceneId, yaw, pitch }]`) şimdilik veritabanından elle; panelde kapı yerleştirme aracı sonraki adım.

## Sonraki adımlar

1. Fotoğraf ve panorama dosya yükleme (S3 uyumlu depo)
2. Panelde kapı noktası yerleştirme (turda tıkla → link)
3. Teklif bildirimi danışmana (SMS / WhatsApp). Mülk sahibi ayrı bir profil değildir; istenirse müşteriyle aynı oda linkini alır, görüntüleme, talep ve teklif bilgisi ona gösterilmez
4. Uzaktan yer gösterme: danışman ve müşteri aynı turda (faz 2)
