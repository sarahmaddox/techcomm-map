var SPREADSHEET_ID = 'INSERT-SPREADSHEET-ID-HERE';
var SHEET_NAME = 'Data';

function doGet(request) {
  var callback = request.parameters.jsonp;
  var range = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME).getDataRange();
  var json = callback + '(' + Utilities.jsonStringify(range.getValues()) + ')';
  
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JAVASCRIPT);
}