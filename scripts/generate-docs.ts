import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const doc = new PDFDocument({ 
  size: 'A4',
  margin: 50,
  info: {
    Title: 'Çalışan Performans Takip Sistemi - Kullanım Kılavuzu',
    Author: 'Sistem Yönetimi',
  }
});

const outputPath = path.join(process.cwd(), 'docs', 'Kullanim_Kilavuzu.pdf');

if (!fs.existsSync(path.dirname(outputPath))) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

const colors = {
  primary: '#2563eb',
  secondary: '#64748b',
  text: '#1e293b',
  light: '#f1f5f9',
};

function addTitle(text: string) {
  doc.fontSize(24).fillColor(colors.primary).text(text, { align: 'center' });
  doc.moveDown(0.5);
}

function addSubtitle(text: string) {
  doc.fontSize(14).fillColor(colors.secondary).text(text, { align: 'center' });
  doc.moveDown(1.5);
}

function addHeading(text: string) {
  doc.fontSize(16).fillColor(colors.primary).text(text);
  doc.moveDown(0.3);
  doc.strokeColor(colors.primary).lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);
}

function addSubheading(text: string) {
  doc.fontSize(13).fillColor(colors.text).text(text, { underline: true });
  doc.moveDown(0.3);
}

function addParagraph(text: string) {
  doc.fontSize(11).fillColor(colors.text).text(text, { align: 'justify', lineGap: 3 });
  doc.moveDown(0.5);
}

function addBullet(text: string) {
  doc.fontSize(11).fillColor(colors.text).text(`• ${text}`, { indent: 20, lineGap: 2 });
}

function addNumbered(num: number, text: string) {
  doc.fontSize(11).fillColor(colors.text).text(`${num}. ${text}`, { indent: 20, lineGap: 2 });
}

function addTable(headers: string[], rows: string[][]) {
  const colWidth = (495 - (headers.length - 1) * 10) / headers.length;
  const startX = 50;
  let y = doc.y;

  doc.fontSize(10).fillColor('#ffffff');
  headers.forEach((header, i) => {
    doc.rect(startX + i * (colWidth + 10), y, colWidth, 20).fill(colors.primary);
    doc.fillColor('#ffffff').text(header, startX + i * (colWidth + 10) + 5, y + 5, { width: colWidth - 10 });
  });
  y += 25;

  doc.fillColor(colors.text);
  rows.forEach((row, rowIndex) => {
    if (y > 750) {
      doc.addPage();
      y = 50;
    }
    const bgColor = rowIndex % 2 === 0 ? '#ffffff' : colors.light;
    row.forEach((cell, i) => {
      doc.rect(startX + i * (colWidth + 10), y, colWidth, 20).fill(bgColor);
      doc.fillColor(colors.text).text(cell, startX + i * (colWidth + 10) + 5, y + 5, { width: colWidth - 10 });
    });
    y += 22;
  });
  doc.y = y + 10;
}

function newPage() {
  doc.addPage();
}

addTitle('ÇALIŞAN PERFORMANS TAKİP SİSTEMİ');
addSubtitle('Kullanım Kılavuzu ve Tanıtım Belgesi');
doc.moveDown(2);

doc.fontSize(12).fillColor(colors.secondary).text('Versiyon 1.0', { align: 'center' });
doc.moveDown(0.5);
doc.text(new Date().toLocaleDateString('tr-TR'), { align: 'center' });
doc.moveDown(4);

doc.fontSize(11).fillColor(colors.text);
doc.text('Bu belge, Çalışan Performans Takip Sistemi\'nin tüm özelliklerini, kullanım talimatlarını ve teknik detaylarını içermektedir.', { align: 'center' });

newPage();
addHeading('İÇİNDEKİLER');
doc.moveDown(0.5);
const toc = [
  '1. Giriş ve Genel Bakış',
  '2. Sistem Gereksinimleri',
  '3. Kullanıcı Rolleri ve Yetkileri',
  '4. Giriş Yapma',
  '5. Ana Panel (Dashboard)',
  '6. Mesai Takibi',
  '7. Aktivite ve Satış Kaydı',
  '8. Dahili Mesajlaşma',
  '9. Raporlar (Yönetici)',
  '10. Puan Ayarları',
  '11. Kullanıcı Yönetimi',
  '12. Şirket Yönetimi',
  '13. Sık Sorulan Sorular',
];
toc.forEach(item => {
  doc.fontSize(11).fillColor(colors.text).text(item, { indent: 30 });
  doc.moveDown(0.3);
});

