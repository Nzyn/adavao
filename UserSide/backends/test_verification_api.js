const http = require('http');

// Test the verification status API endpoint
const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/verification/status/1', // Test with user ID 1
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log('Testing verification status API endpoint...');

const req = http.request(options, (res) => {
    let data = '';
    
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            console.log('Response:', JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('Error parsing response:', error);
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('Error making request:', error);
});

req.end();