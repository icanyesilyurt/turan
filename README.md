# TURAN

TURAN, mobil uygulamayı ana ürün olarak konumlandıran bir projedir. Web uygulaması yardımcı/landing deneyimi sağlar.

## Proje yapısı

- `mobile/`: Expo + React Native ana mobil uygulama
- `web/`: React + Vite yardımcı web/landing uygulaması
- `supabase/`: İleride yapılacak Supabase geçişinin plan ve dokümantasyonu

## Gereksinimler

- Node.js (güncel LTS önerilir)
- npm
- Mobil geliştirme için Expo Go veya Android/iOS emülatörü

## Web uygulaması

```bash
cd web
npm install
npm run dev
```

Üretim derlemesini doğrulamak için:

```bash
npm run build
npm run preview
```

## Mobil uygulama

```bash
cd mobile
npm install
npm start
```

Platform kısayolları:

```bash
npm run android
npm run ios
npm run web
```

> Ana ürün mobil uygulamadır. Mevcut Expo yapısı ve UI/UX dosyaları korunmalıdır.

## Ortam değişkenleri ve güvenlik

- `.env` ve türevleri Git'e eklenmez.
- Gerçek anahtarlar veya gizli bilgiler repoya yazılmamalıdır.
- Gerektiğinde yalnızca örnek değerler içeren `.env.example` kullanılmalıdır.

## Supabase

Supabase entegrasyonu henüz uygulanmamıştır. Planlanan aşamalar için `supabase/README.md` dosyasına bakın.

## Git çalışma akışı

Değişiklikleri kontrol edin:

```bash
git status
git diff --staged
```

İncelemeden sonra commit oluşturun. Push işlemi ayrıca ve açık onayla yapılmalıdır.
