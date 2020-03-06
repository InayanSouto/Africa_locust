var mergedCollection = s2
    .filterDate('2018-01-01', '2018-03-01')
    .map(function(image) {
      return image.select(['B8', 'B4'], ['NIR', 'red'])
    })

var mergedAllFunction = function(image) {
 var ndvi = image.normalizedDifference(['NIR', 'red']).rename('NDVI');

 var thres1 = ndvi.gte(0).rename('thres1')
 var thres2=ndvi.gt(0.1).and(ndvi.lt(0.3)).rename('thres2')
 var thres3=ndvi.gt(0.4).and(ndvi.lt(0.7)).rename('thres3')
 var thres4=ndvi.gt(0.8).and(ndvi.lte(1)).rename('thres4')

 return image.addBands(ndvi).addBands([thres1,thres2,thres3,thres4]);
}

var median = mergedCollection.median();

var merged = mergedAllFunction(median);

var areas = merged
    .select(['thres1', 'thres2', 'thres3', 'thres4'])
    .multiply(ee.Image.pixelArea())
    .reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: geometry,  // a geometry
      scale: 10,   // scale = 10 for sentinel-2 'red' band
      maxPixels: 1e9  
    });
print(areas)