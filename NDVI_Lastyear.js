var today = ee.Date(Date.now());
var NDVICollection = ee.ImageCollection('MODIS/006/MOD13A2').select('NDVI').filterDate("2010-01-01", today);

var col = NDVICollection.map(function(img){
  return img.multiply(0.0001)
  .copyProperties(img,['system:time_start','system:time_end']);
});

// study area
var regions = ee.FeatureCollection([
  ee.Feature(
    ee.Geometry.Rectangle(20, -5, 75, 35), {label: 'study Area'})
]);

// Define the regional bounds of animation frames.
var region = regions.geometry().bounds();

// Add day-of-year (DOY) property to each image.
col = col.map(function(img) {
  var doy = ee.Date(img.get('system:time_start')).getRelative('day', 'year');
  return img.set('doy', doy);
});

// Get a collection of distinct images by 'doy'.
var distinctDOY = col.filterDate('2019-12-01', today);

var doys = ee.List(distinctDOY.aggregate_array('doy'));

// group by doy
var JuPingLastyear = ee.ImageCollection.fromImages(
  doys.map(function(doy){
  var filterDoy = col.filterDate('2018-12-01','2019-02-22').filterMetadata('doy', 'equals', doy)
  .reduce(ee.Reducer.mean()).set('doy', doy);
  var newDoy = distinctDOY.filterMetadata('doy', 'equals', doy)
  .reduce(ee.Reducer.mean()).set('doy', doy);
  return newDoy.subtract(filterDoy).set('doy', doy);
}));

var JuPingPerLaster = ee.ImageCollection.fromImages(
  doys.map(function(doy){
  var filterDoy = col.filterDate('2018-12-01','2019-02-22').filterMetadata('doy', 'equals', doy)
  .reduce(ee.Reducer.mean()).set('doy', doy);
  var newDoy = distinctDOY.filterMetadata('doy', 'equals', doy)
  .reduce(ee.Reducer.mean()).set('doy', doy);
  return newDoy.subtract(filterDoy).divide(filterDoy).set('doy', doy);
}));

function exportImageCollection(imgCol,str) {
  var indexList = imgCol.reduceColumns(ee.Reducer.toList(), ["system:index"])
                        .get("list");
  indexList.evaluate(function(indexs) {
    for (var i=0; i<indexs.length; i++) {
      print(indexs[i])
      var image = imgCol.filter(ee.Filter.eq("system:index", indexs[i])).first();
      var desc_name = image.get('system:index').getInfo();
      print(desc_name);
        Export.image.toDrive({
        image: image.clip(region),
        description: str + desc_name,
        folder:'Africa_Locust',
        region: region,
        scale: 1000,
        crs: "EPSG:4326",
        maxPixels: 1e13
      });
    }
  });
}

// Define RGB visualization parameters.
var visParams = {
  min: 0.1,
  max: 1.0,
  palette: [
    'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
    '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
    '012E01', '011D01', '011301'
  ],
};

Map.centerObject(region,2);
Map.addLayer(JuPingLastyear,visParams,'JuPingLastyear')
// Create RGB visualization images for use as animation frames.
var rgbVis = JuPingLastyear.map(function(img) {
  return img.visualize(visParams).clip(regions);
});

var doyVis = JuPingPerLaster.map(function(img) {
  return img.visualize(visParams).clip(regions);
});

// Define GIF visualization arguments.
var gifParams = {
  'region': region,
  'dimensions': 250,
  'crs': 'EPSG:4326',
  'framesPerSecond': 1,
  'format': 'gif'
};

// Print the GIF URL to the console.
print(rgbVis.getVideoThumbURL(gifParams));

// Render the GIF animation in the console.
print(ui.Thumbnail(rgbVis, gifParams));

print(ui.Thumbnail(doyVis, gifParams));

exportImageCollection(JuPingLastyear,'JuPingLastyear_');
exportImageCollection(JuPingPerLaster,'JuPingPerLastyear_');
