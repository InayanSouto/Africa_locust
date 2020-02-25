// study area 
var roi = ee.FeatureCollection([
    ee.Feature(    // study area.
      ee.Geometry.Rectangle(20, -5, 75, 35), {label: 'study Area'})
  ]);

// images
var now = ee.Date(Date.now())
var NDVICollection=ee.ImageCollection('MODIS/006/MOD13Q1')
    .filterDate('2019-12-01',now)
    .select('NDVI');

// masker
var masker = function(image){ 
    var mask1 = image.select('NDVI').lte(10000);
    var mask2 = image.select('NDVI').gte(2000);
    return image.updateMask(mask1).updateMask(mask2);
    };

// Create clipping function
var clipper = function(image){
    return image.clip(roi);
  };

var ndvi = NDVICollection.map(clipper).map(masker);

// PREPARE DATA FOR EXPORT
// Tyler Erickson provided the stacking function
// https://gis.stackexchange.com/a/254778/67264
var stackCollection = function(collection) {
    var first = ee.Image(collection.first()).select([]);
    // Write a function that appends a band to an image.
    var appendBands = function(image, previous) {
        var dateString = ee.Date(image.get('system:time_start')).format('yyyy-MM-dd');
        return ee.Image(previous).addBands(image.rename(dateString));
    };
    return ee.Image(collection.iterate(appendBands, first));
  };
var ndvi_img = stackCollection(ndvi);
print(ndvi_img);

Map.centerObject(roi,2);
Map.addLayer(ndvi_img,{},'ndvi_img')
Map.addLayer(roi,{},'Study Area');

var size = ndvi.size();
var list=ndvi.toList(size);//depend on your list
for (var i=0;i<size;i++){
        var image=ee.select(i);
        var name=ee.String('NDVI_img_')
        .cat(ee.String(ee.Number(i+1)))
        .getInfo();
    print(name);
    Export.image.toDrive({ 
    image: image,
    description:name,
    scale: 250,
    maxPixels:1e13
});
}

var ndvi_final = ndvi_img.unmask(-9999);
Export.image.toAssets({
  image: ndvi_final,
  description: 'MOD13Q1_comp_NDVI',
  scale: 250,
  region: roi,
  fileFormat: 'GeoTIFF',
  formatOptions: {
    cloudOptimized: true
  },
  maxPixels:1e13,
  assetId: "Africa_lLcust/MOD13Q1_comp_NDVI",

});


