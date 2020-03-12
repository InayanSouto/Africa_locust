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

var ssm_18_05 = SMAPCollection.filterDate('2018-05-01','2018-06-01').select('ssm').mean()
.set('name','ssm_18_05');
var ssm_18_10 = SMAPCollection.filterDate('2018-10-01','2018-11-01').select('ssm').mean()
.set('name','ssm_18_10');
var ssm_19_12 = SMAPCollection.filterDate('2019-12-01','2020-01-01').select('ssm').mean()
.set('name','ssm_19_12');

var meanMaySsm = SMAPCollection.filter(ee.Filter.calendarRange(5,5,'month')).select('ssm').mean()
.set('name','meanMaySsm');
var meanOctSsm = SMAPCollection.filter(ee.Filter.calendarRange(10,10,'month')).select('ssm').mean()
.set('name','meanOctSsm');
var meanDecSsm = SMAPCollection.filter(ee.Filter.calendarRange(12,12,'month')).select('ssm').mean()
.set('name','meanDecSsm');

var juping_05 = ssm_18_05.subtract(meanMaySsm).set('name','juping_05');
var juping_10 = ssm_18_10.subtract(meanMaySsm).set('name','juping_10');
var juping_12 = ssm_19_12.subtract(meanMaySsm).set('name','juping_12');

var ssmRatio_05 = ssm_18_05.subtract(meanMaySsm).divide(meanMaySsm).set('name','ssmRatio_05');
var ssmRatio_10 = ssm_18_10.subtract(meanOctSsm).divide(meanOctSsm).set('name','ssmRatio_10');
var ssmRatio_12 = ssm_19_12.subtract(meanDecSsm).divide(meanDecSsm).set('name','ssmRatio_12');

var exportCol = ee.ImageCollection([
  ssm_18_05,ssm_18_10,ssm_19_12,
  meanMaySsm,meanOctSsm,meanDecSsm,
  juping_05,juping_10,juping_12,
  ssmRatio_05,ssmRatio_10,ssmRatio_12]);

// exportImgCol
function exportImgCol(imgCol,str) {
      var indexList = imgCol.reduceColumns(ee.Reducer.toList(), ["system:index"])
                            .get("list");
      indexList.evaluate(function(indexs) {
        for (var i=0; i<indexs.length; i++) {
          var image = imgCol.filter(ee.Filter.eq("system:index", indexs[i])).first();
            var desc_name = image.get('name').getInfo();
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

exportImgCol(exportCol,'SMAP_data_');

