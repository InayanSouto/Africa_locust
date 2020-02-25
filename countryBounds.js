// study area
var sudan = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filter(ee.Filter.eq('country_na', 'Sudan')),
  arabia = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filter(ee.Filter.eq('country_na', 'Saudi Arabia')),  
  eritrea = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filter(ee.Filter.eq('country_na', 'Eritrea')),
  ethiopia = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filter(ee.Filter.eq('country_na', 'Ethiopia')),
  kenya = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filter(ee.Filter.eq('country_na', 'Kenya')),
  yemen = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filter(ee.Filter.eq('country_na', 'Yemen')),
  oman = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filter(ee.Filter.eq('country_na', 'Oman')),
  somalia = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filter(ee.Filter.eq('country_na', 'Somalia')),
  somalia = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filter(ee.Filter.eq('country_na', 'Somalia')),
  pakistan = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filter(ee.Filter.eq('country_na', 'Pakistan'));

var roiFilter = ee.Filter.or(
  ee.Filter.eq('country_na', 'Sudan'),
  ee.Filter.eq('country_na', 'Eritrea'),
  ee.Filter.eq('country_na', 'Ethiopia'),
  ee.Filter.eq('country_na', 'Somalia'),
  ee.Filter.eq('country_na', 'Kenya'),
  ee.Filter.eq('country_na', 'Yemen'),
  ee.Filter.eq('country_na', 'Oman'),
  ee.Filter.eq('country_na', 'Pakistan'),
  ee.Filter.eq('country_na', 'Saudi Arabia')
);
var shp = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');
// study area 
var regions = ee.FeatureCollection([
  ee.Feature(    // study area.
    ee.Geometry.Rectangle(20, -5, 75, 35), {label: 'study Area'})
]);

var studyArea = shp;
Export.table.toDrive({
  collection:studyArea,
  description:'studyArea',
});

Export.table.toDrive({
  collection:regions,
  description:'regions',
});
// print (studyArea);
Map.centerObject(studyArea,4);
Map.addLayer(studyArea, {}, "StudyArea");

