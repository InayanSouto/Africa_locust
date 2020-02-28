var regions = ee.FeatureCollection("users/wufvckshuo/Africa_Locust/studyarea");
// var regions = ee.FeatureCollection([
//     ee.Feature(    // study area.
//       ee.Geometry.Rectangle(60, 19, 75, 35), {label: 'study Area'})
//   ]);
var now = ee.Date(Date.now());
var NDVICollection=ee.ImageCollection('MODIS/006/MOD13Q1')
    .filterDate('2010-01-01',now)
    .filterBounds(regions)
    .select('NDVI'); 

var col = NDVICollection.map(function(img){
    return img.multiply(0.0001)
    .copyProperties(img,['system:time_start','system:time_end']);
    });

var maskMonth = ee.List([12,1,2]);
var months = ee.List([12,1,2]);
var byMonth = ee.ImageCollection.fromImages(
    maskMonth.map(function (m) {
        return col.filter(ee.Filter.calendarRange(m, m, 'month'))
                    .select('NDVI').mean()
                    .set('month', m);
    }));
    
var meanNDVI = byMonth.reduce(ee.Reducer.mean());
var mask = meanNDVI.gt(0.1);

var JuPing = ee.ImageCollection.fromImages(
    months.map(function (m) {
        var NDVI = col.filterDate('2019-12-01',now).filter(ee.Filter.calendarRange(m, m, 'month')).mean().set('month', m);
        var hisNDVI = col.filter(ee.Filter.calendarRange(m, m, 'month')).mean().set('month', m);
        return NDVI.subtract(hisNDVI).set('month', m).updateMask(mask);
    }));
  
var JuPingPer = ee.ImageCollection.fromImages(
    months.map(function (m) {
        var NDVI = col.filterDate('2019-12-01',now).filter(ee.Filter.calendarRange(m, m, 'month')).mean().set('month', m);
        var hisNDVI = col.filter(ee.Filter.calendarRange(m, m, 'month')).mean().set('month', m);
        return NDVI.subtract(hisNDVI).divide(hisNDVI).set('month', m).updateMask(mask);
    }));

var img1 =  JuPing.first(),
    img2 =  JuPingPer.first();

var visParam = {
    min: -1.0,
    max: 1.0,
    palette: ['FF0000', 'FFFFFF', '00FF00'],
  };
  
Map.centerObject(regions,4)
Map.addLayer(img1.clip(regions),visParam,'Juping');
Map.addLayer(img2.clip(regions),visParam,'JupingPer');
Map.addLayer(regions,visParam,'regions');

function exportImageCollection(imgCol,str) {
  var indexList = imgCol.reduceColumns(ee.Reducer.toList(), ["system:index"])
                        .get("list");
  indexList.evaluate(function(indexs) {
    for (var i=0; i<indexs.length; i++) {
      var image = imgCol.filter(ee.Filter.eq("system:index", indexs[i])).first();
        var desc_name = image.get('month').getInfo();
        Export.image.toDrive({
        image: image.clip(regions.geometry()),
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
exportImageCollection(JuPing,'JuPing_last_');
exportImageCollection(JuPingPer,'JuPingPer_last_');