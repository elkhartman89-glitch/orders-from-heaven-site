function setupAustinHardwareProspectingSheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('No active spreadsheet found. Create this as a container-bound Apps Script project from the prospecting Google Sheet.');
  }

  var sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  sheet.clear();
  sheet.getRange(1, 1, 1, PROSPECT_HEADERS.length).setValues([PROSPECT_HEADERS]);
  sheet.getRange(1, 1, 1, PROSPECT_HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#1f2937')
    .setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, PROSPECT_HEADERS.length);
  return { ok: true, sheetName: SHEET_NAME, headers: PROSPECT_HEADERS };
}

function getProspectSheet_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('No active spreadsheet found. This app must be connected to a Google Sheet.');
  }
  var sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Missing sheet tab "' + SHEET_NAME + '". Run setupAustinHardwareProspectingSheet() first.');
  }
  return sheet;
}

function getProspects() {
  var sheet = getProspectSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, PROSPECT_HEADERS.length).getValues();
  return values
    .filter(function(row) { return row.some(function(value) { return normalizeCellValue_(value) !== ''; }); })
    .map(function(row) { return rowToProspect_(row); });
}

function addProspect(prospect) {
  var normalized = normalizeProspect_(prospect || {});
  if (!normalized['Company Name']) throw new Error('Company Name is required.');

  var sheet = getProspectSheet_();
  var now = new Date().toISOString();
  normalized.ID = normalized.ID || Utilities.getUuid();
  normalized['Created Date'] = normalized['Created Date'] || now;
  normalized['Last Updated'] = now;
  normalized.Source = normalized.Source || 'Manual Entry';
  if (isYes_(normalized['VMI Fit'])) normalized['Target Priority'] = 'Hot';
  normalized['Target Priority'] = normalized['Target Priority'] || 'Cold';
  normalized.Status = normalized.Status || (normalized['Target Priority'] === 'Hot' ? 'New' : 'Candidate Review');

  sheet.appendRow(PROSPECT_HEADERS.map(function(header) { return normalized[header] || ''; }));
  return rowToProspect_(PROSPECT_HEADERS.map(function(header) { return normalized[header] || ''; }));
}

function updateProspect(id, updates) {
  if (!id) throw new Error('Prospect ID is required for update.');
  var sheet = getProspectSheet_();
  var rowNumber = findProspectRowById_(sheet, id);
  if (!rowNumber) throw new Error('Prospect not found: ' + id);

  var currentValues = sheet.getRange(rowNumber, 1, 1, PROSPECT_HEADERS.length).getValues()[0];
  var prospect = rowToProspect_(currentValues);
  var allowed = {
    'Company Name': true,
    'Contact Name': true,
    Industry: true,
    Address: true,
    City: true,
    State: true,
    ZIP: true,
    Phone: true,
    Email: true,
    Website: true,
    'Product Interest': true,
    Status: true,
    Notes: true,
    Latitude: true,
    Longitude: true,
    'Sales Rep': true,
    'Rep Latitude': true,
    'Rep Longitude': true,
    'Distance Miles': true,
    'OEM Fit': true,
    'VMI Fit': true,
    'Hardware Fit': true,
    'Fastener Fit': true,
    'Chemical Fit': true,
    'Engineering Fit': true,
    'Lead Score': true,
    'Target Priority': true,
    'Vetting Status': true,
    Source: true
  };

  Object.keys(updates || {}).forEach(function(key) {
    if (allowed[key]) prospect[key] = normalizeCellValue_(updates[key]);
  });
  if (isYes_(prospect['VMI Fit'])) prospect['Target Priority'] = 'Hot';
  prospect['Last Updated'] = new Date().toISOString();

  sheet.getRange(rowNumber, 1, 1, PROSPECT_HEADERS.length).setValues([PROSPECT_HEADERS.map(function(header) { return prospect[header] || ''; })]);
  return prospect;
}

function deleteProspect(id) {
  if (!id) throw new Error('Prospect ID is required for delete.');
  var sheet = getProspectSheet_();
  var rowNumber = findProspectRowById_(sheet, id);
  if (!rowNumber) throw new Error('Prospect not found: ' + id);
  sheet.deleteRow(rowNumber);
  return { ok: true, id: id };
}

