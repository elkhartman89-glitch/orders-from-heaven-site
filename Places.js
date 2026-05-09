function findAustinProspectsNearRep(repLocation, searchRadiusMiles) {
  if (!repLocation || !isFinite(Number(repLocation.lat)) || !isFinite(Number(repLocation.lng))) {
    throw new Error('Sales rep location is required before searching for prospects.');
  }

  var apiKey = getRequiredScriptProperty_('GOOGLE_MAPS_API_KEY');
  var radiusMiles = Number(searchRadiusMiles || 25);
  if (!isFinite(radiusMiles) || radiusMiles <= 0) radiusMiles = 25;
  var radiusMeters = Math.round(radiusMiles * 1609.344);
  var queries = [
    'OEM manufacturer',
    'industrial manufacturer',
    'machine shop',
    'metal fabricator',
    'equipment manufacturer',
    'trailer manufacturer',
    'truck body manufacturer',
    'specialty vehicle manufacturer',
    'industrial maintenance',
    'manufacturing plant',
    'assembly manufacturer',
    'contract manufacturer',
    'sheet metal fabricator',
    'steel fabricator',
    'automation equipment manufacturer'
  ];

  var allPlaces = [];
  queries.forEach(function(query) {
    var places = searchPlacesText_(query, repLocation, radiusMeters, apiKey);
    allPlaces = allPlaces.concat(places);
    Utilities.sleep(125);
  });

  var deduped = dedupePlaces_(allPlaces);
  var candidates = deduped
    .map(function(place) { return scoreAustinProspect_(place, repLocation); })
    .filter(function(candidate) { return !candidate.rejected; })
    .sort(function(a, b) {
      if (b.leadScore !== a.leadScore) return b.leadScore - a.leadScore;
      return Number(a.distanceMiles || 9999) - Number(b.distanceMiles || 9999);
    });

  return {
    repLocation: repLocation,
    radiusMiles: radiusMiles,
    searchedQueries: queries,
    candidateCount: candidates.length,
    candidates: candidates
  };
}

function searchPlacesText_(query, repLocation, radiusMeters, apiKey) {
  var url = 'https://places.googleapis.com/v1/places:searchText';
  var payload = {
    textQuery: query,
    locationBias: {
      circle: {
        center: {
          latitude: Number(repLocation.lat),
          longitude: Number(repLocation.lng)
        },
        radius: radiusMeters
      }
    },
    maxResultCount: 20
  };

  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.websiteUri,places.types,places.businessStatus'
    }
  });

  var code = response.getResponseCode();
  var body = response.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('Places API Text Search failed for query "' + query + '". Response code: ' + code + '. Body: ' + body);
  }

  var parsed = JSON.parse(body || '{}');
  var places = parsed.places || [];
  places.forEach(function(place) {
    place.searchQuery = query;
  });
  return places;
}

function dedupePlaces_(places) {
  var seen = {};
  var result = [];
  places.forEach(function(place) {
    var id = place.id || [place.displayName && place.displayName.text, place.formattedAddress].join('|');
    if (!id || seen[id]) return;
    seen[id] = true;
    result.push(place);
  });
  return result;
}
