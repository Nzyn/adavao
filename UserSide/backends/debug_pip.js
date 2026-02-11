const fs = require('fs');

function isPointInPolygon(lat, lon, polygon) {
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0];
        const yi = polygon[i][1];
        const xj = polygon[j][0];
        const yj = polygon[j][1];

        const intersect = ((yi > lat) !== (yj > lat)) &&
            (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }

    return inside;
}

async function runTest() {
    const lat = 7.065112;
    const lng = 125.608966;

    console.log(`Testing Coordinate: Lat ${lat}, Lng ${lng}`);

    try {
        const rawData = fs.readFileSync('converted_polygons.geojson', 'utf8');
        const geojson = JSON.parse(rawData);

        console.log(`Loaded GeoJSON features: ${geojson.features.length}`);

        let matchFound = false;

        for (const feature of geojson.features) {
            const name = feature.properties.name || feature.properties.NAME || "Unknown";

            // NO FILTER - Check ALL polygons

            let coords = null;

            if (feature.geometry.type === 'MultiPolygon') {
                // Check each polygon in the MultiPolygon
                for (let i = 0; i < feature.geometry.coordinates.length; i++) {
                    const poly = feature.geometry.coordinates[i][0];
                    if (isPointInPolygon(lat, lng, poly)) {
                        console.log(`✅ MATCH FOUND: Point is inside ${name} (MultiPolygon part ${i})`);
                        matchFound = true;
                    }
                }
            } else if (feature.geometry.type === 'Polygon') {
                coords = feature.geometry.coordinates[0];
                if (isPointInPolygon(lat, lng, coords)) {
                    console.log(`✅ MATCH FOUND: Point is inside ${name}`);
                    matchFound = true;
                }
            }
        }

        if (!matchFound) {
            console.log("\n❌ NO MATCHES found in the entire file.");
            console.log("The coordinate is located in a GAP between polygons or outside all defined areas.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

runTest();
