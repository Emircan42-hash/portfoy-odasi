# Portföy Odası — proje notları (Claude için)

Bu dosya, projeyi başlatan bulut oturumundan devralınan bağlamdır. Bu klasörde açılan her oturum önce bunu okur.
Konuşma dili Türkçe. Ürün arayüzü Türkçe.

## Ürün tek cümlede

Emlak danışmanı müşteriye WhatsApp'tan **tek bir link** atar (`/r/<token>`); müşteri hesap açmadan daireleri gezer,
360° turda evin içinde dolaşır, fotoğraflara beğen/olmaz/not bırakır, gerçek maliyeti görür, **teklif verir**, randevu ister.
Danışman ve şirket sahibi panelde her hareketi görür. Hedef: danışmanın şirket sahibinin gözüne girmesi;
şirketler zaten RE-OS ve Sahibinden'e para ödüyor, bu ürün onların **yerine değil yanına** konur.

Ürün tanımı ve yol haritası: "Portföy Odası PRD" (Claude Docs). Kaynak kodu: https://github.com/Emircan42-hash/portfoy-odasi

**Bu projenin `scrapvity` ile hiçbir ilgisi yoktur.** Ayrı ürün, ayrı repo, ayrı veritabanı.

## Kişiler

- Kullanıcı (sen onunla konuşuyorsun): geliştirici, projenin sahibi.
- **Oben**: kullanıcının arkadaşı, gayrimenkul danışmanı, ürünü içeriden taşıyan kişi. Kendi ofisi var, şirkette başka danışmanlar da var.
  Portföy kiralık ağırlıklı. 360° kamera elinde var. Geri bildirimleri aşağıdaki kuralları belirledi.

## Değişmez kurallar (Oben'in kararları)

1. **Üç profil**: danışman (AGENT), şirket sahibi / patron (OWNER), müşteri (hesapsız, link ile). Mülk sahibi ayrı profil **değildir**.
2. Mülk sahibine **görüntüleme sayısı, talep ve teklif bilgisi asla gösterilmez**; isterse müşteriyle aynı oda linkini alır, o kadar.
3. Müşteri **teklif verebilir**; teklifleri **yalnız danışman ve şirket sahibi görür**. Müşteri sadece "iletildi" görür;
   tutar hiçbir müşteri ekranına ve API cevabına gitmez (`/api/r/[token]/offers` yalnız `{id, status}` döner).
4. Müşteri tarafında üyelik, uygulama, giriş yok. Link telefonda 2 saniyede açılmalı.
5. İlan sitelerinden veri kazıma (scraping) **yok**. Kendi ilan portalı yok. Mülk sahibi portalı yok.
6. Çeviri (İngilizce/Rusça/Arapça) faz 3; yabancı müşteri az ama oluyor.

## Yığın ve komutlar

Next.js 16 (App Router, Server Actions, `cacheComponents: false`), React 19, TypeScript, Tailwind v4,
shadcn/ui bileşenleri (`src/components/ui`, elle yazıldı, `npx shadcn add` ile uyumlu), Prisma 7 + PostgreSQL
(`@prisma/adapter-pg`), Auth.js v5 (e-posta + şifre, JWT), Photo Sphere Viewer 5 (360° tur).

```bash
cp .env.example .env     # yerelde olduğu gibi çalışır
docker compose up -d     # PostgreSQL 16
npm install              # postinstall: prisma generate
npm run setup            # migrate deploy + seed (demo ofis, 2 kullanıcı, 3 daire, 1 oda, 1 teklif)
npm run dev              # http://localhost:3000
npm run typecheck && npm run lint
```

Demo girişleri: `sahip@demo.local` (OWNER) ve `danisman@demo.local` (AGENT), şifre `demo1234`. Demo oda: `/r/demo-oda`.

