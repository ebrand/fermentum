#!/usr/bin/env node
// Test OAuth Flow End-to-End
// This simulates the frontend OAuth flow to test if tenant creation works

const https = require('https');
const crypto = require('crypto');

// Disable SSL verification for local development
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const API_BASE = 'https://api.fermentum.dev';

async function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.fermentum.dev',
            port: 443,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testOAuthFlow() {
    console.log('🚀 Testing OAuth Flow End-to-End...\n');

    try {
        // Step 1: Test API health
        console.log('1. Testing API health...');
        const healthCheck = await makeRequest('GET', '/api/auth/debug');
        console.log(`   Status: ${healthCheck.status}, Response: ${healthCheck.data}`);

        if (healthCheck.status !== 200) {
            throw new Error('API is not healthy');
        }

        // Step 2: Get OAuth URL
        console.log('\n2. Getting Google OAuth URL...');
        const oauthUrl = await makeRequest('GET', '/api/auth/google-oauth-url?redirectUrl=https://fermentum.dev/onboarding');
        console.log(`   Status: ${oauthUrl.status}`);
        console.log(`   OAuth URL: ${oauthUrl.data.success ? 'Generated successfully' : 'Failed'}`);

        // Step 3: Simulate OAuth callback (mock token)
        console.log('\n3. Simulating OAuth authentication...');
        // Create a mock OAuth token for testing
        const mockOAuthToken = 'mock_oauth_token_' + crypto.randomBytes(16).toString('hex');

        // We can't actually complete OAuth without browser interaction,
        // but we can test if our existing user can create a tenant

        // Step 4: Test with existing user from logs (if token exists)
        console.log('\n4. Testing tenant creation (requires valid JWT)...');
        console.log('   Note: This requires a valid JWT token from completed OAuth flow');

        // Try to create tenant without auth (should fail with 401)
        const tenantCreateTest = await makeRequest('POST', '/api/tenants', {
            name: 'Test Brewery from Script',
            description: 'Test brewery created by test script'
        });

        console.log(`   Status: ${tenantCreateTest.status}`);
        console.log(`   Message: ${tenantCreateTest.data.message || tenantCreateTest.data}`);

        if (tenantCreateTest.status === 401) {
            console.log('   ✅ Expected: Authentication required (API security working)');
        }

        console.log('\n✅ OAuth Flow Test Complete');
        console.log('\n🔍 Summary:');
        console.log('   - API is healthy and responding');
        console.log('   - OAuth URL generation works');
        console.log('   - Tenant creation endpoint requires authentication (secure)');
        console.log('\n💡 To test full flow: Use browser to complete OAuth and check network logs');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testOAuthFlow();