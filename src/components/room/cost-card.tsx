import { rentCost, saleCost, DEFAULTS } from "@/lib/cost";
import { formatTL } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  property: { listingType: "RENT" | "SALE"; price: number; dues: number | null; deposit: number | null };
};

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? "font-semibold" : ""}`}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/** Gerçek maliyet: ilan fiyatının yanında ödenecek her şey. */
export function CostCard({ property }: Props) {
  if (property.listingType === "RENT") {
    const c = rentCost(property);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerçek maliyet</CardTitle>
          <CardDescription>Taşınırken ve her ay ödeyecekleriniz.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5 text-sm">
          <Row label="Kira" value={`${formatTL(c.monthlyRent)} / ay`} />
          <Row label="Aidat" value={`${formatTL(c.monthlyDues)} / ay`} />
          <Row label="Aylık toplam" value={`${formatTL(c.monthlyTotal)} / ay`} strong />
          <div className="my-1 border-t" />
          <Row label="Depozito" value={formatTL(c.deposit)} />
          <Row label={`Komisyon (${DEFAULTS.rentCommissionMonths} kira + KDV)`} value={formatTL(c.commission)} />
          <Row label="Taşınırken toplam" value={formatTL(c.moveInTotal)} strong />
          <p className="pt-2 text-xs text-muted-foreground">Komisyon ve depozito ofisin standart oranlarıdır; danışmanınızla netleştirin.</p>
        </CardContent>
      </Card>
    );
  }

  const c = saleCost(property);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerçek maliyet</CardTitle>
        <CardDescription>Fiyatın üstüne gelenler ve kredi senaryosu.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 text-sm">
        <Row label="Satış fiyatı" value={formatTL(c.price)} />
        <Row label="Tapu harcı (alıcı payı %2)" value={formatTL(c.titleDeedFee)} />
        <Row label="Komisyon (%2 + KDV)" value={formatTL(c.commission)} />
        <Row label="Peşin toplam" value={formatTL(c.cashTotal)} strong />
        <div className="my-1 border-t" />
        <Row label={`Peşinat (%${DEFAULTS.downPaymentRate * 100})`} value={formatTL(c.downPayment)} />
        <Row label={`Kredi (${c.loanMonths} ay, aylık %${(DEFAULTS.loanMonthlyRate * 100).toFixed(2)})`} value={formatTL(c.loanAmount)} />
        <Row label="Aylık taksit" value={`${formatTL(c.monthlyInstallment)} / ay`} strong />
        {c.monthlyDues > 0 && <Row label="Aidat" value={`${formatTL(c.monthlyDues)} / ay`} />}
        <p className="pt-2 text-xs text-muted-foreground">Faiz ve oranlar yaklaşık varsayımdır; bankanızın güncel teklifiyle değişir.</p>
      </CardContent>
    </Card>
  );
}
