// Google Apps Script — add this function into the SAME script project as
// the existing sendDailyLeadsReport() and onEdit() functions (don't
// replace them, just paste this alongside). It writes into the
// "לידים חטוב בלי תפריט" sheet/tab — same one onEdit() targets — with
// columns A–K as in the sheet (שם מלא … סיסטם שיחות), then L–P:
// אתר, מזהה קמפיין, מזהה ערכה, מזהה מודעה, מקור UTM.
// Add those five headers in row 5 (L5:P5) before deploying this version.
// Phones are written as digits only, and the same phone within 30 days is
// not added again (see isRecentDuplicate_). No backfill of old rows.
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

  var phone = cleanPhone_(data.phone);

  // אותו טלפון שנכנס שוב תוך 30 יום נשאר בשורה אחת: השורה הראשונה (והמודעה
  // הראשונה) קובעת, ולא נוגעים בה. ליד שחוזר אחרי יותר מ-30 יום נרשם מחדש,
  // כדי שלא ייבלע ליד שחזר להתעניין.
  if (phone && isRecentDuplicate_(sheet, phone, 30)) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "ok", duplicate: true })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  sheet.appendRow([
    data.name || "",           // שם ליד
    phone,                     // מספר טלפון (ספרות בלבד)
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

// טלפון כספרות בלבד: מסיר רווחים, מקפים, סוגריים ותווי כיוון נסתרים.
// 972XXXXXXXXX הופך ל-0XXXXXXXXX.
function cleanPhone_(value) {
  var digits = String(value || "").replace(/\D/g, "");
  if (digits.indexOf("972") === 0 && digits.length >= 11) digits = "0" + digits.slice(3);
  return digits;
}

// מפתח להשוואה: 9 הספרות האחרונות. ככה 0501234567, ‏501234567 (כשהגיליון
// מוריד את ה-0) ו-972501234567 נחשבים אותו מספר.
function phoneKey_(value) {
  var digits = cleanPhone_(value);
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

function isRecentDuplicate_(sheet, phone, days) {
  var firstDataRow = 6; // שורה 5 היא שורת הכותרות
  var lastRow = sheet.getLastRow();
  if (lastRow < firstDataRow) return false;
  var key = phoneKey_(phone);
  var since = new Date().getTime() - days * 24 * 60 * 60 * 1000;
  // עמודות B (טלפון) ו-C (תאריך יצירה)
  var values = sheet.getRange(firstDataRow, 2, lastRow - firstDataRow + 1, 2).getValues();
  for (var i = values.length - 1; i >= 0; i--) {
    if (phoneKey_(values[i][0]) !== key) continue;
    var created = values[i][1];
    var time = created instanceof Date ? created.getTime() : NaN;
    // בלי תאריך קריא: מתייחסים כחדש, כדי לא לבלוע ליד
    if (!isNaN(time) && time >= since) return true;
  }
  return false;
}