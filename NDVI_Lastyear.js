// study area 
// var regions = ee.FeatureCollection([
//   ee.Feature(    // study area.
//     ee.Geometry.Rectangle(20, -5, 75, 35), {label: 'study Area'})
// ]);
var regions = ee.FeatureCollection("users/wufvckshuo/Africa_Locust/studyarea");

var now = ee.Date(Date.now());
var NDVICollection=ee.ImageCollection('MODIS/006/MOD13Q1')
  .filterDate('2010-01-01',now)
  .filterBounds(regions)
  .select('NDVI'); 

var col = NDVICollection.map(function(img){
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

var JuPingLastyear = ee.ImageCollection.fromImages(
  months.map(function (m) {
      var NDVI = col.filterDate('2019-12-01',now).filter(ee.Filter.calendarRange(m, m, 'month')).mean().set('month', m);
      var hisNDVI = col.filterDate('2018-12-01','2019-02-28').filter(ee.Filter.calendarRange(m, m, 'month')).mean().set('month', m);
      return NDVI.subtract(hisNDVI).set('month', m).updateMask(mask);
  }));

var JuPingPerLaster = ee.ImageCollection.fromImages(
  months.map(function (m) {
      var NDVI = col.filterDate('2019-12-01',now).filter(ee.Filter.calendarRange(m, m, 'month')).mean().set('month', m);
      var hisNDVI = col.filterDate('2018-12-01','2019-02-28').filter(ee.Filter.calendarRange(m, m, 'month')).mean().set('month', m);
      return NDVI.subtract(hisNDVI).divide(hisNDVI).set('month', m).updateMask(mask);
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
        image: image.clip(regions),
        description: str + desc_name,
        folder:'Africa_Locust',
        region: regions.geometry(),
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

Map.centerObject(regions,2);
Map.addLayer(JuPingLastyear,visParams,'JuPingLastyear')

exportImageCollection(JuPingLastyear,'JuPingLastyear_');
exportImageCollection(JuPingPerLaster,'JuPingPerLastyear_');
