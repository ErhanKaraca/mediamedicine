export function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4">Hakkımızda</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Mediamedicine, Türkiye'nin tıp ve sağlık profesyonelleri için tasarlanmış özel sosyal medya platformudur.
      </p>

      <div className="prose prose-sm max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-3">Misyonumuz</h2>
          <p className="text-muted-foreground leading-relaxed">
            Sağlık profesyonellerinin kanıta dayalı bilgiyi paylaşmasını, meslektaşlarıyla bağlantı kurmasını
            ve tıp dünyasındaki gelişmeleri takip etmesini kolaylaştırmak. Her içerik, bilimsel referanslarla
            desteklenebilir; her kullanıcı, KYC doğrulama süreciyle güvenilir bir kimlik kazanabilir.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">Neden Mediamedicine?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Genel sosyal medya platformları, tıp profesyonellerinin ihtiyaçlarını karşılamaktan uzaktır.
            Mediamedicine; doğrulanmış profesyonel kimlikler, kanıt referanslama (DOI, PMID), uzmanlık
            bazlı gruplar ve medikal içerik moderasyonu ile bu açığı kapatmayı hedefler.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">Değerlerimiz</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><strong className="text-foreground">Güvenilirlik:</strong> Her içerik ve her kullanıcı doğrulanabilir olmalı</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><strong className="text-foreground">Kanıta dayalılık:</strong> Bilimsel temelli, referanslı içerik paylaşımı</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><strong className="text-foreground">Profesyonellik:</strong> Tıp etiğine uygun, hasta mahremiyetine saygılı</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><strong className="text-foreground">Erişilebilirlik:</strong> Tüm sağlık profesyonelleri için açık, engelsiz platform</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">Ekip</h2>
          <p className="text-muted-foreground leading-relaxed">
            Mediamedicine, sağlık profesyonelleri ve yazılım mühendislerinden oluşan multidisipliner bir
            ekip tarafından geliştirilmektedir. Amacımız, teknolojiyi sağlık hizmetlerinin kalitesini
            artırmak için kullanmak.
          </p>
        </section>
      </div>
    </div>
  )
}