newPage();
addHeading('1. GİRİŞ VE GENEL BAKIŞ');
addParagraph('Çalışan Performans Takip Sistemi, şirketlerin çalışanlarının performansını takip etmelerini, mesai saatlerini yönetmelerini ve dahili iletişimi kolaylaştırmalarını sağlayan kapsamlı bir web tabanlı uygulamadır.');
doc.moveDown(0.3);
addSubheading('Temel Özellikler');
addBullet('Çok şirketli mimari - Birden fazla şirketi tek sistemden yönetme');
addBullet('Hiyerarşik kullanıcı yapısı - Süper Admin, Yönetici, Çalışan rolleri');
addBullet('GPS tabanlı mesai takibi - Konum doğrulamalı giriş/çıkış');
addBullet('Aktivite ve satış kaydı - Puan tabanlı performans ölçümü');
addBullet('Dahili mesajlaşma - Dosya ve fotoğraf paylaşımı');
addBullet('Detaylı raporlama - Filtrelenebilir performans raporları');
addBullet('Mobil uyumlu tasarım - Her cihazda sorunsuz kullanım');
addBullet('Türkçe arayüz - Tamamen Türkçe kullanıcı deneyimi');

doc.moveDown(1);
addHeading('2. SİSTEM GEREKSİNİMLERİ');
addSubheading('Desteklenen Tarayıcılar');
addBullet('Google Chrome (önerilen)');
addBullet('Mozilla Firefox');
addBullet('Microsoft Edge');
addBullet('Safari');
doc.moveDown(0.5);
addSubheading('Mobil Cihazlar');
addBullet('iOS 12 ve üzeri');
addBullet('Android 8 ve üzeri');
doc.moveDown(0.5);
addSubheading('Gerekli İzinler');
addBullet('Konum erişimi (GPS) - Mesai başlatma/bitirme için');
addBullet('Kamera erişimi - Fotoğraf paylaşımı için (isteğe bağlı)');

newPage();
addHeading('3. KULLANICI ROLLERİ VE YETKİLERİ');
doc.moveDown(0.5);
addSubheading('Süper Admin');
addParagraph('Sistemin en üst düzey yöneticisidir. Tüm şirketleri ve kullanıcıları yönetme yetkisine sahiptir.');
addBullet('Yeni şirket oluşturma');
addBullet('Şirketlere yönetici atama');
addBullet('Tüm şirketlerin verilerini görüntüleme');
addBullet('Varsayılan aktivite türleri tanımlama');
addBullet('Sistem genelinde raporlara erişim');
doc.moveDown(0.5);

addSubheading('Yönetici');
addParagraph('Bir şirkete atanan ve o şirketin çalışanlarını yöneten kullanıcıdır.');
addBullet('Şirket çalışanlarını görüntüleme ve yönetme');
addBullet('Yeni çalışan ekleme');
addBullet('Performans raporlarını görüntüleme');
addBullet('Aktivite türleri ve puan değerlerini yapılandırma');
addBullet('Şirket içi mesajlaşma');
doc.moveDown(0.5);

addSubheading('Çalışan');
addParagraph('Günlük işlerini takip eden ve performansını kaydeden kullanıcıdır.');
addBullet('Mesai başlatma ve bitirme');
addBullet('Aktivite ve satış kaydı');
addBullet('Kendi performans özetini görüntüleme');
addBullet('Dahili mesajlaşma');

newPage();
addHeading('4. GİRİŞ YAPMA');
addParagraph('Sisteme erişmek için aşağıdaki adımları izleyin:');
doc.moveDown(0.3);
addNumbered(1, 'Web tarayıcınızda uygulama adresini açın');
addNumbered(2, 'Kullanıcı adınızı girin');
addNumbered(3, 'Şifrenizi girin');
addNumbered(4, '"Giriş Yap" butonuna tıklayın');
doc.moveDown(0.5);
addParagraph('Giriş başarılı olduğunda, rolünüze göre ana panel görüntülenecektir.');
doc.moveDown(0.5);
addSubheading('Önemli Notlar');
addBullet('Şifrenizi kimseyle paylaşmayın');
addBullet('Ortak kullanılan cihazlarda çıkış yapmayı unutmayın');
addBullet('Şifrenizi unuttuysanız yöneticinize başvurun');

