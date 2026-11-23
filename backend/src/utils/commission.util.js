/**
 * Utilitaire de calcul de la commission plateforme MoversGo
 * Règle de transparence administrative :
 * - 2% du Total TTC pour chaque tranche de 10% d'acompte exigé
 * - Exemple 10% d'acompte : 2% commission MoversGo + 8% net entreprise
 * - Exemple 20% d'acompte : 4% commission MoversGo + 16% net entreprise
 * - Exemple 30% d'acompte : 6% commission MoversGo + 24% net entreprise
 * - Exemple 40% d'acompte : 8% commission MoversGo + 32% net entreprise
 * - Exemple 50% d'acompte : 10% commission MoversGo + 40% net entreprise
 * - Exemple 60% d'acompte : 12% commission MoversGo + 48% net entreprise
 *
 * Sur le montant de l'acompte versé, la commission représente 20% (soit 2/10),
 * et la part nette revenant au transporteur sur l'acompte représente 80% (soit 8/10).
 * Le solde restant dû à la livraison revient à 100% au transporteur.
 */
function calculateCommission({ totalPrice, depositPercent, depositAmount }) {
  const total = Math.max(0, parseFloat(totalPrice) || 0);
  let pct = parseFloat(depositPercent);
  if (isNaN(pct) || pct <= 0) {
    if (depositAmount && total > 0) {
      pct = Math.round((depositAmount / total) * 100);
    } else {
      pct = 10;
    }
  }

  const deposit =
    depositAmount != null && !isNaN(depositAmount) && depositAmount > 0
      ? parseFloat(depositAmount)
      : Math.round(total * (pct / 100) * 100) / 100;

  // Taux de commission prélevé par rapport au Total TTC : (pct / 10) * 0.02
  const commissionRateOnTTC = (pct / 10) * 0.02;
  const commissionPercentOnTTC = Math.round(commissionRateOnTTC * 1000) / 10;

  // Montant de la commission plateforme prélevée sur l'acompte (20% de l'acompte)
  const platformFee = Math.round(deposit * 0.2 * 100) / 100;

  // Montant net de l'acompte revenant au déménageur (80% de l'acompte)
  const netToCompanyDeposit = Math.max(0, Math.round((deposit - platformFee) * 100) / 100);

  // Pourcentage net sur l'acompte par rapport au Total TTC (ex: 8%, 16%, 24%)
  const netPercentOnTTC = Math.max(0, Math.round((pct - commissionPercentOnTTC) * 10) / 10);

  // Solde restant TTC dû à la livraison (revient à 100% au déménageur)
  const remainingAmount = Math.max(0, Math.round((total - deposit) * 100) / 100);

  // Total net que le déménageur percevra sur toute l'opération
  const totalNetToCompany = Math.max(0, Math.round((total - platformFee) * 100) / 100);

  return {
    depositPercent: pct,
    depositAmount: deposit,
    commissionRateOnTTC,
    commissionPercentOnTTC,
    platformFee,
    platformFeeRate: 0.2,
    netToCompanyDeposit,
    netPercentOnTTC,
    remainingAmount,
    totalNetToCompany,
  };
}

module.exports = {
  calculateCommission,
};
