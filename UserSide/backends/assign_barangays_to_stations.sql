-- Assign barangays to their respective police stations
-- Based on geographic jurisdiction in Davao City

USE alertdavao;

-- PS1 Sta. Ana - Poblacion District
UPDATE barangays SET station_id = 1 WHERE barangay_name IN (
  'Sta. Ana',
  'Poblacion',
  'Tigatto'
);

-- PS2 San Pedro - Poblacion District
UPDATE barangays SET station_id = 2 WHERE barangay_name IN (
  'San Pedro',
  'Tambobong',
  'Marfori Heights'
);

-- PS3 Talomo - Talomo District
UPDATE barangays SET station_id = 3 WHERE barangay_name IN (
  'Talomo',
  'Baliok',
  'Maa',
  'Ecoland',
  'Eden',
  'Balengina'
);

-- PS4 Sasa - Buhangin District
UPDATE barangays SET station_id = 4 WHERE barangay_name IN (
  'Sasa',
  'Buhangin',
  'Paradise'
);

-- PS5 Buhangin - Buhangin District
UPDATE barangays SET station_id = 5 WHERE barangay_name IN (
  'Buhangin',
  'Cabantian',
  'Indangan',
  'Bantayan'
);

-- PS6 Bunawan - Bunawan District
UPDATE barangays SET station_id = 6 WHERE barangay_name IN (
  'Bunawan',
  'Sumimao',
  'Lacson',
  'Tagachon',
  'Matina'
);

-- PS7 Paquibato - Paquibato District
UPDATE barangays SET station_id = 7 WHERE barangay_name IN (
  'Paquibato',
  'Lacson',
  'Bago Oshiro',
  'Langub'
);

-- PS8 Toril - Toril District
UPDATE barangays SET station_id = 8 WHERE barangay_name IN (
  'Toril',
  'Calinan',
  'Tugbok'
);

-- PS9 Tugbok - Tugbok District
UPDATE barangays SET station_id = 9 WHERE barangay_name IN (
  'Tugbok',
  'Los Amigos',
  'Sirwan'
);

-- PS10 Calinan - Calinan District
UPDATE barangays SET station_id = 10 WHERE barangay_name IN (
  'Calinan',
  'Biao',
  'Crossing',
  'Gatungan'
);

-- PS11 Baguio - Baguio District
UPDATE barangays SET station_id = 11 WHERE barangay_name IN (
  'Baguio',
  'Calinan',
  'Tamayong'
);

-- PS12 Marilog - Marilog District
UPDATE barangays SET station_id = 12 WHERE barangay_name IN (
  'Marilog',
  'Ampawan',
  'Tibungco',
  'Buda',
  'Ula',
  'Singalong'
);

-- PS13 Mandug - Buhangin District
UPDATE barangays SET station_id = 13 WHERE barangay_name IN (
  'Mandug',
  'Guada',
  'Tigatto'
);

-- PS15 Ecoland - Talomo District
UPDATE barangays SET station_id = 14 WHERE barangay_name IN (
  'Ecoland',
  'Eden',
  'Talomo'
);

-- PS16 Maa - Talomo District
UPDATE barangays SET station_id = 15 WHERE barangay_name IN (
  'Maa',
  'Talomo'
);

-- PS17 Baliok - Talomo District
UPDATE barangays SET station_id = 16 WHERE barangay_name IN (
  'Baliok',
  'Talomo'
);

-- PS18 Bajada - Poblacion District
UPDATE barangays SET station_id = 17 WHERE barangay_name IN (
  'Bajada',
  'Poblacion',
  'Dacudao'
);

-- PS20 Los Amigos - Tugbok District
UPDATE barangays SET station_id = 18 WHERE barangay_name IN (
  'Los Amigos',
  'Tugbok',
  'Sirwan'
);

-- Verify assignment
SELECT 'Barangay to Station Assignment Complete!' AS status;
SELECT COUNT(*) as total_barangays_assigned FROM barangays WHERE station_id IS NOT NULL;
SELECT COUNT(*) as total_barangays FROM barangays;

-- Show barangays with their assigned stations
SELECT b.barangay_name, ps.station_name, ps.address 
FROM barangays b 
LEFT JOIN police_stations ps ON b.station_id = ps.station_id 
ORDER BY b.barangay_name;
