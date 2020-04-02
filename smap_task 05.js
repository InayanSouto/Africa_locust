//1. study area 25w-110E，5S-40N。
var geometry = 
    ee.Geometry.Polygon(
         [[[-25, 40],
           [-25, -5],
           [110, -5],
           [110, 40]]], null, false);
var regions = ee.FeatureCollection([
    ee.Feature(geometry)
  ]);

Map.addLayer(regions,{},'Study Area');
Map.centerObject(regions,2);

// imgCol
var now = ee.Date(Date.now());
var SMAPCollection = ee.ImageCollection("NASA_USDA/HSL/SMAP_soil_moisture")
    .filterDate('2015-04-01',now).select('ssm');

// history mean per month
var months = ee.List.sequence(1,12);
var byMonth = ee.ImageCollection.fromImages(
    months.map(function (m) {
        return SMAPCollection.filter(ee.Filter.calendarRange(m, m, 'month'))
                .select('ssm').mean()
                .set('month', m);
}));

//2. Set month and year
var year_month = [];
for (var y = 2018; y <= 2020; y++){
  for (var m = 1; m < 13; m++){
    year_month.push([y,m]);
  }
}

var conditional = function(image) {
  return ee.Algorithms.If(ee.Number(image.bandNames().length()).gt(0),
                          image.set('month',image.get('month')).set('year',image.get('year')),
                          null);
};

var byAll = ee.ImageCollection.fromImages(
    year_month.map(function(ym){
      var y = ym[0];
      var m = ym[1];
      var image_ym = SMAPCollection.filter(ee.Filter.calendarRange(y, y, 'year'))
        .filter(ee.Filter.calendarRange(m, m, 'month'))
        .mean()
        .set('year',y)
        .set('month',m);
      var result = conditional(image_ym);
      return result;
      })
    );


var calJuping = function(image) {
    var m = image.get('month');
    var y = image.get('year');
    var imgByMonth = byMonth.filter(ee.Filter.eq("month",m)).first();
    return image.subtract(imgByMonth).set('month', m).set('year', y);
};

var calJupingPer = function(image) {
    var m = image.get('month');
    var y = image.get('year');

    var imgByMonth = byMonth.filter(ee.Filter.eq("month",m)).first();
    return image.subtract(imgByMonth).divide(imgByMonth).set('month', m).set('year', y);  
};

var juping = byAll.map(calJuping);
var jupingPer = byAll.map(calJupingPer);

print(juping)

//3. exportImgCol
function exportImgCol(imgCol,str) {
      var indexList = imgCol.reduceColumns(ee.Reducer.toList(), ["system:index"])
                            .get("list");
      indexList.evaluate(function(indexs) {
        for (var i=0; i<indexs.length; i++) {
          var image = imgCol.filter(ee.Filter.eq("system:index", indexs[i])).first();
            var desc_name = image.get("year").getInfo()+'_'+image.get("month").getInfo();
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

exportImgCol(juping,'juping_');
exportImgCol(jupingPer,'jupingPer_');



