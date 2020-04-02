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
var mask = meanNDVI.gt(0.1);
var img12 = byMonth.filter(ee.Filter.eq('month', ee.Number(12))).first().updateMask(mask);
var img11 = byMonth.filter(ee.Filter.eq('month', ee.Number(11))).first().updateMask(mask);
var img1 = byMonth.filter(ee.Filter.eq('month', ee.Number(1))).first().updateMask(mask);
var img2 = byMonth.filter(ee.Filter.eq('month', ee.Number(2))).first().updateMask(mask);

var ndviChange_12 = img12.subtract(img11).set('name','ndviChange_12');
var ndviChange_1 = img1.subtract(img12).set('name','ndviChange_1');
var ndviChange_2 = img12.subtract(img1).set('name','ndviChange_2');

var ndviChange = ee.ImageCollection([ndviChange_12,ndviChange_1,ndviChange_2]);

Map.centerObject(regions);
Map.addLayer(regions,{},'Study Area');

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

exportImgCol(ndviChange,'month_');
