# ÇALIŞAN PERFORMANS TAKİP SİSTEMİ

**Kullanım Kılavuzu ve Tanıtım Belgesi**

Versiyon 1.0

---

## İÇİNDEKİLER

1. [Giriş ve Genel Bakış](#1-giriş-ve-genel-bakış)
2. [Sistem Gereksinimleri](#2-sistem-gereksinimleri)
3. [Kullanıcı Rolleri ve Yetkileri](#3-kullanıcı-rolleri-ve-yetkileri)
4. [Giriş Yapma](#4-giriş-yapma)
5. [Ana Panel (Dashboard)](#5-ana-panel-dashboard)
6. [Mesai Takibi](#6-mesai-takibi)
7. [Aktivite ve Satış Kaydı](#7-aktivite-ve-satış-kaydı)
8. [Dahili Mesajlaşma](#8-dahili-mesajlaşma)
9. [Raporlar (Yönetici)](#9-raporlar-yönetici)
10. [Puan Ayarları](#10-puan-ayarları)
11. [Kullanıcı Yönetimi](#11-kullanıcı-yönetimi)
12. [Şirket Yönetimi](#12-şirket-yönetimi-süper-admin)
13. [Sık Sorulan Sorular](#13-sık-sorulan-sorular)

---

## 1. GİRİŞ VE GENEL BAKIŞ

Çalışan Performans Takip Sistemi, şirketlerin çalışanlarının performansını takip etmelerini, mesai saatlerini yönetmelerini ve dahili iletişimi kolaylaştırmalarını sağlayan kapsamlı bir web tabanlı uygulamadır.

### Temel Özellikler

- **Çok şirketli mimari** - Birden fazla şirketi tek sistemden yönetme
- **Hiyerarşik kullanıcı yapısı** - Süper Admin, Yönetici, Çalışan rolleri
- **GPS tabanlı mesai takibi** - Konum doğrulamalı giriş/çıkış
- **Aktivite ve satış kaydı** - Puan tabanlı performans ölçümü
- **Dahili mesajlaşma** - Dosya ve fotoğraf paylaşımı
- **Detaylı raporlama** - Filtrelenebilir performans raporları
- **Mobil uyumlu tasarım** - Her cihazda sorunsuz kullanım
- **Türkçe arayüz** - Tamamen Türkçe kullanıcı deneyimi

---

## 2. SİSTEM GEREKSİNİMLERİ

### Desteklenen Tarayıcılar

- Google Chrome (önerilen)
- Mozilla Firefox
- Microsoft Edge
- Safari

### Mobil Cihazlar

- iOS 12 ve üzeri
- Android 8 ve üzeri

### Gerekli İzinler

- **Konum erişimi (GPS)** - Mesai başlatma/bitirme için
- **Kamera erişimi** - Fotoğraf paylaşımı için (isteğe bağlı)

---

## 3. KULLANICI ROLLERİ VE YETKİLERİ

### Süper Admin

Sistemin en üst düzey yöneticisidir. Tüm şirketleri ve kullanıcıları yönetme yetkisine sahiptir.

- Yeni şirket oluşturma
- Şirketlere yönetici atama
- Tüm şirketlerin verilerini görüntüleme
- Varsayılan aktivite türleri tanımlama
- Sistem genelinde raporlara erişim

### Yönetici

Bir şirkete atanan ve o şirketin çalışanlarını yöneten kullanıcıdır.

- Şirket çalışanlarını görüntüleme ve yönetme
- Yeni çalışan ekleme
- Performans raporlarını görüntüleme
- Aktivite türleri ve puan değerlerini yapılandırma
- Şirket içi mesajlaşma

### Çalışan

Günlük işlerini takip eden ve performansını kaydeden kullanıcıdır.

- Mesai başlatma ve bitirme
- Aktivite ve satış kaydı
- Kendi performans özetini görüntüleme
- Dahili mesajlaşma

---

## 4. GİRİŞ YAPMA

Sisteme erişmek için aşağıdaki adımları izleyin:

1. Web tarayıcınızda uygulama adresini açın
2. Kullanıcı adınızı girin
3. Şifrenizi girin
4. "Giriş Yap" butonuna tıklayın

Giriş başarılı olduğunda, rolünüze göre ana panel görüntülenecektir.

### Önemli Notlar

- Şifrenizi kimseyle paylaşmayın
- Ortak kullanılan cihazlarda çıkış yapmayı unutmayın
- Şifrenizi unuttuysanız yöneticinize başvurun

---

## 5. ANA PANEL (DASHBOARD)

Giriş yaptıktan sonra karşınıza çıkan ana ekrandır. Rolünüze göre farklı sekmeler görüntülenir:

### Çalışan Paneli

- **Performans** - Mesai ve aktivite takibi
- **Sohbet** - Dahili mesajlaşma

### Yönetici Paneli

- **Ana Sayfa** - Genel özet
- **Performans** - Mesai ve aktivite takibi
- **Raporlar** - Çalışan performans raporları
- **Kullanıcılar** - Çalışan yönetimi
- **Ayarlar** - Puan yapılandırması
- **Sohbet** - Dahili mesajlaşma

---

## 6. MESAİ TAKİBİ

Çalışanlar, iş günlerinde mesai başlatıp bitirebilirler. Sistem, GPS konumunu kaydeder.

### Mesai Başlatma

1. "Performans" sekmesine gidin
2. "Mesaiye Başla" butonuna tıklayın
3. Konum izni isteği gelirse "İzin Ver" seçin
4. Mesai başlangıç saati ve konumunuz kaydedilir

### Mesai Bitirme

1. "Mesaiyi Bitir" butonuna tıklayın
2. Konum izni onaylandığında mesai sonlandırılır
3. Toplam çalışma süresi otomatik hesaplanır

### Mesai Bilgileri

- Başlangıç saati ve konumu
- Bitiş saati ve konumu
- Toplam çalışma süresi

---

## 7. AKTİVİTE VE SATIŞ KAYDI

Mesai sırasında yapılan aktiviteler ve satışlar kaydedilebilir.

### Aktivite Başlatma

1. Aktivite listesinden bir tür seçin
2. "Başlat" butonuna tıklayın
3. Aktivite zamanlayıcısı başlar

### Aktivite Bitirme

1. "Bitir" butonuna tıklayın
2. İsterseniz not ekleyin
3. Aktivite süresi ve puanı kaydedilir

### Satış Kaydı

- Satış türünü seçin
- Miktar girin
- Kaydet butonuna tıklayın

---

## 8. DAHİLİ MESAJLAŞMA

Şirket içi kullanıcılarla anlık mesajlaşma yapabilirsiniz.

### Mesaj Gönderme

1. "Sohbet" sekmesine gidin
2. Sol panelden konuşmak istediğiniz kişiyi seçin
3. Mesajınızı yazın ve gönderin

### Dosya Paylaşımı

- Ataç ikonuna tıklayarak dosya seçin
- Kamera ikonuyla anlık fotoğraf çekin
- Maksimum dosya boyutu: 10MB
- Desteklenen formatlar: Görseller, PDF, Word, Excel

### Özellikler

- Okundu bilgisi
- Dosya indirme
- Arama fonksiyonu

---

## 9. RAPORLAR (YÖNETİCİ)

Yöneticiler, çalışanların performansını detaylı raporlarla takip edebilir.

### Rapor Filtreleri

- **Çalışan seçimi** - Tüm çalışanlar veya belirli bir çalışan
- **Tarih filtresi** - Bugün, Bu Hafta, Bu Ay

### Rapor İçeriği

- Toplam çalışma süresi
- Mesai sayısı
- Aktivite sayısı ve süreleri
- Satış adetleri
- Toplam kazanılan puanlar
- Çalışan bazlı performans karşılaştırması

---

## 10. PUAN AYARLARI

Yöneticiler, aktivite ve satış türlerinin puan değerlerini yapılandırabilir.

### Yeni Tür Ekleme

1. "Ayarlar" sekmesine gidin
2. "Yeni Tür Ekle" butonuna tıklayın
3. Tür adını girin
4. Kategori seçin (Aktivite veya Satış)
5. Puan değerini belirleyin
6. "Ekle" butonuna tıklayın

### Tür Düzenleme

- Listeden düzenlemek istediğiniz türün yanındaki kalem ikonuna tıklayın
- Değişiklikleri yapın ve kaydedin

---

## 11. KULLANICI YÖNETİMİ

Yöneticiler ve Süper Adminler kullanıcı ekleyip yönetebilir.

### Yeni Kullanıcı Ekleme

1. "Kullanıcılar" sekmesine gidin
2. "Yeni Kullanıcı" butonuna tıklayın
3. Gerekli bilgileri doldurun:
   - Kullanıcı adı
   - Şifre
   - Ad Soyad
   - Rol (Çalışan/Yönetici)
   - Departman
   - Şirket (Süper Admin için)
4. "Ekle" butonuna tıklayın

---

## 12. ŞİRKET YÖNETİMİ (SÜPER ADMİN)

Süper Adminler yeni şirketler oluşturabilir.

### Yeni Şirket Ekleme

1. "Şirketler" sekmesine gidin
2. "Yeni Şirket" butonuna tıklayın
3. Şirket bilgilerini girin:
   - Şirket adı
   - Adres
   - Telefon
   - E-posta
4. "Ekle" butonuna tıklayın

---

## 13. SIK SORULAN SORULAR

### Şifremi unuttum, ne yapmalıyım?

Şifre sıfırlama için yöneticinize veya sistem yöneticisine başvurun.

### Mesai başlatırken konum hatası alıyorum

Tarayıcınızın konum iznini kontrol edin. Ayarlardan konum erişimine izin verin.

### Fotoğraf yükleyemiyorum

Dosya boyutunun 10MB'ı geçmediğinden ve desteklenen bir format olduğundan emin olun.

### Mesajlarım gitmiyor

İnternet bağlantınızı kontrol edin. Sayfa yenileme deneyin.

### Raporlarda verilerim görünmüyor

Tarih filtresini kontrol edin. Doğru tarih aralığının seçili olduğundan emin olun.

---

## İLETİŞİM VE DESTEK

Teknik destek ve sorularınız için sistem yöneticinize başvurabilirsiniz.

---

## TEKNİK BİLGİLER

### Teknoloji Altyapısı

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 19, TypeScript, Vite 7 |
| UI | shadcn/ui, Radix UI, Tailwind CSS 4 |
| Backend | Express.js, TypeScript |
| Veritabanı | PostgreSQL (Neon Serverless) |
| ORM | Drizzle ORM |
| Kimlik Doğrulama | Passport.js |

### Veritabanı Şeması

| Tablo | Açıklama |
|-------|----------|
| companies | Şirket bilgileri |
| users | Kullanıcı hesapları |
| activity_types | Aktivite türleri ve puanları |
| shifts | Mesai kayıtları |
| activities | Aktivite kayıtları |
| sales_records | Satış kayıtları |
| messages | Dahili mesajlar |

### API Endpoint'leri

| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| POST | /api/auth/login | Kullanıcı girişi |
| POST | /api/auth/logout | Çıkış |
| GET | /api/companies | Şirket listesi |
| GET | /api/users | Kullanıcı listesi |
| POST | /api/shifts/start | Mesai başlat |
| POST | /api/shifts/end | Mesai bitir |
| POST | /api/activities/start | Aktivite başlat |
| POST | /api/activities/end | Aktivite bitir |
| GET | /api/messages | Mesajlar |
| POST | /api/messages | Mesaj gönder |
| GET | /api/reports/shifts | Mesai raporu |
| GET | /api/reports/activities | Aktivite raporu |

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Veritabanını hazırla
npm run db:push

# Geliştirme sunucusu
npm run dev

# Üretim build
npm run build
npm start
```

### Ortam Değişkenleri

```
DATABASE_URL=postgresql://...
SESSION_SECRET=gizli-anahtar
```

---

**PDF İndirme:** `/api/docs/kullanim-kilavuzu`

---

*Bu belge otomatik olarak oluşturulmuştur.*
