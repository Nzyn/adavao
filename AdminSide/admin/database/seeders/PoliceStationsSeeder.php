<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PoliceStationsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $stations = [
            [
                'station_name' => 'PS1 Sta. Ana',
                'address' => '2 M L Quezon Blvd, Poblacion District, Davao City, 8000 Davao del Sur',
                'latitude' => 7.073926884947963,
                'longitude' => 125.62460794233071,
                'contact_number' => '09985987055 / 233-4884',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'station_name' => 'PS2 San Pedro',
                'address' => 'Purok 6, 107 San Pedro St, Poblacion District, Davao City, Davao del Sur',
                'latitude' => 7.06363513645959,
                'longitude' => 125.60983772750019,
                'contact_number' => '09985987057 / 226-4835',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'station_name' => 'PS3 Talomo',
                'address' => '3G4W+2FM, McArthur Highway, Talomo, Davao City, Davao del Sur',
                'latitude' => 7.055262956996804,
                'longitude' => 125.5463240055573,
                'contact_number' => '09194439634 / 297-1598',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'station_name' => 'PS4 Sasa',
                'address' => 'Km 9, Paradise Island Road, Davao City-Panabo City Rd, Buhangin, Davao City, 8000 Davao del Sur',
                'latitude' => 7.1145752788215075,
                'longitude' => 125.6574542290678,
                'contact_number' => '09194439634 / 297-1598',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'station_name' => 'PS5 Buhangin',
                'address' => '4J77+C7J, Buhangin-Cabantian-Indangan Rd, Buhangin, Lungsod ng Dabaw, 8000 Lalawigan ng Davao del Sur',
                'latitude' => 7.11375476140385,
                'longitude' => 125.61321898470506,
                'contact_number' => '09985987063',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'station_name' => 'PS6 Bunawan',
                'address' => '6JPV+74W, Bunawan, Davao City, Davao del Sur',
                'latitude' => 7.235684819195078,
                'longitude' => 125.64280068118306,
                'contact_number' => '09985987065 / 236-0284',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'station_name' => 'PS7 Paquibato',
                'address' => '8FF6+6CJ, Barangay Lacson Rd, Davao City, 8000 Davao del Sur',
                'latitude' => 7.323117846058702,
                'longitude' => 125.4610349916833,
                'contact_number' => '09985987067',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'station_name' => 'PS8 Toril',
                'address' => '2F9X+F96, General Lao St, Toril, Davao City, Davao del Sur',
                'latitude' => 7.018794722669158,
                'longitude' => 125.49848119837901,
                'contact_number' => '09985987069 / 291-1633',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'station_name' => 'PS9 Tugbok',
                'address' => '3GP5+444, Tugbok, Davao City, 8000 Davao del Sur',
                'latitude' => 7.085446402287649,
                'longitude' => 125.50790122883605,
                'contact_number' => '09985987072 / 09082277648 / 293-1177',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'station_name' => 'PS10 Calinan',
                'address' => '5FQ2+QW8, H Quiambao St, Calinan District, Davao City, 8000 Davao del Sur',
                'latitude' => 7.189501489500771,
                'longitude' => 125.452646461377,
                'contact_number' => '09985987074 / 295-0119',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'station_name' => 'PS11 Baguio',
                'address' => '5CC3+V73, Baguio Road, Davao City, Davao del Sur',
                'latitude' => 7.172208918163278,
                'longitude' => 125.40315983742406,
                'contact_number' => '09985987076',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'station_name' => 'PS12 Marilog',
                'address' => 'C733+JMJ, Davao - Bukidnon Hwy, Marilog District, Davao City, 8000 Davao del Sur',
                'latitude' => 7.406313963628985,
                'longitude' => 125.25868719472082,
                'contact_number' => '09985987079',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'station_name' => 'PS13 Mandug',
                'address' => '5H5H+FQJ, Mandug Rd, Buhangin, Davao City, Davao del Sur',
                'latitude' => 7.158712265897077,
                'longitude' => 125.57938030393281,
                'contact_number' => '09639749831',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'station_name' => 'PS15 Ecoland',
                'address' => '76-A Candelaria, Talomo, Davao City, Davao del Sur',
                'latitude' => 7.054131712097039,
                'longitude' => 125.60214948303488,
                'contact_number' => '09190932408',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'station_name' => 'PS16 Maa',
                'address' => '3HXQ+XVW, Bypass Road, Talomo, Lungsod ng Dabaw, Lalawigan ng Davao del Sur',
                'latitude' => 7.100157191380795,
                'longitude' => 125.5899695885922,
                'contact_number' => '09094015088',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'station_name' => 'PS17 Baliok',
                'address' => 'Barangay, Purok 2 Libby Road, Talomo, Davao City, 8000 Davao del Sur',
                'latitude' => 7.04669076212661,
                'longitude' => 125.5010750653133,
                'contact_number' => '09079908630',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'station_name' => 'PS18 Bajada',
                'address' => '3JW8+25M, Daang Maharlika Highway, Dacudao Ave, Poblacion District, Davao City, Davao del Sur',
                'latitude' => 7.0953094237019725,
                'longitude' => 125.61549817857369,
                'contact_number' => '09691914296 / 282-0302',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'station_name' => 'PS19 Eden',
                'address' => null,
                'latitude' => null,
                'longitude' => null,
                'contact_number' => '09171309130',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'station_name' => 'PS20 Los Amigos',
                'address' => '4FRH+MVQ, Tugbok, Davao City, 8000 Davao del Sur',
                'latitude' => 7.141641470017805,
                'longitude' => 125.48006096137699,
                'contact_number' => '09207444000 / 282-8769',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'station_name' => 'Cybercrime Division',
                'address' => 'Davao City Police Office - Cybercrime Division',
                'latitude' => 0,
                'longitude' => 0,
                'contact_number' => 'TBD',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('police_stations')->insert($stations);
    }
}
