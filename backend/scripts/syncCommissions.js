/**
 * Script de synchronisation des commissions selon la règle progressive :
 * 2% du Total TTC pour chaque 10% d'acompte (soit 20% de l'acompte consigné)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../src/models/Booking');
const Quote = require('../src/models/Quote');
const Payment = require('../src/models/Payment');
const Transaction = require('../src/models/Transaction');
const Invoice = require('../src/models/Invoice');
const { calculateCommission } = require('../src/utils/commission.util');

async function sync() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/moveflow_tn';
  console.log('Connexion à MongoDB...', uri);
  await mongoose.connect(uri);

  const bookings = await Booking.find({}).populate('quote');
  console.log(`Trouvé ${bookings.length} réservation(s).`);

  for (const b of bookings) {
    const fin = calculateCommission({
      totalPrice: b.totalAmount,
      depositPercent: b.depositPercent || b.quote?.depositPercent,
      depositAmount: b.depositAmount,
    });

    console.log(`Réservation #${b._id} - TTC: ${fin.totalPrice || b.totalAmount} DT, Acompte: ${fin.depositPercent}%, Montant: ${fin.depositAmount} DT -> Commission MoversGo: ${fin.platformFee} DT, Net Entreprise: ${fin.netToCompanyDeposit} DT`);

    b.platformFee = fin.platformFee;
    b.netToCompany = fin.netToCompanyDeposit;
    b.depositAmount = fin.depositAmount;
    b.depositPercent = fin.depositPercent;
    b.remainingAmount = fin.remainingAmount;
    await b.save();

    // Sync payments
    await Payment.updateMany(
      { booking: b._id },
      {
        $set: {
          platformFee: fin.platformFee,
          netToCompany: fin.netToCompanyDeposit,
          platformFeeRate: fin.commissionRateOnTTC,
        },
      }
    );

    // Sync transactions
    await Transaction.updateMany(
      { booking: b._id },
      {
        $set: {
          platformFee: fin.platformFee,
          netToCompany: fin.netToCompanyDeposit,
          platformFeeRate: fin.commissionRateOnTTC,
        },
      }
    );

    // Sync invoices
    await Invoice.updateMany(
      { booking: b._id },
      {
        $set: {
          depositCommissionRate: fin.commissionRateOnTTC,
          depositCommissionAmount: fin.platformFee,
          depositNetToCompany: fin.netToCompanyDeposit,
        },
      }
    );
  }

  console.log('✅ Synchronisation des commissions terminée avec succès !');
  await mongoose.disconnect();
}

sync().catch((err) => {
  console.error('Erreur synchronisation:', err);
  process.exit(1);
});
