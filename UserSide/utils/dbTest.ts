// Database test utility for debugging AlertDavao database connection
import { directDbService } from '../services/directDbService';

export class DatabaseTester {
  
  static async runFullTest(): Promise<void> {
    console.log('🔧 Starting AlertDavao Database Test...\n');
    
    try {
      // Test 1: Connection
      console.log('1️⃣ Testing MySQL connection to alertdavao database...');
      const connectionOk = await directDbService.testMysqlConnection();
      
      if (connectionOk) {
        console.log('✅ MySQL connection successful!');
      } else {
        console.log('❌ MySQL connection failed!');
        console.log('   - Check if MySQL server is running on localhost:3306');
        console.log('   - Verify database "alertdavao" exists');
        console.log('   - Check MySQL credentials in directDbService.ts');
        return;
      }
      
      console.log('\n2️⃣ Testing user data operations...');
      
      // Test 2: Get user by ID
      try {
        const user = await directDbService.getUserById('1');
        if (user) {
          console.log('✅ User found in database:', {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            phone: user.phone,
            address: user.address
          });
        } else {
          console.log('ℹ️ No user found with ID "1" - this is normal for first run');
        }
      } catch (error) {
        console.log('❌ Error fetching user:', error);
      }
      
      // Test 3: Address verification
      console.log('\n3️⃣ Testing address data mapping...');
      try {
        const testQuery = 'SELECT id, firstname, lastname, email, contact, address FROM users LIMIT 5';
        const result = await directDbService.executeQuery(testQuery);
        
        if (result && result.data && result.data.length > 0) {
          console.log('✅ Sample users in database:');
          result.data.forEach((row: any, index: number) => {
            console.log(`   User ${index + 1}:`, {
              id: row.id,
              name: `${row.firstname} ${row.lastname}`,
              email: row.email,
              contact: row.contact,
              address: row.address
            });
          });
        } else {
          console.log('ℹ️ No users found in database - this is normal for new setup');
        }
      } catch (error) {
        console.log('❌ Error querying users table:', error);
      }
      
      console.log('\n🎉 Database test completed!');
      
    } catch (error) {
      console.log('\n❌ Database test failed with error:', error);
      console.log('\nTroubleshooting steps:');
      console.log('1. Ensure MySQL server is running');
      console.log('2. Check database credentials in services/directDbService.ts');
      console.log('3. Verify alertdavao database exists');
      console.log('4. Check users table schema matches expected columns');
    }
  }
  
  static async testAddressSave(userId: string, address: string): Promise<boolean> {
    console.log(`🧪 Testing address save for user ${userId}...`);
    try {
      await directDbService.updateUserAddress(userId, address);
      const verified = await directDbService.verifyAddressSave(userId, address);
      
      if (verified) {
        console.log('✅ Address save test passed!');
        return true;
      } else {
        console.log('❌ Address save test failed!');
        return false;
      }
    } catch (error) {
      console.log('❌ Address save test error:', error);
      return false;
    }
  }
  
  static logUserContext(user: any): void {
    console.log('\n📋 Current User Context State:');
    console.log('================================');
    console.log(`ID: ${user?.id || 'N/A'}`);
    console.log(`Name: ${user?.firstName || 'N/A'} ${user?.lastName || 'N/A'}`);
    console.log(`Email: ${user?.email || 'N/A'}`);
    console.log(`Phone: ${user?.phone || 'N/A'}`);
    console.log(`Address: ${user?.address || 'N/A'}`);
    console.log(`Verified: ${user?.isVerified ? 'Yes' : 'No'}`);
    console.log(`Data Source: ${user?.dataSource || 'Unknown'}`);
    console.log(`Created: ${user?.createdAt || 'N/A'}`);
    console.log(`Updated: ${user?.updatedAt || 'N/A'}`);
    console.log('================================\n');
  }
}

// Export for easy import and use
export const dbTest = DatabaseTester;