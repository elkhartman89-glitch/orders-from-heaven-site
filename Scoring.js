function scoreAustinProspect_(place, repLocation) {
  var displayName = place.displayName && place.displayName.text ? place.displayName.text : '';
  var types = Array.isArray(place.types) ? place.types.join(' ') : '';
  var searchQuery = place.searchQuery || '';
  var address = place.formattedAddress || '';
  var website = place.websiteUri || '';
  var phone = place.nationalPhoneNumber || '';
  var text = [displayName, types, searchQuery, address, website, phone].join(' ').toLowerCase();

  if (hasAnyKeyword_(text, AUSTIN_EXCLUDE_KEYWORDS)) {
    return buildScoredCandidate_(place, repLocation, {
      rejected: true,
      leadScore: 0,
      targetPriority: 'Reject',
      vettingStatus: 'Rejected: consumer or non-OEM keyword detected.',
      oemFit: false,
      vmiFit: false,
      hardwareFit: false,
      fastenerFit: false,
      chemicalFit: false,
      engineeringFit: false
    });
  }

  var oemFit = hasAnyKeyword_(text, AUSTIN_TARGET_KEYWORDS);
  var hardwareFit = hasAnyKeyword_(text, PRODUCT_FIT_KEYWORDS.hardware);
  var fastenerFit = hasAnyKeyword_(text, PRODUCT_FIT_KEYWORDS.fasteners);
  var chemicalFit = hasAnyKeyword_(text, PRODUCT_FIT_KEYWORDS.chemicals);
  var engineeringFit = hasAnyKeyword_(text, PRODUCT_FIT_KEYWORDS.engineering);
  var vmiFit = hasAnyKeyword_(text, PRODUCT_FIT_KEYWORDS.vmi);

  if (!oemFit && !vmiFit) {
    return buildScoredCandidate_(place, repLocation, {
      rejected: true,
      leadScore: 0,
      targetPriority: 'Reject',
      vettingStatus: 'Rejected: weak OEM/VMI fit.',
      oemFit: false,
      vmiFit: false,
      hardwareFit: hardwareFit,
      fastenerFit: fastenerFit,
      chemicalFit: chemicalFit,
      engineeringFit: engineeringFit
    });
  }

  var location = place.location || {};
  var distance = calculateDistanceMiles_(repLocation.lat, repLocation.lng, location.latitude, location.longitude);
  var score = 0;
  if (oemFit) score += 40;
  if (fastenerFit) score += 20;
  if (hardwareFit) score += 15;
  if (chemicalFit) score += 10;
  if (engineeringFit) score += 10;
  if (vmiFit) score += 35;
  if (distance !== '' && distance <= 10) score += 10;
  else if (distance !== '' && distance <= 25) score += 5;

  var priority = 'Cold';
  if (vmiFit || score >= 80) priority = 'Hot';
  else if (score >= 50) priority = 'Warm';

  return buildScoredCandidate_(place, repLocation, {
    rejected: false,
    leadScore: score,
    targetPriority: priority,
    vettingStatus: vmiFit ? 'Accepted: VMI fit, treat as Hot Target.' : 'Accepted: industrial/OEM prospect candidate.',
    oemFit: oemFit,
    vmiFit: vmiFit,
    hardwareFit: hardwareFit,
    fastenerFit: fastenerFit,
    chemicalFit: chemicalFit,
    engineeringFit: engineeringFit
  });
}

function buildScoredCandidate_(place, repLocation, scoring) {
  var location = place.location || {};
  var distance = calculateDistanceMiles_(repLocation.lat, repLocation.lng, location.latitude, location.longitude);
  return {
    placeId: place.id || '',
    name: place.displayName && place.displayName.text ? place.displayName.text : '',
    address: place.formattedAddress || '',
    phone: place.nationalPhoneNumber || '',
    website: place.websiteUri || '',
    types: Array.isArray(place.types) ? place.types : [],
    businessStatus: place.businessStatus || '',
    lat: location.latitude || '',
    lng: location.longitude || '',
    distanceMiles: distance,
    sourceQuery: place.searchQuery || '',
    leadScore: scoring.leadScore,
    targetPriority: scoring.targetPriority,
    vettingStatus: scoring.vettingStatus,
    rejected: scoring.rejected,
    oemFit: scoring.oemFit,
    vmiFit: scoring.vmiFit,
    hardwareFit: scoring.hardwareFit,
    fastenerFit: scoring.fastenerFit,
    chemicalFit: scoring.chemicalFit,
    engineeringFit: scoring.engineeringFit
  };
}

function hasAnyKeyword_(text, keywords) {
  var normalized = String(text || '').toLowerCase();
  for (var i = 0; i < keywords.length; i += 1) {
    if (normalized.indexOf(String(keywords[i]).toLowerCase()) !== -1) return true;
  }
  return false;
}
