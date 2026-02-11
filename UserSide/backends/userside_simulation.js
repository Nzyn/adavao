// Simulate what the UserSide app is doing
const fetch = require('node-fetch');

async function simulateUserSideCall() {
    console.log('=== SIMULATING USERSIDE API CALL ===');

    // Get the backend URL configuration
    const BACKEND_PORT = 3000;
    const LOCAL_IP = '192.168.1.9'; // From the config file

    // Simulate different platform scenarios
    const scenarios = [
        { name: 'Web Platform', url: `http://localhost:${BACKEND_PORT}` },
        { name: 'Mobile Device', url: `http://${LOCAL_IP}:${BACKEND_PORT}` }
    ];

    for (const scenario of scenarios) {
        console.log(`\n--- Testing ${scenario.name} ---`);
        console.log(`URL: ${scenario.url}`);

        try {
            const response = await fetch(`${scenario.url}/api/verification/status/1`);
            console.log(`Status: ${response.status}`);
            console.log(`Status Text: ${response.statusText}`);

            const headers = {};
            for (const [key, value] of response.headers.entries()) {
                headers[key] = value;
            }
            console.log(`Headers: ${JSON.stringify(headers, null, 2)}`);

            const data = await response.json();
            console.log(`Data: ${JSON.stringify(data, null, 2)}`);
        } catch (error) {
            console.error(`❌ Error in ${scenario.name}:`, error.message);
        }
    }

    console.log('\n=== SIMULATION COMPLETE ===');
}

simulateUserSideCall();