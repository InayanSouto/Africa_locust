var regions = ee.FeatureCollection("users/wufvckshuo/Locust_StudyArea");
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

var ndviFeb = col.filterDate('2020-02-01',now).select('NDVI').reduce(ee.Reducer.mean());
var ndviJan = col.filterDate('2020-01-01','2020-02-01').select('NDVI').reduce(ee.Reducer.mean());

var ndviChange = ndviFeb.subtract(ndviJan);

var visParam = {
  min: -1.0,
  max: 1.0,
  palette: ['FF0000', 'yellow', '00FF00'],
};

Map.centerObject(regions);
Map.addLayer(ndviChange.clip(regions),visParam,'ndviChange');
Map.addLayer(regions,visParam,'roi');

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
          region: regions.geometry(),
          scale: 1000,
          crs: "EPSG:4326",
          maxPixels: 1e13
        });
      }
    });
  }
exportImageCollection(ndviChange);






