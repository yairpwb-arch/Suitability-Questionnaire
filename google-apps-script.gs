// Google Apps Script — add this function into the SAME script project as
// the existing sendDailyLeadsReport() and onEdit() functions (don't
// replace them, just paste this alongside). It writes into the
// "לידים חטוב בלי תפריט" sheet/tab — same one onEdit() targets — with
// columns A–K as in the sheet (שם מלא … סיסטם שיחות), then L–P:
// אתר, מזהה קמפיין, מזהה ערכה, מזהה מודעה, מקור UTM.
// Add those five headers in row 5 (L5:P5) before deploying this version.
// Then deploy as a Web App:
//   Deploy > New deployment > Type: Web app
//   Execute as: Me
//   Who has access: Anyone
// Copy the resulting URL and send it back — it goes into the site's
// GOOGLE_SHEETS_WEBHOOK_URL environment variable.
//
// Note: appendRow() called from a Web App doesn't trigger onEdit(), so
// this won't double-write the date/status that onEdit() fills in for
// manual edits — this function sets them directly instead.

function doPost(e) {
  // Two leads arriving at the same moment can make appendRow() overwrite
  // each other's row; the lock makes them write one after the other.
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return writeLead_(e);
  } finally {
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

function writeLead_(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    "לידים חטוב בלי תפריט"
  );
  var data = JSON.parse(e.postData.contents);

  // השאלון החדש שולח source + notes משלו. שאלון ההתאמה הקודם ממשיך לעבוד כמו קודם.
  var source = data.source || "מודעה ישירה";
  var notes = data.notes ||
    ("כמה זמן מנסה להתחיל תהליך: " + (data.duration || "-") +
     "\n" +
     "הערה: " + (data.reason || "-"));

  sheet.appendRow([
    data.name || "",           // שם ליד
    data.phone || "",          // מספר טלפון
    new Date(),                // תאריך יצירה
    source,                    // מקור הגעה
    "חדש",                     // סטטוס
    "",                        // תאריך פולואו/חזרה הבאה
    "",                        // סכום סגירה
    "",                        // תאריך סגירה
    notes,                     // I: הערות
    "",                        // J: הערות אישיות
    "",                        // K: סיסטם שיחות
    // L–P: מאיפה הגיע הליד. Meta ממלאת את המזהים בכל קליק על מודעה.
    // ליד בלי מזהים = לא הגיע ממודעה עם פרמטרים (מודעה ישנה, ביו, קישור ישיר).
    data.site || "",           // L: אתר (ראשי / בלי התחייבות)
    data.utm_campaign || "",   // M: מזהה קמפיין
    data.utm_term || "",       // N: מזהה ערכה
    data.utm_content || "",    // O: מזהה מודעה
    [data.utm_source, data.utm_medium].filter(Boolean).join(" / "), // P: מקור UTM
  ]);

  return ContentService.createTextOutput(
    JSON.stringify({ status: "ok" })
  ).setMimeType(ContentService.MimeType.JSON);
}