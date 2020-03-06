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

var addTime = function(image) {
  // Scale milliseconds by a large constant to avoid very small slopes
  // in the linear regression output.
  return image.addBands(image.metadata('system:time_start').divide(1e18));
};

var collection = col.map(addTime);
var taskNdviCol = collection.filterDate('2019-11-01',now);

var linearFit = taskNdviCol.select(['system:time_start', 'NDVI'])
  .reduce(ee.Reducer.linearFit());  

// Display the results.
Map.centerObject(regions,2);
Map.addLayer(linearFit.clip(regions), 
  {min: [0, 150, 0], max: [-0.9, 1700, 1], bands: ['scale',  'offset', 'scale']}, 'fit');

function exportImgCol(imgCol,str) {
      var indexList = imgCol.reduceColumns(ee.Reducer.toList(), ["system:index"]).get("list");
      indexList.evaluate(function(indexs) {
        for (var i=0; i<indexs.length; i++) {
          var img0      = imgCol.filter(ee.Filter.eq("system:index", indexs[i])).first().updateMask(mask);
          var desc_name = img0.get('system:index').getInfo();
            Export.image.toDrive({
            image      : img0.clip(regions),
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

exportImgCol(ee.ImageCollection(linearFit.updateMask(mask)),'regress_');
