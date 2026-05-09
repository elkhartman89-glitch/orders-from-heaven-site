var SHEET_NAME = 'Prospects';

var PROSPECT_HEADERS = [
  'ID',
  'Company Name',
  'Contact Name',
  'Industry',
  'Address',
  'City',
  'State',
  'ZIP',
  'Phone',
  'Email',
  'Website',
  'Product Interest',
  'Status',
  'Notes',
  'Latitude',
  'Longitude',
  'Created Date',
  'Last Updated',
  'Sales Rep',
  'Rep Latitude',
  'Rep Longitude',
  'Distance Miles',
  'OEM Fit',
  'VMI Fit',
  'Hardware Fit',
  'Fastener Fit',
  'Chemical Fit',
  'Engineering Fit',
  'Lead Score',
  'Target Priority',
  'Vetting Status',
  'Source'
];

var AUSTIN_TARGET_KEYWORDS = [
  'manufacturer',
  'manufacturing',
  'oem',
  'fabrication',
  'fabricator',
  'machine shop',
  'machining',
  'metal works',
  'welding',
  'assembly',
  'industrial',
  'trailer manufacturer',
  'truck body',
  'equipment manufacturer',
  'ag equipment',
  'construction equipment',
  'fleet maintenance',
  'maintenance facility',
  'mro',
  'plant',
  'factory',
  'warehouse',
  'automation',
  'conveyor',
  'steel',
  'sheet metal',
  'cabinet manufacturer',
  'enclosure manufacturer',
  'vehicle manufacturer',
  'body builder',
  'utility body',
  'service body',
  'work truck',
  'rv manufacturer',
  'specialty vehicle',
  'contract manufacturer'
];

var AUSTIN_EXCLUDE_KEYWORDS = [
  'restaurant',
  'cafe',
  'bar',
  'salon',
  'spa',
  'church',
  'school',
  'apartment',
  'real estate',
  'insurance',
  'bank',
  'attorney',
  'law office',
  'dentist',
  'doctor',
  'clinic',
  'retail',
  'grocery',
  'hotel',
  'motel',
  'fitness',
  'gym',
  'massage',
  'daycare',
  'preschool',
  'coffee',
  'pizza',
  'burger',
  'taco',
  'pharmacy',
  'hospital',
  'veterinary',
  'pet',
  'beauty',
  'cosmetic'
];

var PRODUCT_FIT_KEYWORDS = {
  hardware: [
    'hardware',
    'hinge',
    'latch',
    'handle',
    'drawer slide',
    'lock',
    'catch',
    'bracket',
    'gas spring',
    'strut',
    'seal',
    'gasket',
    'weatherstrip',
    'access hardware',
    'industrial hardware'
  ],
  fasteners: [
    'fastener',
    'bolt',
    'nut',
    'screw',
    'washer',
    'rivet',
    'threaded',
    'anchor',
    'clamp',
    'stud',
    'pin',
    'clip',
    'insert',
    'socket cap',
    'hex bolt',
    'self tapping',
    'metric fastener'
  ],
  chemicals: [
    'adhesive',
    'sealant',
    'lubricant',
    'threadlocker',
    'cleaner',
    'chemical',
    'epoxy',
    'silicone',
    'caulk',
    'anti seize',
    'degreaser',
    'spray',
    'aerosol'
  ],
  engineering: [
    'engineering',
    'design',
    'custom',
    'prototype',
    'fabrication',
    'manufacturing support',
    'assembly',
    'cad',
    'drawing',
    'specialty',
    'application support'
  ],
  vmi: [
    'vmi',
    'vendor managed inventory',
    'inventory management',
    'kanban',
    'bin stock',
    'production supply',
    'mro',
    'maintenance supply',
    'blanket order',
    'kitting',
    'stockroom',
    'crib',
    'replenishment'
  ]
};

function getRequiredScriptProperty_(key) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) {
    throw new Error('Missing required Apps Script property: ' + key + '. Add it under Project Settings > Script Properties.');
  }
  return value;
}

function getOptionalScriptProperty_(key) {
  return PropertiesService.getScriptProperties().getProperty(key) || '';
}

function normalizeCellValue_(value) {
  if (value === null || value === undefined) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') return value.toISOString();
  return String(value).trim();
}

function degreesToRadians_(degrees) {
  return degrees * Math.PI / 180;
}

function calculateDistanceMiles_(lat1, lon1, lat2, lon2) {
  var aLat = Number(lat1);
  var aLon = Number(lon1);
  var bLat = Number(lat2);
  var bLon = Number(lon2);
  if (!isFinite(aLat) || !isFinite(aLon) || !isFinite(bLat) || !isFinite(bLon)) return '';

  var earthRadiusMiles = 3958.7613;
  var dLat = degreesToRadians_(bLat - aLat);
  var dLon = degreesToRadians_(bLon - aLon);
  var sinLat = Math.sin(dLat / 2);
  var sinLon = Math.sin(dLon / 2);
  var a = sinLat * sinLat + Math.cos(degreesToRadians_(aLat)) * Math.cos(degreesToRadians_(bLat)) * sinLon * sinLon;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusMiles * c * 10) / 10;
}
