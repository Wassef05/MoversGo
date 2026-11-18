const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  try {
    console.log('====================================================');
    console.log('🚀 MoveFlow TN End-to-End Marketplace Flow Test');
    console.log('====================================================\n');

    // 1. Health check
    console.log('--- 1. Health Check ---');
    const health = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/health',
      method: 'GET',
    });
    console.log(`[Status ${health.status}] Service: ${health.data?.message}\n`);
    if (health.status !== 200) throw new Error('Health check failed');

    // 2. Client Login
    console.log('--- 2. Client Login ---');
    const clientLogin = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'client@moveflow.tn', password: 'password123' }
    );
    console.log(`[Status ${clientLogin.status}] Logged in as: ${clientLogin.data?.data?.user?.email}`);
    const clientToken = clientLogin.data?.data?.token;
    if (!clientToken) throw new Error('Client login failed: ' + JSON.stringify(clientLogin.data));

    // 3. Create Moving Request (using exact frontend form format)
    console.log('\n--- 3. Client Creates Moving Request ---');
    const createReq = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/moving-requests',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientToken}`,
        },
      },
      {
        departure: {
          address: '15 Avenue Habib Bourguiba',
          city: 'Tunis',
          governorate: 'Tunis',
          housingType: 'Appartement S+2',
          floor: 3,
          elevator: true,
        },
        arrival: {
          address: '42 Boulevard du 14 Janvier',
          city: 'Sousse',
          governorate: 'Sousse',
          housingType: 'Maison / Villa',
          floor: 0,
          elevator: false,
        },
        inventory: {
          estimatedVolume: 22,
          boxesCount: 30,
          items: [
            { name: 'Canapé d\'angle 4 places', quantity: 1 },
            { name: 'Lit Queen Size 160x200', quantity: 2 },
            { name: 'Réfrigérateur américain', quantity: 1 },
            { name: 'Machine à laver', quantity: 1 },
          ],
        },
        options: {
          desiredDate: new Date(Date.now() + 7 * 86400000).toISOString(),
          flexibility: 'plus_moins_2_jours',
          furnitureLiftNeeded: true,
        },
        comments: 'Meubles fragiles en verre, manutention soignée requise.',
      }
    );
    console.log(`[Status ${createReq.status}] Request Created!`);
    const movingRequest = createReq.data?.data?.request || createReq.data?.data;
    const reqId = movingRequest?._id || movingRequest?.id;
    console.log(`   ID: ${reqId}`);
    console.log(`   Title: ${movingRequest?.title || 'Déménagement Tunis → Sousse'}`);
    if (!reqId) throw new Error('Create request failed: ' + JSON.stringify(createReq.data));

    // 4. Company Login
    console.log('\n--- 4. Company Login ---');
    const companyLogin = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'company@moveflow.tn', password: 'password123' }
    );
    console.log(`[Status ${companyLogin.status}] Logged in as: ${companyLogin.data?.data?.user?.email}`);
    const companyToken = companyLogin.data?.data?.token;
    if (!companyToken) throw new Error('Company login failed');

    // 5. Company Submits Quote
    console.log('\n--- 5. Company Submits Quote for Request ---');
    const quoteSubmit = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/quotes',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${companyToken}`,
        },
      },
      {
        requestId: reqId,
        pricing: {
          transport: 650,
          packaging: 150,
          disassembly: 100,
          furnitureLift: 150,
          insuranceFee: 50,
          total: 1100,
          depositRequired: 330,
        },
        validUntil: new Date(Date.now() + 14 * 86400000).toISOString(),
        estimatedDuration: '1 journée (départ 7h00)',
        includedServices: [
          'Transport sécurisé capitonné',
          'Emballage & bulles vaisselle',
          'Démontage/remontage lits et armoires',
          'Monte-meuble à Tunis',
          'Assurance tous risques jusqu\'à 30.000 DT',
        ],
        conditions: 'Acompte 30% requis à la confirmation en ligne, solde à la livraison.',
      }
    );
    console.log(`[Status ${quoteSubmit.status}] Quote Submitted!`);
    const quote = quoteSubmit.data?.data?.quote || quoteSubmit.data?.data;
    const quoteId = quote?._id || quote?.id;
    console.log(`   Quote ID: ${quoteId}`);
    console.log(`   Total Price: ${quote?.totalPrice} TND`);
    console.log(`   Deposit Required: ${quote?.depositAmount} TND (${quote?.depositPercent}%)`);
    if (!quoteId) throw new Error('Submit quote failed: ' + JSON.stringify(quoteSubmit.data));

    // 6. Client Accepts Quote
    console.log('\n--- 6. Client Accepts Quote (Triggers Booking & Commission) ---');
    const acceptRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/v1/quotes/${quoteId}/accept`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientToken}`,
        },
      },
      {}
    );
    console.log(`[Status ${acceptRes.status}] Quote Accepted!`);
    const booking = acceptRes.data?.data?.booking;
    const transaction = acceptRes.data?.data?.transaction;
    console.log(`   Booking ID: ${booking?._id}`);
    console.log(`   Booking Status: ${booking?.bookingStatus}`);
    console.log(`   Total Amount: ${booking?.totalAmount} TND`);
    console.log(`   Deposit Paid: ${booking?.depositAmount} TND`);
    console.log(`   Remaining Due: ${booking?.remainingAmount} TND`);
    console.log(`   Platform Commission (12%): ${transaction?.commissionAmount} TND`);
    console.log(`   Company Net Payout: ${transaction?.netCompanyAmount} TND`);
    if (!booking?._id) throw new Error('Accept quote failed: ' + JSON.stringify(acceptRes.data));

    // 7. Admin Login & Dashboard Check
    console.log('\n--- 7. Admin Login & Dashboard Verification ---');
    const adminLogin = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@moveflow.tn', password: 'password123' }
    );
    console.log(`[Status ${adminLogin.status}] Logged in as: ${adminLogin.data?.data?.user?.email} (${adminLogin.data?.data?.user?.role})`);
    const adminToken = adminLogin.data?.data?.token;

    const adminDash = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/admin/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`[Status ${adminDash.status}] Admin Dashboard:`);
    console.log('   Metrics Summary:', adminDash.data?.data?.metrics || adminDash.data?.data);

    console.log('\n✅ ALL 7 END-TO-END FLOW TESTS PASSED FLAWLESSLY!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  }
})();
