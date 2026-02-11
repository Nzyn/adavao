// Test the notifications API endpoint
const http = require('http');

const userId = 6; // User with a flag

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/notifications/${userId}`,
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`\nℹ️  Status Code: ${res.statusCode}\n`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📊 Response:');
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
      
      // Check for flag notifications
      const flagNotifications = jsonData.data.filter(n => n.type === 'user_flagged');
      console.log(`\n✅ Found ${flagNotifications.length} flag notification(s)`);
      
      if (flagNotifications.length > 0) {
        console.log('\n🚩 Flag Details:');
        flagNotifications.forEach(flag => {
          console.log(`  - ID: ${flag.id}`);
          console.log(`  - Type: ${flag.data?.violation_type || 'N/A'}`);
          console.log(`  - Message: ${flag.message}`);
        });
      }
    } catch (error) {
      console.error('Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.error('\n💡 Make sure the UserSide backend server is running on port 3000');
  process.exit(1);
});

console.log(`🔍 Testing API endpoint: GET /api/notifications/${userId}`);
console.log(`   Connecting to localhost:3000...\n`);

req.end();
