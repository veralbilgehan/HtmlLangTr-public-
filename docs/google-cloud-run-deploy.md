# Google Cloud Run Deploy Rehberi

Bu proje Docker ile **Google Cloud Run** uzerinden yayinlanabilir.

## 1) Gerekli Hazirlik

- Google Cloud projesi olustur.
- Billing acik olsun.
- Cloud Run API ve Artifact Registry API aktif olsun.
- Bilgisayarinda Google Cloud CLI (`gcloud`) kurulu olsun.

## 2) GCloud Giris ve Proje Secimi

```bash
gcloud auth login
gcloud config set project PROJE_ID
```

## 3) Container Registry Ayari

```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
```

## 4) Image Build ve Push

```bash
gcloud builds submit --tag gcr.io/PROJE_ID/html-lang-tr
```

## 5) Cloud Run Deploy

```bash
gcloud run deploy html-lang-tr \
  --image gcr.io/PROJE_ID/html-lang-tr \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,SESSION_SECRET=SESSION_SECRET:latest
```

Not: `DATABASE_URL` zorunludur. Projede bu degisken yoksa uygulama acilista hata verir.

## 6) Secret Olusturma (Ornek)

```bash
echo -n "postgres://kullanici:sifre@host:5432/db" | gcloud secrets create DATABASE_URL --data-file=-
echo -n "guclu-ve-rastgele-secret" | gcloud secrets create SESSION_SECRET --data-file=-
```

Eger secret zaten varsa yeni versiyon ekle:

```bash
echo -n "yeni-deger" | gcloud secrets versions add DATABASE_URL --data-file=-
```

## 7) CORS Icin FRONTEND_URL

Farkli bir domain kullanirsan:

```bash
gcloud run services update html-lang-tr \
  --region europe-west1 \
  --set-env-vars FRONTEND_URL=https://senin-domainin.com
```

## 8) Hizmet URL

Deploy sonunda Cloud Run sana bir URL verir. Uygulama bu adreste canli olur.

## 9) Lokal Docker Test (Opsiyonel)

```bash
docker build -t html-lang-tr .
docker run -p 8080:8080 \
  -e DATABASE_URL="postgres://..." \
  -e SESSION_SECRET="..." \
  html-lang-tr
```

Sonra `http://localhost:8080` adresini ac.
