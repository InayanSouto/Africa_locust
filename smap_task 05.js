var geometry = 
// study area 25w-110E，5S-40N。
    ee.Geometry.Polygon(
         [[[-25, 40],
           [-25, -5],
           [110, -5],
           [110, 40]]], null, false);
var regions = ee.FeatureCollection([
    ee.Feature(geometry)
  ]);

// imgCol
var now = ee.Date(Date.now());
var SMAPCollection = ee.ImageCollection("NASA_USDA/HSL/SMAP_soil_moisture")
    .filterDate('2015-04-01',now).select('ssm');

var months = ee.List.sequence(1,12);

var byMonth = ee.ImageCollection.fromImages(
    months.map(function (m) {
        return SMAPCollection.filter(ee.Filter.calendarRange(m, m, 'month'))
                .select('ssm').mean()
                .set('month', m);
}));


var smapCol_18 = ee.ImageCollection.fromImages(
    months.map(function (m) {
        return SMAPCollection
            .filterDate('2018-01-01', '2019-01-01')
            .filter(ee.Filter.calendarRange(m, m, 'month'))
            .select('ssm').mean()
            .set('month', m);
}));

var smapCol_19 = ee.ImageCollection.fromImages(
    months.map(function (m) {
        return SMAPCollection
            .filterDate('2019-01-01', '2020-01-01')
            .filter(ee.Filter.calendarRange(m, m, 'month'))
            .select('ssm').mean()
            .set('month', m);
}));

var smapCol_20 = ee.ImageCollection.fromImages(
    months.map(function (m) {
        return SMAPCollection
            .filterDate('2020-01-01', now)
            .filter(ee.Filter.calendarRange(m, m, 'month'))
            .select('ssm').mean()
            .set('month', m);
}));

var calJuping = function(image) {
    var m = image.get('month');
    var imgByMonth = byMonth.filter(ee.Filter.eq("month",m)).first();
    return image.subtract(imgByMonth).set('month', m);
};

var calJupingPer = function(image) {
    var m = image.get('month');
    var imgByMonth = byMonth.filter(ee.Filter.eq("month",m)).first();
    return image.subtract(imgByMonth).divide(imgByMonth).set('month', m);  
};

var juping_18 = smapCol_18.map(calJuping);
var juping_19 = smapCol_19.map(calJuping);
var juping_20 = smapCol_20.map(calJuping);
var jupingPer_18 =smapCol_18.map(calJupingPer);
var jupingPer_19 =smapCol_19.map(calJupingPer);
var jupingPer_20 =smapCol_20.map(calJupingPer);

print(jupingPer_18);
Map.addLayer(juping_18);
Map.addLayer(jupingPer_18);
// exportImgCol
function exportImgCol(imgCol,str) {
      var indexList = imgCol.reduceColumns(ee.Reducer.toList(), ["system:index"])
                            .get("list");
      indexList.evaluate(function(indexs) {
        for (var i=0; i<indexs.length; i++) {
          var image = imgCol.filter(ee.Filter.eq("system:index", indexs[i])).first();
            var desc_name = image.get('month').getInfo();
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

exportImgCol(juping_18,'juping_18_');
exportImgCol(juping_19,'juping_19_');
exportImgCol(juping_20,'juping_20_');
exportImgCol(jupingPer_18,'jupingPer_18_');
exportImgCol(jupingPer_19,'jupingPer_19_');
exportImgCol(jupingPer_20,'jupingPer_20_');



