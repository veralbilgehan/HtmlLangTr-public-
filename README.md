# Çalışan Performans Takip Sistemi

Çok şirketli, hiyerarşik kullanıcı yönetimine sahip mobil uyumlu çalışan performans takip uygulaması.

## Genel Bakış

Bu uygulama, şirketlerin çalışan performansını takip etmelerini, mesai saatlerini yönetmelerini ve dahili iletişimi kolaylaştırmalarını sağlayan kapsamlı bir yönetim sistemidir. Türkçe arayüz ile mavi/beyaz kurumsal renk şemasına sahiptir.

## Özellikler

### Kullanıcı Rolleri ve Yetkileri

| Rol | Yetkiler |
|-----|----------|
| **Süper Admin** | Şirket oluşturma, yönetici atama, tüm şirketleri görüntüleme, varsayılan aktivite türleri tanımlama |
| **Yönetici** | Kendi şirketindeki çalışanları yönetme, raporları görüntüleme, aktivite puan değerlerini yapılandırma |
| **Çalışan** | Mesai takibi, aktivite/satış kaydı, dahili mesajlaşma |

### Mesai Takibi
- Mesai başlatma ve bitirme ile GPS konum kaydı
- Başlangıç ve bitiş saati ile otomatik süre hesaplama
- Konum tabanlı doğrulama (enlem/boylam)
- Günlük, haftalık, aylık mesai raporları

### Aktivite ve Satış Kaydı
- Özelleştirilebilir aktivite türleri (Aktivite/Satış kategorileri)
- Başlangıç/bitiş saati ile süre hesaplama
- Aktivite bazlı puan sistemi
- Not ekleme özelliği
- Mesai ile ilişkilendirilmiş aktivite kayıtları

### Dahili Mesajlaşma
- Gerçek zamanlı mesajlaşma
- Dosya ve fotoğraf paylaşımı
- Kamera ile anlık fotoğraf çekme
- Okundu bilgisi
- Şirket içi kullanıcı listesi

### Raporlama (Yönetici Paneli)
- Çalışan bazlı performans özeti
- Mesai saatleri raporu
- Aktivite ve satış istatistikleri
- Tarih filtreleme (bugün, hafta, ay)
- Çalışan filtreleme
- Toplam puan hesaplama

### Puan Ayarları
- Aktivite türü oluşturma ve düzenleme
- Kategori belirleme (Aktivite/Satış)
- Puan değeri atama
- Varsayılan ve özel türler

## Teknoloji Altyapısı

### Frontend
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 7
- **Routing:** Wouter
- **State Management:** TanStack Query (React Query)
- **UI Kütüphanesi:** shadcn/ui + Radix UI
- **Stil:** Tailwind CSS 4
- **Form Yönetimi:** React Hook Form + Zod
- **İkonlar:** Lucide React

### Backend
- **Framework:** Express.js + TypeScript
- **Veritabanı:** PostgreSQL (Neon Serverless)
- **ORM:** Drizzle ORM
- **Kimlik Doğrulama:** Passport.js (Local Strategy)
- **Oturum Yönetimi:** express-session + connect-pg-simple
- **Dosya Yükleme:** Multer

### Veritabanı Şeması

#### Tablolar

| Tablo | Açıklama |
|-------|----------|
| `companies` | Şirket bilgileri (ad, adres, telefon, e-posta) |
| `users` | Kullanıcılar (kullanıcı adı, şifre, rol, departman, şirket bağlantısı) |
| `activity_types` | Aktivite türleri (ad, kategori, puan değeri) |
| `shifts` | Mesai kayıtları (başlangıç/bitiş saati, süre, GPS koordinatları) |
| `activities` | Aktivite kayıtları (tür, süre, notlar) |
| `sales_records` | Satış kayıtları (tür, miktar, notlar) |
| `messages` | Mesajlar (gönderen, alıcı, içerik, dosya eki) |

## Kurulum

### Gereksinimler
- Node.js 20+
- PostgreSQL veritabanı

### Adımlar

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **Ortam değişkenlerini ayarlayın:**
```
DATABASE_URL=postgresql://kullanici:sifre@host:port/veritabani
SESSION_SECRET=gizli-anahtar
```

3. **Veritabanını hazırlayın:**
```bash
npm run db:push
```

4. **Geliştirme sunucusunu başlatın:**
```bash
npm run dev
```

5. **Üretim için derleyin:**
```bash
npm run build
npm start
```

## API Endpoint'leri