function addAustinVettedProspect(candidate, rep) {
  if (!candidate || !candidate.name) throw new Error('Candidate company name is required.');
  var priority = candidate.vmiFit ? 'Hot' : (candidate.targetPriority || 'Cold');
  var status = priority === 'Hot' ? 'New' : 'Candidate Review';
  var prospect = {
    'Company Name': candidate.name,
    'Contact Name': '',
    Industry: candidate.sourceQuery || (candidate.types || []).join(', '),
    Address: candidate.address || '',
    City: '',
    State: '',
    ZIP: '',
    Phone: candidate.phone || '',
    Email: '',
    Website: candidate.website || '',
    'Product Interest': buildProductInterest_(candidate),
    Status: status,
    Notes: 'Added from Google Places vetted candidate. Place ID: ' + (candidate.placeId || ''),
    Latitude: candidate.lat || '',
    Longitude: candidate.lng || '',
    'Sales Rep': rep && rep.name ? rep.name : '',
    'Rep Latitude': rep && rep.lat ? rep.lat : '',
    'Rep Longitude': rep && rep.lng ? rep.lng : '',
    'Distance Miles': candidate.distanceMiles || '',
    'OEM Fit': yesNo_(candidate.oemFit),
    'VMI Fit': yesNo_(candidate.vmiFit),
    'Hardware Fit': yesNo_(candidate.hardwareFit),
    'Fastener Fit': yesNo_(candidate.fastenerFit),
    'Chemical Fit': yesNo_(candidate.chemicalFit),
    'Engineering Fit': yesNo_(candidate.engineeringFit),
    'Lead Score': candidate.leadScore || 0,
    'Target Priority': priority,
    'Vetting Status': candidate.vettingStatus || 'Vetted candidate',
    Source: 'Google Places Vetted Candidate'
  };
  return addProspect(prospect);
}

function buildProductInterest_(candidate) {
  var interests = [];
  if (candidate.fastenerFit) interests.push('Fasteners');
  if (candidate.hardwareFit) interests.push('Industrial Hardware');
  if (candidate.chemicalFit) interests.push('Chemicals');
  if (candidate.engineeringFit) interests.push('Engineering Services');
  if (candidate.vmiFit) interests.push('VMI');
  return interests.length ? interests.join(', ') : 'General industrial prospect';
}

function normalizeProspect_(prospect) {
  var normalized = {};
  PROSPECT_HEADERS.forEach(function(header) {
    normalized[header] = normalizeCellValue_(prospect[header]);
  });

  // Accept frontend-friendly aliases while keeping the sheet schema exact.
  var aliases = {
    companyName: 'Company Name',
    contactName: 'Contact Name',
    industry: 'Industry',
    address: 'Address',
    city: 'City',
    state: 'State',
    zip: 'ZIP',
    phone: 'Phone',
    email: 'Email',
    website: 'Website',
    productInterest: 'Product Interest',
    status: 'Status',
    notes: 'Notes',
    lat: 'Latitude',
    lng: 'Longitude',
    latitude: 'Latitude',
    longitude: 'Longitude',
    salesRep: 'Sales Rep',
    repLat: 'Rep Latitude',
    repLng: 'Rep Longitude',
    distanceMiles: 'Distance Miles',
    oemFit: 'OEM Fit',
    vmiFit: 'VMI Fit',
    hardwareFit: 'Hardware Fit',
    fastenerFit: 'Fastener Fit',
    chemicalFit: 'Chemical Fit',
    engineeringFit: 'Engineering Fit',
    leadScore: 'Lead Score',
    targetPriority: 'Target Priority',
    vettingStatus: 'Vetting Status',
    source: 'Source'
  };
  Object.keys(aliases).forEach(function(alias) {
    if (prospect[alias] !== undefined && prospect[alias] !== null && prospect[alias] !== '') {
      normalized[aliases[alias]] = booleanAwareValue_(prospect[alias]);
    }
  });
  return normalized;
}

function booleanAwareValue_(value) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return normalizeCellValue_(value);
}

function rowToProspect_(row) {
  var prospect = {};
  PROSPECT_HEADERS.forEach(function(header, index) {
    prospect[header] = normalizeCellValue_(row[index]);
  });
  return prospect;
}

function findProspectRowById_(sheet, id) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i += 1) {
    if (normalizeCellValue_(ids[i][0]) === String(id)) return i + 2;
  }
  return 0;
}

function yesNo_(value) {
  return value ? 'Yes' : 'No';
}

function isYes_(value) {
  return String(value || '').toLowerCase() === 'yes' || value === true;
}
