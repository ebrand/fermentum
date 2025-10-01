// QuickBooks Online API Test Script
// This simulates the sync process to identify 400 errors

const https = require('https');

// QuickBooks configuration from CLAUDE.md
const QBO_CONFIG = {
  clientId: 'Q0bHwCIDaVyZ7BJmHYtdCO0HhlhZfWg73UCCsixYimTTHOxnQk',
  clientSecret: '5QnG6TL4CYRgVoH1K5eLKHG3DEchK0g4H0L6K6gW',
  baseUrl: 'https://sandbox-quickbooks.api.intuit.com',
  environment: 'sandbox'
};

// Test data - you would need actual tokens from a real OAuth flow
const TEST_AUTH_DATA = {
  accessToken: 'YOUR_ACCESS_TOKEN_HERE', // Replace with real token
  refreshToken: 'YOUR_REFRESH_TOKEN_HERE', // Replace with real token
  realmId: 'YOUR_REALM_ID_HERE' // Replace with real realm ID
};

async function testQuickBooksAPI() {
  console.log('🔄 [QBO TEST] Starting QuickBooks API test');
  console.log('🔄 [QBO TEST] Environment: sandbox');
  console.log('🔄 [QBO TEST] Base URL:', QBO_CONFIG.baseUrl);

  // Test endpoints that typically cause 400 errors
  const endpoints = [
    '/v3/company/{realmId}/accounts',
    '/v3/company/{realmId}/customers',
    '/v3/company/{realmId}/companyinfo/{realmId}'
  ];

  for (const endpoint of endpoints) {
    const fullEndpoint = endpoint.replace('{realmId}', TEST_AUTH_DATA.realmId);
    const requestUrl = `${QBO_CONFIG.baseUrl}${fullEndpoint}`;

    console.log('\\n🔄 [QBO TEST] Testing endpoint:', requestUrl);

    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_AUTH_DATA.accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'Fermentum/1.0'
      }
    };

    console.log('🔄 [QBO TEST] Request headers:');
    Object.entries(options.headers).forEach(([key, value]) => {
      const displayValue = key === 'Authorization' ? 'Bearer [REDACTED]' : value;
      console.log(`🔄 [QBO TEST]   ${key}: ${displayValue}`);
    });

    try {
      const response = await makeRequest(requestUrl, options);
      console.log('🔄 [QBO TEST] Response:', {
        statusCode: response.statusCode,
        statusMessage: response.statusMessage,
        headers: response.headers,
        bodyLength: response.body.length
      });

      if (response.statusCode !== 200) {
        console.error('🔄 [QBO TEST] ERROR Response body:', response.body);
      } else {
        console.log('🔄 [QBO TEST] SUCCESS - Response preview (first 200 chars):',
                   response.body.substring(0, 200) + '...');
      }
    } catch (error) {
      console.error('🔄 [QBO TEST] Request failed:', error.message);
    }
  }
}

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Common 400 error scenarios for QuickBooks API
function analyzeCommon400Errors() {
  console.log('\\n🔄 [QBO TEST] Common 400 Error Scenarios in QuickBooks API:');
  console.log('1. Invalid or expired access token');
  console.log('2. Missing required query parameters');
  console.log('3. Invalid realmId (company ID)');
  console.log('4. Malformed request headers');
  console.log('5. Invalid date format in query parameters');
  console.log('6. Exceeding rate limits');
  console.log('7. Invalid API version in URL');
  console.log('8. Missing Accept header or wrong content type');
  console.log('\\n🔄 [QBO TEST] To test with real data:');
  console.log('1. Replace TEST_AUTH_DATA with real OAuth tokens');
  console.log('2. Ensure tokens are not expired');
  console.log('3. Verify realmId matches your QuickBooks company');
}

// Run the test
if (require.main === module) {
  console.log('🔄 [QBO TEST] QuickBooks Online API Test Script');
  console.log('🔄 [QBO TEST] This script simulates the API calls that cause 400 errors');
  console.log('\\n⚠️  [QBO TEST] NOTE: You need real OAuth tokens to test successfully');

  analyzeCommon400Errors();

  if (TEST_AUTH_DATA.accessToken === 'YOUR_ACCESS_TOKEN_HERE') {
    console.log('\\n❌ [QBO TEST] Cannot run test - no real tokens provided');
    console.log('🔄 [QBO TEST] Update TEST_AUTH_DATA with real OAuth tokens to test');
  } else {
    testQuickBooksAPI().catch(console.error);
  }
}

module.exports = { testQuickBooksAPI, QBO_CONFIG };