### Kimlik Doğrulama
| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| POST | `/api/auth/login` | Kullanıcı girişi |
| POST | `/api/auth/logout` | Çıkış |
| GET | `/api/auth/session` | Oturum kontrolü |

### Şirketler
| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| GET | `/api/companies` | Şirket listesi |
| POST | `/api/companies` | Yeni şirket oluştur |

### Kullanıcılar
| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| GET | `/api/users` | Kullanıcı listesi |
| GET | `/api/company/users` | Şirket kullanıcıları |
| POST | `/api/company/users` | Yeni kullanıcı oluştur |

### Mesai
| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| GET | `/api/shifts/active` | Aktif mesai |
| POST | `/api/shifts/start` | Mesai başlat |
| POST | `/api/shifts/end` | Mesai bitir |
| GET | `/api/shifts/today` | Bugünkü mesailer |

### Aktiviteler
| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| GET | `/api/activities` | Aktivite listesi |
| GET | `/api/activities/active` | Aktif aktivite |
| POST | `/api/activities/start` | Aktivite başlat |
| POST | `/api/activities/end` | Aktivite bitir |

### Aktivite Türleri
| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| GET | `/api/activity-types` | Tür listesi |
| POST | `/api/activity-types` | Yeni tür oluştur |
| PUT | `/api/activity-types/:id` | Tür güncelle |

### Mesajlar
| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| GET | `/api/messages` | Tüm mesajlar |
| GET | `/api/messages/:userId` | Konuşma |
| POST | `/api/messages` | Mesaj gönder |
| POST | `/api/messages/:id/read` | Okundu işaretle |

### Raporlar
| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| GET | `/api/reports/shifts` | Mesai raporu |
| GET | `/api/reports/activities` | Aktivite raporu |

### Dosya Yükleme
| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| POST | `/api/upload` | Dosya yükle |

## Proje Yapısı

```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui bileşenleri
│   │   │   ├── ActivitySettings.tsx
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── CompanyManagement.tsx
│   │   │   ├── DashboardHome.tsx
│   │   │   ├── ManagerReport.tsx
│   │   │   ├── PerformanceView.tsx
│   │   │   └── UserManagement.tsx
│   │   ├── hooks/
│   │   │   └── use-toast.ts
│   │   ├── lib/
│   │   │   ├── auth.ts
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   └── Login.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   └── index.html
├── server/
│   ├── index.ts               # Express sunucu başlatma
│   ├── routes.ts              # API endpoint'leri
│   ├── storage.ts             # Veritabanı işlemleri
│   └── vite.ts                # Vite middleware
├── shared/
│   └── schema.ts              # Drizzle ORM şeması
├── uploads/                   # Yüklenen dosyalar
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Varsayılan Kullanıcılar

Sistem ilk kurulumda test kullanıcıları içerebilir:

| Rol | Kullanıcı Adı | Şifre |
|-----|---------------|-------|
| Süper Admin | admin | 123456 |
| Yönetici | yonetici1 | 123456 |
| Çalışan | calisan1 | 123456 |

## Güvenlik Özellikleri

- Şifre hash'leme (bcrypt benzeri güvenlik)
- Oturum tabanlı kimlik doğrulama
- Rol tabanlı erişim kontrolü
- CORS koruması
- Dosya türü ve boyut sınırlaması (maks. 10MB)
- SQL injection koruması (Drizzle ORM)

## Dosya Yükleme Kuralları

- Maksimum dosya boyutu: 10MB
- İzin verilen dosya türleri:
  - Görseller: JPEG, PNG, GIF, WebP
  - Belgeler: PDF, DOC, DOCX, XLS, XLSX
  - Metin: TXT

## Mobil Uyumluluk

Uygulama tamamen responsive tasarıma sahiptir:
- Mobil cihazlarda tam işlevsellik
- Dokunmatik dostu arayüz
- GPS konum erişimi
- Kamera erişimi (fotoğraf çekme)

## Geliştirici Notları

### Kod Standartları
- TypeScript strict mode
- ESLint yapılandırması
- Prettier kod formatlama

### Veritabanı Migrasyonları
```bash
# Şema değişikliklerini veritabanına uygula
npm run db:push

# Şema değişikliklerini zorla uygula
npm run db:push --force
```

### Build Komutları
```bash
# Geliştirme
npm run dev

# Üretim build
npm run build

# Üretim sunucusu
npm start

# TypeScript kontrol
npm run check
```

## Lisans

MIT

## Destek

Sorularınız için proje yöneticisi ile iletişime geçin.
