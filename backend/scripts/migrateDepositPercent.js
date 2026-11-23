const path = require('path');
const mongoose = require('../node_modules/mongoose');
require('../node_modules/dotenv').config({ path: path.join(__dirname, '../.env') });

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/moversgo';
  console.log('Connecting to', uri);
  await mongoose.connect(uri);
  console.log('Connected to DB');

  const quotes = await mongoose.connection.collection('quotes').find({}).toArray();
  console.log(`Found ${quotes.length} quotes`);
  for (const q of quotes) {
    let pct = q.depositPercent;
    if (!pct && q.totalPrice > 0 && q.depositAmount > 0) {
      pct = Math.round((q.depositAmount / q.totalPrice) * 100);
      await mongoose.connection.collection('quotes').updateOne(
        { _id: q._id },
        { $set: { depositPercent: pct } }
      );
      console.log('Updated Quote', q._id, 'to depositPercent:', pct);
    } else {
      console.log('Quote', q._id, 'depositPercent is', pct);
    }
  }

  const bookings = await mongoose.connection.collection('bookings').find({}).toArray();
  console.log(`Found ${bookings.length} bookings`);
  for (const b of bookings) {
    let pct = b.depositPercent;
    let newPct = pct;
    if (b.quote) {
      const q = await mongoose.connection.collection('quotes').findOne({ _id: b.quote });
      if (q && q.depositPercent) newPct = q.depositPercent;
    }
    if (!newPct && b.totalAmount > 0 && b.depositAmount > 0) {
      newPct = Math.round((b.depositAmount / b.totalAmount) * 100);
    }
    newPct = newPct || 30;
    await mongoose.connection.collection('bookings').updateOne(
      { _id: b._id },
      { $set: { depositPercent: newPct } }
    );
    console.log('Updated Booking', b._id, 'from', pct, 'to depositPercent:', newPct);
  }

  console.log('Migration finished successfully!');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
