# Supabase Geçiş Planı

Bu klasör şu anda yalnızca planlama içindir. Henüz Supabase kodu, migration veya bağlantı bilgisi içermez.

## Planlanan aşamalar

1. Veri modelini ve mevcut yerel/demo veri akışlarını envanterle.
2. Supabase projesini ve geliştirme/üretim ortam ayrımını tasarla.
3. Tablo, ilişki, indeks ve migration stratejisini belirle.
4. Kimlik doğrulama akışlarını ve kullanıcı profili modelini tasarla.
5. Row Level Security (RLS) politikalarını veri erişim kurallarıyla birlikte tanımla.
6. Storage gereksinimlerini ve dosya erişim politikalarını belirle.
7. Mobil uygulama için istemci yapılandırmasını ve güvenli ortam değişkenlerini planla.
8. Web/landing tarafının gerçekten ihtiyaç duyduğu sınırlı entegrasyonları belirle.
9. Yerel/demo veriden geçiş ve geri dönüş planını hazırla.
10. Test, gözlemlenebilirlik, yedekleme ve yayın kontrol listesini oluştur.

## Güvenlik ilkeleri

- Service role anahtarı istemci uygulamalarına konulmaz.
- Gizli bilgiler Git'e eklenmez.
- RLS politikaları doğrulanmadan üretim verisi açılmaz.
- Şema ve migration değişiklikleri inceleme ve test sonrasında uygulanır.
