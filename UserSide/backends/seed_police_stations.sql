USE alertdavao;

INSERT INTO police_stations (station_name, address, latitude, longitude, contact_number) VALUES
('PS1 Sta. Ana', '2 M L Quezon Blvd, Poblacion District, Davao City, 8000 Davao del Sur', 7.073926884947963, 125.62460794233071, '09985987055 / 233-4884'),
('PS2 San Pedro', 'Purok 6, 107 San Pedro St, Poblacion District, Davao City, Davao del Sur', 7.06363513645959, 125.60983772750019, '09985987057 / 226-4835'),
('PS3 Talomo', '3G4W+2FM, McArthur Highway, Talomo, Davao City, Davao del Sur', 7.055262956996804, 125.5463240055573, '09194439634 / 297-1598'),
('PS4 Sasa', 'Km 9, Paradise Island Road, Davao City-Panabo City Rd, Buhangin, Davao City, 8000 Davao del Sur', 7.1145752788215075, 125.6574542290678, '09194439634 / 297-1598'),
('PS5 Buhangin', '4J77+C7J, Buhangin-Cabantian-Indangan Rd, Buhangin, Lungsod ng Dabaw, 8000 Lalawigan ng Davao del Sur', 7.11375476140385, 125.61321898470506, '09985987063'),
('PS6 Bunawan', '6JPV+74W, Bunawan, Davao City, Davao del Sur', 7.235684819195078, 125.64280068118306, '09985987065 / 236-0284'),
('PS7 Paquibato', '8FF6+6CJ, Barangay Lacson Rd, Davao City, 8000 Davao del Sur', 7.323117846058702, 125.4610349916833, '09985987067'),
('PS8 Toril', '2F9X+F96, General Lao St, Toril, Davao City, Davao del Sur', 7.018794722669158, 125.49848119837901, '09985987069 / 291-1633'),
('PS9 Tugbok', '3GP5+444, Tugbok, Davao City, 8000 Davao del Sur', 7.085446402287649, 125.50790122883605, '09985987072 / 09082277648 / 293-1177'),
('PS10 Calinan', '5FQ2+QW8, H Quiambao St, Calinan District, Davao City, 8000 Davao del Sur', 7.189501489500771, 125.452646461377, '09985987074 / 295-0119'),
('PS11 Baguio', '5CC3+V73, Baguio Road, Davao City, Davao del Sur', 7.172208918163278, 125.40315983742406, '09985987076'),
('PS12 Marilog', 'C733+JMJ, Davao - Bukidnon Hwy, Marilog District, Davao City, 8000 Davao del Sur', 7.406313963628985, 125.25868719472082, '09985987079'),
('PS13 Mandug', '5H5H+FQJ, Mandug Rd, Buhangin, Davao City, Davao del Sur', 7.158712265897077, 125.57938030393281, '09639749831'),
('PS15 Ecoland', '76-A Candelaria, Talomo, Davao City, Davao del Sur', 7.054131712097039, 125.60214948303488, '09190932408'),
('PS16 Maa', '3HXQ+XVW, Bypass Road, Talomo, Lungsod ng Dabaw, Lalawigan ng Davao del Sur', 7.100157191380795, 125.5899695885922, '09094015088'),
('PS17 Baliok', 'Barangay, Purok 2 Libby Road, Talomo, Davao City, 8000 Davao del Sur', 7.04669076212661, 125.5010750653133, '09079908630'),
('PS18 Bajada', '3JW8+25M, Daang Maharlika Highway, Dacudao Ave, Poblacion District, Davao City, Davao del Sur', 7.0953094237019725, 125.61549817857369, '09691914296 / 282-0302'),
('PS20 Los Amigos', '4FRH+MVQ, Tugbok, Davao City, 8000 Davao del Sur', 7.141641470017805, 125.48006096137699, '09207444000 / 282-8769')
ON DUPLICATE KEY UPDATE station_name=VALUES(station_name);
