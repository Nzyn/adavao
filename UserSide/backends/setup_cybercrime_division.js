/**
 * Setup Script: Add Cybercrime Division Police Station
 * Run this script to initialize the cybercrime division in the database
 * 
 * Usage: node setup_cybercrime_division.js
 */

const db = require('./db');

async function setupCybercrimeDivision() {
  let connection;
  try {
    connection = await db.getConnection();
    
    console.log('🚨 Setting up Cybercrime Division Police Station...\n');
    
    // Check if Cybercrime Division already exists
    const [existing] = await connection.query(
      `SELECT station_id, station_name FROM police_stations WHERE station_name = 'Cybercrime Division'`
    );
    
    if (existing && existing.length > 0) {
      console.log('✅ Cybercrime Division already exists in database');
      console.log(`   Station ID: ${existing[0].station_id}`);
      console.log(`   Station Name: ${existing[0].station_name}\n`);
      return;
    }
    
    // Insert Cybercrime Division
    console.log('📝 Inserting Cybercrime Division station...');
    const [result] = await connection.query(
      `INSERT INTO police_stations (station_name, address, latitude, longitude, contact_number) 
       VALUES (?, ?, ?, ?, ?)`,
      ['Cybercrime Division', 'Davao City Police Office - Cybercrime Division', 0, 0, 'TBD']
    );
    
    console.log('✅ Cybercrime Division added successfully!');
    console.log(`   Station ID: ${result.insertId}`);
    console.log(`   Station Name: Cybercrime Division`);
    console.log(`   Address: Davao City Police Office - Cybercrime Division`);
    console.log(`   Coordinates: (0, 0) - Global station (no physical location)`);
    console.log(`   Contact: TBD\n`);
    
    // Verify insertion
    const [verify] = await connection.query(
      `SELECT * FROM police_stations WHERE station_id = ?`,
      [result.insertId]
    );
    
    if (verify && verify.length > 0) {
      const station = verify[0];
      console.log('🔍 Verification successful:');
      console.log(`   Station ID: ${station.station_id}`);
      console.log(`   Station Name: ${station.station_name}`);
      console.log(`   Address: ${station.address}`);
      console.log(`   Contact: ${station.contact_number}\n`);
      
      console.log('✨ Cybercrime Division setup complete!');
      console.log('\n📋 Next steps:');
      console.log('   1. Create a police officer account and assign to Cybercrime Division');
      console.log('   2. Test by submitting a cybercrime report from the mobile app');
      console.log('   3. Verify the report appears in Cybercrime Division officer\'s dashboard\n');
    }
    
  } catch (error) {
    console.error('❌ Error setting up Cybercrime Division:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
}

// Run setup
setupCybercrimeDivision();