doc.moveDown(1);
addHeading('5. ANA PANEL (DASHBOARD)');
addParagraph('Giriş yaptıktan sonra karşınıza çıkan ana ekrandır. Rolünüze göre farklı sekmeler görüntülenir:');
doc.moveDown(0.3);
addSubheading('Çalışan Paneli');
addBullet('Performans - Mesai ve aktivite takibi');
addBullet('Sohbet - Dahili mesajlaşma');
doc.moveDown(0.3);
addSubheading('Yönetici Paneli');
addBullet('Ana Sayfa - Genel özet');
addBullet('Performans - Mesai ve aktivite takibi');
addBullet('Raporlar - Çalışan performans raporları');
addBullet('Kullanıcılar - Çalışan yönetimi');
addBullet('Ayarlar - Puan yapılandırması');
addBullet('Sohbet - Dahili mesajlaşma');

newPage();
addHeading('6. MESAİ TAKİBİ');
addParagraph('Çalışanlar, iş günlerinde mesai başlatıp bitirebilirler. Sistem, GPS konumunu kaydeder.');
doc.moveDown(0.5);
addSubheading('Mesai Başlatma');
addNumbered(1, '"Performans" sekmesine gidin');
addNumbered(2, '"Mesaiye Başla" butonuna tıklayın');
addNumbered(3, 'Konum izni isteği gelirse "İzin Ver" seçin');
addNumbered(4, 'Mesai başlangıç saati ve konumunuz kaydedilir');
doc.moveDown(0.5);
addSubheading('Mesai Bitirme');
addNumbered(1, '"Mesaiyi Bitir" butonuna tıklayın');
addNumbered(2, 'Konum izni onaylandığında mesai sonlandırılır');
addNumbered(3, 'Toplam çalışma süresi otomatik hesaplanır');
doc.moveDown(0.5);
addSubheading('Mesai Bilgileri');
addBullet('Başlangıç saati ve konumu');
addBullet('Bitiş saati ve konumu');
addBullet('Toplam çalışma süresi');

doc.moveDown(1);
addHeading('7. AKTİVİTE VE SATIŞ KAYDI');
addParagraph('Mesai sırasında yapılan aktiviteler ve satışlar kaydedilebilir.');
doc.moveDown(0.5);
addSubheading('Aktivite Başlatma');
addNumbered(1, 'Aktivite listesinden bir tür seçin');
addNumbered(2, '"Başlat" butonuna tıklayın');
addNumbered(3, 'Aktivite zamanlayıcısı başlar');
doc.moveDown(0.3);
addSubheading('Aktivite Bitirme');
addNumbered(1, '"Bitir" butonuna tıklayın');
addNumbered(2, 'İsterseniz not ekleyin');
addNumbered(3, 'Aktivite süresi ve puanı kaydedilir');
doc.moveDown(0.3);
addSubheading('Satış Kaydı');
addBullet('Satış türünü seçin');
addBullet('Miktar girin');
addBullet('Kaydet butonuna tıklayın');

newPage();
addHeading('8. DAHİLİ MESAJLAŞMA');
addParagraph('Şirket içi kullanıcılarla anlık mesajlaşma yapabilirsiniz.');
doc.moveDown(0.5);
addSubheading('Mesaj Gönderme');
addNumbered(1, '"Sohbet" sekmesine gidin');
addNumbered(2, 'Sol panelden konuşmak istediğiniz kişiyi seçin');
addNumbered(3, 'Mesajınızı yazın ve gönderin');
doc.moveDown(0.3);
addSubheading('Dosya Paylaşımı');
addBullet('Ataç ikonuna tıklayarak dosya seçin');
addBullet('Kamera ikonuyla anlık fotoğraf çekin');
addBullet('Maksimum dosya boyutu: 10MB');
addBullet('Desteklenen formatlar: Görseller, PDF, Word, Excel');
doc.moveDown(0.3);
addSubheading('Özellikler');
addBullet('Okundu bilgisi');
addBullet('Dosya indirme');
addBullet('Arama fonksiyonu');

doc.moveDown(1);
addHeading('9. RAPORLAR (YÖNETİCİ)');
addParagraph('Yöneticiler, çalışanların performansını detaylı raporlarla takip edebilir.');
doc.moveDown(0.5);
addSubheading('Rapor Filtreleri');
addBullet('Çalışan seçimi - Tüm çalışanlar veya belirli bir çalışan');
addBullet('Tarih filtresi - Bugün, Bu Hafta, Bu Ay');
doc.moveDown(0.3);
addSubheading('Rapor İçeriği');
addBullet('Toplam çalışma süresi');
addBullet('Mesai sayısı');
addBullet('Aktivite sayısı ve süreleri');
addBullet('Satış adetleri');
addBullet('Toplam kazanılan puanlar');
addBullet('Çalışan bazlı performans karşılaştırması');

