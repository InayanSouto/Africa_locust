// study area 
var regions = ee.FeatureCollection([
    ee.Feature(    // study area.
      ee.Geometry.Rectangle(20, -5, 75, 35), {label: 'study Area'})
  ]);
// imgCol
var now = ee.Date(Date.now());
var SMAPCollection = ee.ImageCollection("NASA_USDA/HSL/SMAP_soil_moisture")
    .filterDate('2015-04-01',now).select('ssm');
// group by month
var months = ee.List([9,10,11,12,1,2]);
var ssmSMAP = ee.ImageCollection.fromImages(
    months.map(function (m) {
        var newSSM = SMAPCollection.filterDate('2019-09-01',now)
        .filter(ee.Filter.calendarRange(m, m, 'month')).mean().set('month', m);
        return newSSM.set('month',m);
    }));

var NDVICollection=ee.ImageCollection('MODIS/006/MOD13Q1')
    .filterDate('2010-01-01',now)
    .filterBounds(regions)
    .select('NDVI'); 

var col = NDVICollection.map(function(img){
    return img.multiply(0.0001)
    .copyProperties(img,['system:time_start','system:time_end']);
});

var monthsMask = ee.List([12,1,2]);
var byMonth = ee.ImageCollection.fromImages(
monthsMask.map(function (m) {
    return col.filter(ee.Filter.calendarRange(m, m, 'month'))
                .select('NDVI').mean()
                .set('month', m);
}));

var meanNDVI = byMonth.reduce(ee.Reducer.mean());
var mask = meanNDVI.gt(0.1);

var spring = SMAPCollection.filter(ee.Filter.calendarRange(12,2,'month'));
var fall = SMAPCollection.filter(ee.Filter.calendarRange(9,11,'month'));

var thisFall = SMAPCollection.filterDate('2019-09-01',now).filter(ee.Filter.calendarRange(9,11,'month'));
var thisSpring = SMAPCollection.filterDate('2019-09-01',now).filter(ee.Filter.calendarRange(12,2,'month'));

var JuPingFall = ee.ImageCollection(thisFall.mean().subtract(fall.mean()).updateMask(mask));
var JuPingSpring = ee.ImageCollection(thisSpring.mean().subtract(spring.mean()).updateMask(mask));

var JuPingFallPer = ee.ImageCollection((thisFall.mean().subtract(fall.mean()).divide(fall.mean())).updateMask(mask));
var JuPingSpringPer = ee.ImageCollection((thisSpring.mean().subtract(spring.mean()).divide(spring. mean())).updateMask(mask));  

var JuPing = ee.ImageCollection.fromImages(
    months.map(function (m) {
        var newSSM = SMAPCollection.filterDate('2019-09-01',now).filter(ee.Filter.calendarRange(m, m, 'month')).mean().set('month', m);
        var meanSSM = SMAPCollection.filter(ee.Filter.calendarRange(m, m, 'month')).mean().set('month', m);
        return newSSM.subtract(meanSSM).set('month', m).updateMask(mask);
    }));
var JuPingPer = ee.ImageCollection.fromImages(
    months.map(function (m) {
        var newSSM = SMAPCollection.filterDate('2019-09-01',now).filter(ee.Filter.calendarRange(m, m, 'month')).mean().set('month', m);
        var meanSSM = SMAPCollection.filter(ee.Filter.calendarRange(m, m, 'month')).mean().set('month', m);
        return newSSM.subtract(meanSSM).divide(meanSSM).set('month', m).updateMask(mask);
    }));
    print(JuPingPer);

// exportImgCol
function exportImgCol(imgCol,str) {
      var indexList = imgCol.reduceColumns(ee.Reducer.toList(), ["system:index"])
                            .get("list");
      indexList.evaluate(function(indexs) {
        for (var i=0; i<indexs.length; i++) {
          var image = imgCol.filter(ee.Filter.eq("system:index", indexs[i])).first();
            var desc_name = image.get('"system:index"').getInfo();
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
exportImgCol(JuPingSpring,'SMAP_JuPingSpring_');
exportImgCol(JuPingSpringPer,'SMAP_JuPingSpringPer_');
exportImgCol(JuPingFall,'SMAP_JuPingFall_');
exportImgCol(JuPingFallPer,'SMAP_JuPingFallPer_');


