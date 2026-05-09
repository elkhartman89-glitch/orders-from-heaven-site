function doGet() {
  var template = HtmlService.createTemplateFromFile('Index');
  template.mapsApiKey = getRequiredScriptProperty_('GOOGLE_MAPS_API_KEY');
  template.logoUrl = getOptionalScriptProperty_('AUSTIN_LOGO_URL');

  return template
    .evaluate()
    .setTitle('Austin Hardware Prospecting Map')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
