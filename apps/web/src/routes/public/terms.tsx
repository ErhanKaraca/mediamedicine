export function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">Kullanım Koşulları</h1>
      <p className="text-muted-foreground mb-8">Son güncelleme: 1 Ocak 2026</p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-bold mb-3">1. Kabul</h2>
          <p className="text-muted-foreground">
            Mediamedicine platformuna erişmeniz veya kullanmanız, bu Kullanım Koşullarını
            okuduğunuzu, anladığınızı ve kabul ettiğinizi göstermektedir. Bu koşulları kabul
            etmiyorsanız platformu kullanmayınız.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">2. Platform Tanımı</h2>
          <p className="text-muted-foreground">
            Mediamedicine, sağlık profesyonellerinin bilgi paylaşması, mesleki bağlantılar kurması
            ve güncel tıbbi araştırmaları takip etmesi için tasarlanmış bir sosyal ağ platformudur.
            Platform, medikal tavsiye veya teşhis hizmeti vermez.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">3. Hesap Kaydı</h2>
          <ul className="space-y-1.5 text-muted-foreground list-disc list-inside ml-2">
            <li>Kayıt için geçerli bir e-posta adresi gerekmektedir</li>
            <li>Sağlık profesyoneli hesapları KYC doğrulaması gerektirir</li>
            <li>Hesap bilgilerinizin güvenliğinden siz sorumlusunuz</li>
            <li>Tek bir kişi birden fazla hesap oluşturamaz</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">4. Yasaklanan İçerik</h2>
          <p className="text-muted-foreground mb-2">Platformda şunlar yasaktır:</p>
          <ul className="space-y-1.5 text-muted-foreground list-disc list-inside ml-2">
            <li>Hasta gizliliğini ihlal eden paylaşımlar</li>
            <li>Bilimsel dayanaktan yoksun, yanıltıcı sağlık bilgileri</li>
            <li>Ticari amaçlı ilaç veya ürün tanıtımı (onaysız)</li>
            <li>Taciz, nefret söylemi veya ayrımcı içerik</li>
            <li>Telif hakkı ihlali içeren materyaller</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">5. Fikri Mülkiyet</h2>
          <p className="text-muted-foreground">
            Platformda paylaştığınız içeriklerin telif hakkı size aittir. Ancak paylaşımınızla,
            Mediamedicine'e bu içerikleri platform üzerinde gösterme, dağıtma ve kopyalama lisansı
            vermiş olursunuz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">6. Sorumluluk Reddi</h2>
          <p className="text-muted-foreground">
            Platform üzerindeki içerikler tıbbi tavsiye niteliği taşımaz. Herhangi bir sağlık
            kararı için mutlaka nitelikli bir sağlık profesyoneline başvurunuz. Mediamedicine,
            kullanıcı içeriklerinden kaynaklanabilecek zararlardan sorumlu tutulamaz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">7. Hesap Feshi</h2>
          <p className="text-muted-foreground">
            Bu koşulları ihlal etmeniz durumunda hesabınız önceden bildirim yapılmaksızın askıya
            alınabilir veya silinebilir. Hesabınızı dilediğiniz zaman kapatabilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">8. İletişim</h2>
          <p className="text-muted-foreground">
            Kullanım koşulları hakkındaki sorularınız için:{' '}
            <a href="mailto:legal@mediamedicine.com" className="text-primary hover:underline">
              legal@mediamedicine.com
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
