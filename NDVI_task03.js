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

var taskNdviCol = col.filterDate('2019-11-01',now);

function exportImgCol(imgCol,str) {
      var indexList = imgCol.reduceColumns(ee.Reducer.toList(), ["system:index"]).get("list");
      indexList.evaluate(function(indexs) {
        for (var i=0; i<indexs.length; i++) {
          var img0      = imgCol.filter(ee.Filter.eq("system:index", indexs[i])).first().updateMask(mask);
          var img1      = imgCol.filter(ee.Filter.eq("system:index", indexs[i+1])).first().updateMask(mask);
          var img       = img1.subtract(img0);
          var desc_name = img1.get('system:index').getInfo();
            Export.image.toDrive({
            image      : img.clip(regions),
            description: str + desc_name,
            folder     : 'Africa_Locust',
            region     : regions.geometry().bounds(),
            scale      : 1000,
            crs        : "EPSG:4326",
            maxPixels  : 1e13
          });
        }
      });
    }

exportImgCol(taskNdviCol,'NDVIDiff_');