Prisma 7 notları: `prisma migrate dev` client'ı yeniden **üretmez**, `npm run db:migrate` ikisini birlikte yapar.
`prisma migrate reset` Claude Code içinden engellenir; gerekirse tabloları `TRUNCATE ... CASCADE` ile boşaltıp `npm run db:seed` çalıştır.
Dev sunucu şema değişikliğinden sonra eski client'ı tutabilir; `prisma.<model> undefined` hatası görürsen sunucuyu yeniden başlat.

## Yapı

```
prisma/schema.prisma      Office, User(Role), Property, Photo, TourScene(links: kapı noktaları), Room(token),
                          RoomItem, Reaction, RoomEvent(ilgi takibi), Appointment, Offer
src/auth.ts               Auth.js + requireUser()
src/lib/cost.ts           gerçek maliyet (kiralık: depozito+komisyon+aidat; satılık: tapu harcı+komisyon+kredi)
src/lib/scope.ts          OWNER ofisin tamamını, AGENT yalnız kendi kayıtlarını görür
src/lib/actions/          server action'lar: giriş, daire ekle, oda oluştur, teklif/randevu durumu
src/app/(auth)/giris      giriş (markalı koyu ekran)
src/app/(panel)/          panel: /panel özet, /portfoy, /odalar, /odalar/[id], /teklifler, /randevular
src/app/r/[token]/        müşteri odası: liste, /[propertyId] daire, /[propertyId]/tur 360°
src/app/api/r/[token]/    müşteri uçları: events, reactions, appointments, offers (hepsi token ile, hesapsız)
src/components/room/      tracker (olay kaydı), reaction-bar, offer-form, appointment-form, cost-card, spec-list
src/components/tour/      virtual-tour (PSV + virtual-tour + gyroscope + markers)
src/components/panel/     nav-links (ikonlar istemcide kalır), page-header
src/components/brand.tsx  BrandMark, Wordmark
public/demo/              yer tutucu fotoğraflar ve 2 panorama (internet gerektirmez)
```

## Tasarım dili

`src/app/globals.css` içinde değişkenler: sıcak kum zemin, derin deniz-yeşili vurgu (`--primary`), koyu lacivert marka alanları
(`--brand-dark`, kenar çubuğu / giriş / tur başlığı / müşteri odası üst bandı), `--success`. Başlıklar Fraunces (`font-display`),
rakamlar ve gövde Geist; rakamlarda `tabular` (lining-nums). Kartlar `rounded-2xl shadow-card`. Rozetler: `glass` (görsel üstü), `success`.
Müşteri sayfaları telefon öncelikli; daire sayfasında telefonda sabit alt çubuk (tur + randevu). Tasarım önemli: bir ürün gibi görünmeli.

## Durum (25 Eki 2026)

Faz 1 iskeleti + teklif akışı + tasarım geçişi bitti, GitHub'da `main`. Typecheck, lint, build temiz; tüm sayfalar ve API uçları test edildi.
Fotoğraflar hâlâ demo yer tutucu; 360° kareler URL ile giriliyor.

Sıradaki işler (öncelik sırasıyla):
1. Oben'in 360° kamerasından gerçek bir çekimi sisteme koymak; kapı noktalarını (`TourScene.links`) panelden yerleştirme aracı
2. Fotoğraf ve panorama dosya yükleme (S3 uyumlu depo; şimdilik URL)
3. Teklif ve randevu gelince danışmana bildirim (önce SMS, sonra WhatsApp Business API)
4. Faz 2: uzaktan yer gösterme (danışman + müşteri aynı turda, WebSocket), karşılaştırma, 3D splat turu
5. Faz 3: AI ilan metni + çeviri, sanal eşyalama ("temsilidir" etiketiyle), talep-portföy eşleştirme

Açık soru: RE-OS ve Sahibinden'e ayda ne ödeniyor (patrona sorulacak).

## Çalışma şekli

Kullanıcı kodu localhost'ta görmek ister; değişiklikten sonra `npm run dev` açıkken tarayıcıda kontrol et, mümkünse ekran görüntüsü al.
Küçük, doğrulanmış adımlar; her anlamlı adımdan sonra commit. Push'u kullanıcı istediğinde yap.
