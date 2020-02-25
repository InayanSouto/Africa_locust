var polygon = ee.Geometry.Polygon([[-92.56227555674951,40.858223918075275],
    [-92.56227555674951,40.85666590660416],
    [-92.56227555674951,40.85666590660416],
    [-92.55961480540674,40.85828883442468]]);

var startDateEarly = ee.Date('1981-01-01');
var endDateEarly = ee.Date('1983-12-31');

var chirpsColl = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
.filterDate(startDateEarly, endDateEarly)
.filterBounds(polygon);

var chirpsMean = ui.Chart.image.doySeries({
imageCollection: chirpsColl,
region: polygon,
scale: 1,
yearReducer: ee.Reducer.mean(),
//seriesProperty: 'label'
});
//print(chirpsMean);

var doySeries = function(imageCollection, region, scale,
regionReducer, yearReducer, 
startDay, endDay) {
startDay = startDay || 1
endDay = endDay || 366
regionReducer = regionReducer || 'mean'
yearReducer = yearReducer || 'mean'

// Add doy to each image in the collection
var addDoy = function(img) {
img = ee.Image(img)
var doy = img.date().getRelative('day', 'year')
doy = ee.Number(doy).add(1) // somehow gets the first day of the year as 0 and so on..
return img.set('doy', doy)
}
var withDoy = imageCollection.map(addDoy)

// Reduce over doy
var doys = ee.List.sequence(startDay, endDay)
var reduceDoy = function(doy) {
var filterDoy = withDoy.filterMetadata('doy', 'equals', doy)
return ee.Image(filterDoy.reduce(yearReducer)).set('doy', doy)
}
var reducedDoy = doys.map(reduceDoy)

// Reduce over region
var reduceRegion = function(img) {
img = ee.Image(img)
var doy = img.get('doy')
var reduction = img.reduceRegion({
reducer: regionReducer,
geometry: region,
scale: scale
})
reduction = ee.Dictionary(reduction)
return ee.Algorithms.If(reduction.contains('precipitation_mean'),
reduction.get('precipitation_mean'),
0)
}

return reducedDoy.map(reduceRegion)
}

var array = doySeries(chirpsColl, polygon, 1)
print(array)