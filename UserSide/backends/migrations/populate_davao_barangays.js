/**
 * Populate barangays table with Davao City barangays only
 * Reads from davao_barangays.csv and imports all barangays with citymunCode starting with 1124
 */

const fs = require('fs');
const path = require('path');
const db = require('../db');

async function populateDavaoBarangays() {
  try {
    console.log('📋 Starting Davao City barangay population...');
    
    // Read the CSV file (go up 3 levels from backends/migrations/)
    const csvPath = path.join(__dirname, '../../../../davao_barangays.csv');
    console.log('📂 Looking for CSV at:', csvPath);
    const csvData = fs.readFileSync(csvPath, 'utf8');
    
    // Parse CSV (skip header)
    const lines = csvData.split('\n').slice(1);
    let davaoCityBarangays = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Parse CSV line (handle quoted values)
      const matches = line.match(/"([^"]*)"/g);
      if (!matches || matches.length < 6) continue;
      
      const id = matches[0].replace(/"/g, '');
      const brgyCode = matches[1].replace(/"/g, '');
      const brgyDesc = matches[2].replace(/"/g, '');
      const regCode = matches[3].replace(/"/g, '');
      const provCode = matches[4].replace(/"/g, '');
      const citymunCode = matches[5].replace(/"/g, '');
      
      // Filter only Davao City (citymunCode starts with 1124)
      if (citymunCode.startsWith('1124')) {
        davaoCityBarangays.push({
          brgyCode,
          brgyDesc,
          citymunCode
        });
      }
    }
    
    console.log(`✅ Found ${davaoCityBarangays.length} Davao City barangays`);
    
    // Check if barangays table has citymunCode column
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'alertdavao' 
      AND TABLE_NAME = 'barangays' 
      AND COLUMN_NAME = 'citymunCode'
    `);
    
    if (columns.length === 0) {
      console.log('⚠️  citymunCode column does not exist. Adding it now...');
      await db.query(`
        ALTER TABLE barangays 
        ADD COLUMN citymunCode VARCHAR(10) 
        COMMENT 'City/Municipality code from PSA PSGC' 
        AFTER barangay_name
      `);
      console.log('✅ citymunCode column added');
    }
    
    // Update existing barangays with citymunCode
    let updatedCount = 0;
    let insertedCount = 0;
    
    for (const barangay of davaoCityBarangays) {
      // Check if barangay exists by name
      const [existing] = await db.query(
        'SELECT barangay_id FROM barangays WHERE barangay_name = ?',
        [barangay.brgyDesc]
      );
      
      if (existing.length > 0) {
        // Update existing barangay
        await db.query(
          'UPDATE barangays SET citymunCode = ? WHERE barangay_name = ?',
          [barangay.citymunCode, barangay.brgyDesc]
        );
        updatedCount++;
      } else {
        // Insert new barangay (with default coordinates and station_id = 1)
        await db.query(
          `INSERT INTO barangays (barangay_name, citymunCode, latitude, longitude, station_id) 
           VALUES (?, ?, 7.0731, 125.6128, 1)`,
          [barangay.brgyDesc, barangay.citymunCode]
        );
        insertedCount++;
      }
    }
    
    console.log(`✅ Updated ${updatedCount} existing barangays`);
    console.log(`✅ Inserted ${insertedCount} new barangays`);
    
    // Show summary
    const [totalBarangays] = await db.query(
      "SELECT COUNT(*) as count FROM barangays WHERE citymunCode LIKE '1124%'"
    );
    
    console.log(`📊 Total Davao City barangays in database: ${totalBarangays[0].count}`);
    console.log('✅ Davao City barangay population complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating barangays:', error);
    process.exit(1);
  }
}

populateDavaoBarangays();
