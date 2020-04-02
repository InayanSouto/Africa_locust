// study area 25E-75E，5S-35N。
var geometry = 
    ee.Geometry.Polygon(
         [[[25, 35],
           [25, 5],
           [75, 5],
           [75, 35]]], null, false);
var regions = ee.FeatureCollection([
    ee.Feature(geometry)
  ]);

Map.addLayer(regions,{},'Study Area');
Map.centerObject(regions,2);

// imgCol 
var now = ee.Date(Date.now());
var NDVICollection=ee.ImageCollection('MODIS/006/MOD13Q1')
    .filterDate('2010-01-01',now)
    .filterBounds(regions)
    .select('NDVI'); 

var col = NDVICollection.map(function(img){
    return img.multiply(0.0001)
    .copyProperties(img,['system:time_start','system:time_end']);
    });

var maskNDVI = function(image){
  // grouped by month 
  var months = ee.List([11,12,1,2]);
  var byMonth = ee.ImageCollection.fromImages(
      months.map(function (m) {
          return col.filterDate('2019-11-01',now).filter(ee.Filter.calendarRange(m, m, 'month'))
                      .select('NDVI').mean()
                      .set('month', m);
      }));
  
  var meanNDVI = byMonth.reduce(ee.Reducer.mean());
  var     mask = meanNDVI.gt(0.1);
  return image.updateMask(mask);
};
var addTime = function(image) {
  // Scale milliseconds by a large constant to avoid very small slopes
  // in the linear regression output.
  return image.addBands(image.metadata('system:time_start').divide(1e18));
};

var addTimeClip = function(image) {
  return image.addBands(image.metadata('system:time_start')
    .divide(1000 * 60 * 60 * 24 * 365)).clip(regions);
};
var collection = col.map(addTimeClip).map(maskNDVI);
var taskNdviCol = collection.filterDate('2019-11-01',now);

var linearFit = taskNdviCol.select(['system:time_start', 'NDVI'])
  .reduce(ee.Reducer.linearFit());  
var slope = linearFit.select(['scale']);

print('Projection, crs, and crs_transform:', slope.projection());
print('Scale in meters:', slope.projection().nominalScale());

// Combine the mean and standard deviation reducers.
var reducers = ee.Reducer.mean().combine({
  reducer2: ee.Reducer.minMax(),
  sharedInputs: true
});


// Use the combined reducer to get the mean and SD of the image.
var stats = slope.reduceRegion({
  reducer: reducers,
  geometry: regions,
  scale: 111319.49079327357
});

print(stats);
var min_value = ee.Number(stats.get("scale_min"));
var max_value = ee.Number(stats.get("scale_max"));

var red_colorBrewer = ['67000d','ef3b2c','fcbba1','fff5f0'];
var visParam = {
  min: -6,
  max: 3,
  palette: red_colorBrewer
};
Map.centerObject(regions,3);
Map.addLayer(slope, visParam, 'Slope NPP Change');

// Export the image, specifying scale and region.
Export.image.toDrive({
  image: slope,
  description: 'NDVI_Slope_Monthly',
  maxPixels:1e13,
  scale: 1000,
  region: regions.geometry()
});