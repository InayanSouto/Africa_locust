// study area 
var regions = ee.FeatureCollection([
  ee.Feature(
    ee.Geometry.Rectangle(20, -5, 75, 35), {label: 'study Area'})
]);

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

var spring = col.filter(ee.Filter.calendarRange(12,2,'month'));
var fall = col.filter(ee.Filter.calendarRange(9,11,'month'));

var thisFall = col.filterDate('2019-09-01',now).filter(ee.Filter.calendarRange(9,11,'month'));
var thisSpring = col.filterDate('2019-09-01',now).filter(ee.Filter.calendarRange(12,2,'month'));

var JuPingFall = ee.ImageCollection(thisFall.mean().subtract(fall.mean()).updateMask(mask));
var JuPingSpring = ee.ImageCollection(thisSpring.mean().subtract(spring.mean()).updateMask(mask));

var JuPingFallPer = ee.ImageCollection((thisFall.mean().subtract(fall.mean()).divide(fall.mean())).updateMask(mask));
var JuPingSpringPer = ee.ImageCollection((thisSpring.mean().subtract(spring.mean()).divide(spring. mean())).updateMask(mask));

var visParam = {
  min: 0.0,
  max: 1.0,
  palette: [
    'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
    '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
    '012E01', '011D01', '011301'
  ],
};

Map.centerObject(regions,2)
Map.addLayer(JuPingFall,visParam,'JuPingFall');

function exportImageCollection(imgCol,str) {
    var indexList = imgCol.reduceColumns(ee.Reducer.toList(), ["system:index"])
                          .get("list");
    indexList.evaluate(function(indexs) {
      for (var i=0; i<indexs.length; i++) {
        var image = imgCol.filter(ee.Filter.eq("system:index", indexs[i])).first();
        var desc_name = image.get('system:index').getInfo();
          Export.image.toDrive({
          image: image.clip(regions),
          description: str + desc_name,
          folder:'Africa_Locust',
          region: regions.geometry().bounds(),
          scale: 1000,
          crs: "EPSG:4326",
          maxPixels: 1e13
        });
      }
    });
  }
exportImageCollection(JuPingSpring,'JuPingSpring_');
exportImageCollection(JuPingSpringPer,'JuPingSpringPer_');
exportImageCollection(JuPingFall,'JuPingFall_');
exportImageCollection(JuPingFallPer,'JuPingFallPer_');