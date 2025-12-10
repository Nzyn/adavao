const fs = require('fs');
const osmtogeojson = require('osmtogeojson');

try {
    console.log("Reading OSM file...");
    const osmData = JSON.parse(fs.readFileSync('../../AdminSide/admin/new_polygons.json', 'utf8'));

    console.log("Converting to GeoJSON...");
    const geojson = osmtogeojson(osmData);

    console.log(`Conversion complete. Generated ${geojson.features.length} features.`);

    // Save to file
    fs.writeFileSync('converted_polygons.geojson', JSON.stringify(geojson, null, 2));
    console.log("Saved to converted_polygons.geojson");

} catch (error) {
    console.error("Error converting file:", error);
}
