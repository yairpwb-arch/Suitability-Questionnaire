// Google Apps Script — paste this into Extensions > Apps Script on the
// Google Sheet that should collect leads, then deploy as a Web App:
//   Deploy > New deployment > Type: Web app
//   Execute as: Me
//   Who has access: Anyone
// Copy the resulting URL and send it back — it goes into the site's
// GOOGLE_SHEETS_WEBHOOK_URL environment variable.

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "תאריך",
      "שם",
      "טלפון",
      "כמה זמן ניסית לשנות",
      "למה חשוב לך עכשיו",
    ]);
  }

  sheet.appendRow([
    new Date(),
    data.name || "",
    data.phone || "",
    data.duration || "",
    data.reason || "",
  ]);

  return ContentService.createTextOutput(
    JSON.stringify({ status: "ok" })
  ).setMimeType(ContentService.MimeType.JSON);
}
