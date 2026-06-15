export function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">Gizlilik Politikası</h1>
      <p className="text-muted-foreground mb-8">Son güncelleme: 1 Ocak 2026</p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-bold mb-3">1. Genel Bilgiler</h2>
          <p className="text-muted-foreground">
            Bu Gizlilik Politikası, Mediamedicine platformunu ("Platform", "Biz") kullanmanız
            sırasında toplanan kişisel verilerinizin nasıl işlendiğini açıklamaktadır. 6698 sayılı
            Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla hareket etmekteyiz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">2. Toplanan Veriler</h2>
          <p className="text-muted-foreground mb-2">Platform kullanımınız sırasında şu veriler toplanabilir:</p>
          <ul className="space-y-1.5 text-muted-foreground list-disc list-inside ml-2">
            <li>Kimlik bilgileri (ad, soyad, e-posta adresi)</li>
            <li>Profesyonel bilgiler (uzmanlık, kurum, diploma bilgileri)</li>
            <li>İçerik verileri (paylaştığınız gönderiler, yorumlar, mesajlar)</li>
            <li>Kullanım verileri (oturum bilgileri, aktivite günlükleri)</li>
            <li>Cihaz ve bağlantı bilgileri (IP adresi, tarayıcı türü)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">3. Verilerin Kullanım Amaçları</h2>
          <ul className="space-y-1.5 text-muted-foreground list-disc list-inside ml-2">
            <li>Platform hizmetlerinin sağlanması ve iyileştirilmesi</li>
            <li>Kullanıcı kimlik doğrulama ve güvenlik</li>
            <li>Kişiselleştirilmiş içerik önerileri</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>İletişim ve bildirimler</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">4. Verilerin Paylaşımı</h2>
          <p className="text-muted-foreground">
            Kişisel verileriniz; açık rızanız olmaksızın üçüncü taraflarla paylaşılmaz. Yasal
            zorunluluklar, mahkeme kararları veya yetkili makamların talepleri doğrultusunda
            paylaşım gerekebilir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">5. KVKK Kapsamındaki Haklarınız</h2>
          <ul className="space-y-1.5 text-muted-foreground list-disc list-inside ml-2">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik veya yanlış işlenmiş ise düzeltilmesini isteme</li>
            <li>Silinmesini veya yok edilmesini isteme</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">6. Çerezler</h2>
          <p className="text-muted-foreground">
            Platform; oturum yönetimi, tercih hatırlama ve analitik amaçlarla çerezler kullanmaktadır.
            Tarayıcınızın ayarlarından çerez tercihlerinizi yönetebilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">7. İletişim</h2>
          <p className="text-muted-foreground">
            Gizlilik politikamız hakkında sorularınız için:{' '}
            <a href="mailto:privacy@mediamedicine.com" className="text-primary hover:underline">
              privacy@mediamedicine.com
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
