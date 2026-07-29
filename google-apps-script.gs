// Google Apps Script — paste this into Extensions > Apps Script on the
// LEADS Google Sheet (the one with columns: שם ליד, מספר טלפון, תאריך
// יצירה, מקור הגעה, סטטוס, תאריך פולואו/חזרה הבאה, סכום סגירה, תאריך
// סגירה, הערות להמשך, סיבת אי סגירה), on the FIRST sheet/tab.
// Then deploy as a Web App:
//   Deploy > New deployment > Type: Web app
//   Execute as: Me
//   Who has access: Anyone
// Copy the resulting URL and send it back — it goes into the site's
// GOOGLE_SHEETS_WEBHOOK_URL environment variable.

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = JSON.parse(e.postData.contents);

  var notes =
    "כמה זמן מנסה להתחיל תהליך: " + (data.duration || "-") +
    "\n" +
    "הערה: " + (data.reason || "-");

  sheet.appendRow([
    data.name || "",           // שם ליד
    data.phone || "",          // מספר טלפון
    new Date(),                // תאריך יצירה
    "מודעה ישירה",             // מקור הגעה
    "חדש",                     // סטטוס
    "",                        // תאריך פולואו/חזרה הבאה
    "",                        // סכום סגירה
    "",                        // תאריך סגירה
    notes,                     // הערות להמשך
    "",                        // סיבת אי סגירה
  ]);

  return ContentService.createTextOutput(
    JSON.stringify({ status: "ok" })
  ).setMimeType(ContentService.MimeType.JSON);
}