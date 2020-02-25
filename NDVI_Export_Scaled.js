// study area 
var regions = ee.FeatureCollection([
    ee.Feature(    // study area.
      ee.Geometry.Rectangle(20, -5, 75, 35), {label: 'study Area'})
  ]);

var geometry =regions.geometry();
var region = geometry.bounds();

var now = ee.Date(Date.now());
var modis = ee.ImageCollection("MODIS/006/MOD13Q1")
//.filterBounds(geometry) // no need to filter by bounds in MODIS
.filterDate("2010-01-01",now)
.select("NDVI");

print(modis);

var mod13 = modis.map(function(img){
  return img.multiply(0.0001)
  .copyProperties(img,['system:time_start','system:time_end']);
});

print(mod13);

var visParams = {
    min: 0.1,
    max: 1.0,
    palette: [
      'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
      '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
      '012E01', '011D01', '011301'
    ],
  };
  
var NDVI = mod13.filterDate('2019-12-01',now);

var months = ee.List([12,1,2]);

// Group by month, and then reduce within groups by mean();
// the result is an ImageCollection with one image for each
// month.
var byMonth = ee.ImageCollection.fromImages(
    months.map(function (m) {
      return NDVI.filter(ee.Filter.calendarRange(m, m, 'month'))
                  .select('NDVI').mean()
                  .set('month', m);
}));


var NDVI_Dec = NDVI.filter(ee.Filter.calendarRange(12,12,'month')).select('NDVI').mean().set('month',12);
var NDVI_Jan = NDVI.filter(ee.Filter.calendarRange(1,1,'month')).select('NDVI').mean().set('month',1);
var NDVI_Feb = NDVI.filter(ee.Filter.calendarRange(2,2,'month')).select('NDVI').mean().set('month',2);

function exportImageCollection(imgCol) {
    var indexList = imgCol.reduceColumns(ee.Reducer.toList(), ["system:index"])
                          .get("list");
    indexList.evaluate(function(indexs) {
      for (var i=0; i<indexs.length; i++) {
        var image = imgCol.filter(ee.Filter.eq("system:index", indexs[i])).first();
        var desc_name = image.get('system:index').getInfo();
          Export.image.toDrive({
          image: image.clip(region),
          description: 'NDVI_'+ desc_name,
          folder:'Africa_Locust',
          region: region,
          scale: 1000,
          crs: "EPSG:4326",
          maxPixels: 1e13
        });
      }
    });
  }
exportImageCollection(NDVI);
// exportImageCollection(byMonth);

var rgbVis = NDVI.map(function(img) {
    return img.visualize(visParams).clip(regions);
  });
  
  // Define GIF visualization arguments.
  var gifParams = {
    'region': regions.geometry(),
    'dimensions': 250,
    'crs': 'EPSG:4326',
    'framesPerSecond': 1,
    'format': 'gif'
  };
  
  // Print the GIF URL to the console.
  print(rgbVis.getVideoThumbURL(gifParams));
  
  // Render the GIF animation in the console.
  print(ui.Thumbnail(rgbVis, gifParams));