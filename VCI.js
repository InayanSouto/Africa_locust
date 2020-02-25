// study area 
var regions = ee.FeatureCollection([
    ee.Feature(    // study area.
      ee.Geometry.Rectangle(20, -5, 75, 35), {label: 'study Area'})
  ]);

var now = ee.Date(Date.now());
var modis = ee.ImageCollection("MODIS/006/MOD13Q1")
.filterDate("2010-01-01",now)
.select("NDVI");

var col = modis.map(function(img){
  return img.multiply(0.0001)
  .copyProperties(img,['system:time_start','system:time_end']);
});

var months = ee.List([12,1,2]);
var byMonth = ee.ImageCollection.fromImages(
  months.map(function (m) {
    return col.filter(ee.Filter.calendarRange(m, m, 'month'))
                .select('NDVI').mean()
                .set('month', m);
}));

var meanNDVI = byMonth.reduce(ee.Reducer.mean());
var mask = meanNDVI.gt(0.1);


// var vci = col.map(function(img){
//  var id = img.id();
//  var min = img.reduceRegion(ee.Reducer.min(), regions.geometry(),4000).get('NDVI');
//  var max = img.reduceRegion(ee.Reducer.max(), regions.geometry(),4000).get('NDVI');
//  return img.expression(
//    "(NDVI-min)/(max-min)",{
//      "NDVI" : img,
//      "max" : ee.Number(max),
//      "min" : ee.Number(min)
//    }).copyProperties(img,['system:time_start','system:time_end']);
// });
// var tarVCI = vci.filterDate('2019-12-01',now);

var months = ee.List([12,1,2]);
var vci = ee.ImageCollection.fromImages(
  months.map(function (m) {
    var max =  col.filter(ee.Filter.calendarRange(m, m, 'month'))
                .select('NDVI').max()
                .set('month', m);
    var min =  col.filter(ee.Filter.calendarRange(m, m, 'month'))
                .select('NDVI').min()
                .set('month', m);
    var nowNDVI = col.filterDate('2019-12-01',now).
                filter(ee.Filter.calendarRange(m, m, 'month'))
                .select('NDVI').mean()
                .set('month', m);
    return nowNDVI.subtract(min).divide(max.subtract(min)).set('month', m).updateMask(mask);
}));
function exportImageCollection(imgCol) {
    var indexList = imgCol.reduceColumns(ee.Reducer.toList(), ["system:index"])
                          .get("list");
    indexList.evaluate(function(indexs) {
      for (var i=0; i<indexs.length; i++) {
        var image = imgCol.filter(ee.Filter.eq("system:index", indexs[i])).first();
        var desc_name = image.get('month').getInfo();
          Export.image.toDrive({
          image: image.clip(regions),
          description: 'VCI_month_'+ desc_name,
          folder:'Africa_Locust',
          region: regions.geometry().bounds(),
          scale: 1000,
          crs: "EPSG:4326",
          maxPixels: 1e13
        });
      }
    });
  }
exportImageCollection(vci);

var visParams = {
  min: 0.1,
  max: 1.0,
  palette: [
    'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
    '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
    '012E01', '011D01', '011301'
  ],
};
var rgbVis = vci.map(function(img) {
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