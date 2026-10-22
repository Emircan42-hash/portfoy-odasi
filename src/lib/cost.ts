// Gerçek maliyet kartı. Varsayılanlar Türkiye piyasası için yaklaşık değerlerdir;
// danışman kendi ofisinin oranlarını girdiğinde buradan değişir.

export const DEFAULTS = {
  rentCommissionMonths: 1, // kiralıkta komisyon: 1 kira
  vatRate: 0.2, // komisyon KDV'si
  depositMonths: 2, // depozito girilmemişse: 2 kira
  saleCommissionRate: 0.02, // satılıkta alıcı komisyonu %2 + KDV
  titleDeedFeeRate: 0.02, // tapu harcı alıcı payı %2 (toplam %4)
  downPaymentRate: 0.25, // peşinat %25
  loanMonthlyRate: 0.027, // aylık faiz, yaklaşık
  loanMonths: 120,
};

export type RentCost = {
  kind: "RENT";
  monthlyRent: number;
  monthlyDues: number;
  monthlyTotal: number;
  deposit: number;
  commission: number;
  moveInTotal: number; // ilk ay: kira + aidat + depozito + komisyon
};

export type SaleCost = {
  kind: "SALE";
  price: number;
  titleDeedFee: number;
  commission: number;
  cashTotal: number; // fiyat + harç + komisyon
  downPayment: number;
  loanAmount: number;
  monthlyInstallment: number;
  loanMonths: number;
  monthlyDues: number;
};

export function rentCost(input: { price: number; dues?: number | null; deposit?: number | null }): RentCost {
  const monthlyRent = input.price;
  const monthlyDues = input.dues ?? 0;
  const deposit = input.deposit ?? monthlyRent * DEFAULTS.depositMonths;
  const commission = Math.round(monthlyRent * DEFAULTS.rentCommissionMonths * (1 + DEFAULTS.vatRate));
  return {
    kind: "RENT",
    monthlyRent,
    monthlyDues,
    monthlyTotal: monthlyRent + monthlyDues,
    deposit,
    commission,
    moveInTotal: monthlyRent + monthlyDues + deposit + commission,
  };
}

export function saleCost(input: { price: number; dues?: number | null }): SaleCost {
  const price = input.price;
  const titleDeedFee = Math.round(price * DEFAULTS.titleDeedFeeRate);
  const commission = Math.round(price * DEFAULTS.saleCommissionRate * (1 + DEFAULTS.vatRate));
  const downPayment = Math.round(price * DEFAULTS.downPaymentRate);
  const loanAmount = price - downPayment;
  const r = DEFAULTS.loanMonthlyRate;
  const n = DEFAULTS.loanMonths;
  // Eşit taksitli (annüite) kredi formülü
  const monthlyInstallment = Math.round((loanAmount * r) / (1 - Math.pow(1 + r, -n)));
  return {
    kind: "SALE",
    price,
    titleDeedFee,
    commission,
    cashTotal: price + titleDeedFee + commission,
    downPayment,
    loanAmount,
    monthlyInstallment,
    loanMonths: n,
    monthlyDues: input.dues ?? 0,
  };
}
