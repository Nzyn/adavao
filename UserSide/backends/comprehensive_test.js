const http = require('http');

console.log('=== COMPREHENSIVE VERIFICATION TEST ===');

// Test 1: Check if backend server is running
console.log('\n1. Testing backend server connectivity...');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/test-connection',
    method: 'GET',
    timeout: 5000
};

const req = http.request(options, (res) => {
    console.log(`   Server response status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            console.log(`   Server response: ${JSON.stringify(result)}`);
        } catch (e) {
            console.log(`   Server response (raw): ${data}`);
        }
        
        // Test 2: Check verification status endpoint
        testVerificationEndpoint();
    });
});

req.on('error', (error) => {
    console.error('   ❌ Server connection failed:', error.message);
    console.log('   Possible issues:');
    console.log('   - Backend server is not running');
    console.log('   - Port 3000 is blocked by firewall');
    console.log('   - Wrong hostname/port configuration');
});

req.on('timeout', () => {
    console.error('   ❌ Server connection timeout');
    req.destroy();
});

req.end();

// Test verification status endpoint
function testVerificationEndpoint() {
    console.log('\n2. Testing verification status endpoint...');
    
    const verificationOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/verification/status/1',
        method: 'GET',
        timeout: 5000
    };
    
    const verificationReq = http.request(verificationOptions, (res) => {
        console.log(`   Verification endpoint status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log(`   Verification response headers: ${JSON.stringify(res.headers)}`);
            console.log(`   Verification response data: ${data}`);
            
            try {
                const result = JSON.parse(data);
                console.log(`   Parsed verification data: ${JSON.stringify(result, null, 2)}`);
            } catch (e) {
                console.log(`   Failed to parse verification response: ${e.message}`);
            }
            
            // Test 3: Check if we can access the actual UserSide backend URL
            testUserSideConfiguration();
        });
    });
    
    verificationReq.on('error', (error) => {
        console.error('   ❌ Verification endpoint failed:', error.message);
    });
    
    verificationReq.on('timeout', () => {
        console.error('   ❌ Verification endpoint timeout');
        verificationReq.destroy();
    });
    
    verificationReq.end();
}

// Test UserSide configuration
function testUserSideConfiguration() {
    console.log('\n3. Testing UserSide backend configuration...');
    
    // Try to read the backend configuration
    try {
        const fs = require('fs');
        const path = require('path');
        
        const configPath = path.join(__dirname, '../config/backend.ts');
        console.log(`   Checking config file: ${configPath}`);
        
        if (fs.existsSync(configPath)) {
            console.log('   ✅ Config file exists');
            // Read a few lines to check the configuration
            const content = fs.readFileSync(configPath, 'utf8');
            const lines = content.split('\n');
            for (let i = 0; i < Math.min(25, lines.length); i++) {
                if (lines[i].includes('LOCAL_IP') || lines[i].includes('BACKEND_URL') || lines[i].includes('API_URL')) {
                    console.log(`   Config line: ${lines[i].trim()}`);
                }
            }
        } else {
            console.log('   ❌ Config file not found');
        }
    } catch (error) {
        console.error('   Error reading config:', error.message);
    }
    
    console.log('\n=== TEST COMPLETE ===');
}