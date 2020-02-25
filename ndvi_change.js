// study area 
var regions = ee.FeatureCollection([
    ee.Feature(    // study area.
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
var img1 =  col.filterDate('2019-12-01','2019-12-15').first(),
    img2 =  col.filterDate('2018-12-01','2018-12-15').first(),
    imgChange = img1.subtract(img2);

var visParam = {
    min: -1.0,
    max: 1.0,
    palette: ['FF0000', 'FFFFFF', '00FF00'],
  };
  
  Map.centerObject(regions,2)
  Map.addLayer(imgChange.clip(regions),visParam,'Juping');