newPage();
addHeading('10. PUAN AYARLARI');
addParagraph('Yöneticiler, aktivite ve satış türlerinin puan değerlerini yapılandırabilir.');
doc.moveDown(0.5);
addSubheading('Yeni Tür Ekleme');
addNumbered(1, '"Ayarlar" sekmesine gidin');
addNumbered(2, '"Yeni Tür Ekle" butonuna tıklayın');
addNumbered(3, 'Tür adını girin');
addNumbered(4, 'Kategori seçin (Aktivite veya Satış)');
addNumbered(5, 'Puan değerini belirleyin');
addNumbered(6, '"Ekle" butonuna tıklayın');
doc.moveDown(0.3);
addSubheading('Tür Düzenleme');
addBullet('Listeden düzenlemek istediğiniz türün yanındaki kalem ikonuna tıklayın');
addBullet('Değişiklikleri yapın ve kaydedin');

doc.moveDown(1);
addHeading('11. KULLANICI YÖNETİMİ');
addParagraph('Yöneticiler ve Süper Adminler kullanıcı ekleyip yönetebilir.');
doc.moveDown(0.5);
addSubheading('Yeni Kullanıcı Ekleme');
addNumbered(1, '"Kullanıcılar" sekmesine gidin');
addNumbered(2, '"Yeni Kullanıcı" butonuna tıklayın');
addNumbered(3, 'Gerekli bilgileri doldurun:');
doc.moveDown(0.2);
addBullet('Kullanıcı adı');
addBullet('Şifre');
addBullet('Ad Soyad');
addBullet('Rol (Çalışan/Yönetici)');
addBullet('Departman');
addBullet('Şirket (Süper Admin için)');
addNumbered(4, '"Ekle" butonuna tıklayın');

newPage();
addHeading('12. ŞİRKET YÖNETİMİ (SÜPER ADMİN)');
addParagraph('Süper Adminler yeni şirketler oluşturabilir.');
doc.moveDown(0.5);
addSubheading('Yeni Şirket Ekleme');
addNumbered(1, '"Şirketler" sekmesine gidin');
addNumbered(2, '"Yeni Şirket" butonuna tıklayın');
addNumbered(3, 'Şirket bilgilerini girin:');
addBullet('Şirket adı');
addBullet('Adres');
addBullet('Telefon');
addBullet('E-posta');
addNumbered(4, '"Ekle" butonuna tıklayın');

doc.moveDown(1);
addHeading('13. SIK SORULAN SORULAR');
doc.moveDown(0.5);

addSubheading('Şifremi unuttum, ne yapmalıyım?');
addParagraph('Şifre sıfırlama için yöneticinize veya sistem yöneticisine başvurun.');

addSubheading('Mesai başlatırken konum hatası alıyorum');
addParagraph('Tarayıcınızın konum iznini kontrol edin. Ayarlardan konum erişimine izin verin.');

addSubheading('Fotoğraf yükleyemiyorum');
addParagraph('Dosya boyutunun 10MB\'ı geçmediğinden ve desteklenen bir format olduğundan emin olun.');

addSubheading('Mesajlarım gitmiyor');
addParagraph('İnternet bağlantınızı kontrol edin. Sayfa yenileme deneyin.');

addSubheading('Raporlarda verilerim görünmüyor');
addParagraph('Tarih filtresini kontrol edin. Doğru tarih aralığının seçili olduğundan emin olun.');

newPage();
doc.moveDown(5);
addTitle('İLETİŞİM VE DESTEK');
doc.moveDown(2);
addParagraph('Teknik destek ve sorularınız için sistem yöneticinize başvurabilirsiniz.');
doc.moveDown(2);
doc.fontSize(10).fillColor(colors.secondary).text('Bu belge otomatik olarak oluşturulmuştur.', { align: 'center' });
doc.text(`Oluşturma Tarihi: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}`, { align: 'center' });

doc.end();

writeStream.on('finish', () => {
  console.log(`PDF başarıyla oluşturuldu: ${outputPath}`);
});
