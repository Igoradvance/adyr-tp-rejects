# CHANGELOG – TP Reject Management System

כל הזכויות שמורות © Igor Ositchansky – Advance Engineering

---

## Build 22 – 2026-06-23
### הוסף
- הבהוב כחול על שורות עם הודעות צ'אט שלא נקראו — נעצר כשפותחים את הטיקט

---

## Build 21 – 2026-06-22
### הוסף
- כפתור שינוי סיסמה בheader לכל משתמש מחובר

---

## Build 20 – 2026-06-22
### הוסף
- ייבוא 203 תקלות מאקסל (189 פתוח, 13 סגור)
- צביעת שורה ירוקה לתקלות סגורות בלבד
- סקריפט ייבוא scripts/import_excel.py

---

## Build 19 – 2026-06-22
### הוסף
- מחיקה המונית לסופר אדמין עם אישור לפני מחיקה

---

## Build 18 – 2026-06-22
### תיקון
- הסרת seed אוטומטי של תקלות דמו כשהטבלה ריקה

---

## Build 17 – 2026-06-22
### תיקון
- /api/users/list: שאיבת משתמשים דרך auth.admin.listUsers + merge עם profiles — עוקף RLS לחלוטין

---

## Build 16 – 2026-06-22
### תיקון
- יצירת משתמש: אם קיים ב-Auth אבל בלי פרופיל — upsert במקום שגיאה

---

## Build 15 – 2026-06-22
### תיקון
- הסרת Proxy מ-supabase.ts — createClient ישיר עם keys קשיחים
- next.config: missingSuspenseWithCSRBailout false

---

## Build 14 – 2026-06-22
### תיקון
- refreshUsers עם try/catch — לא חוסם את ה-store אם /api/users/list נכשל
- ticketsLoading מתחיל כ-false — UI לא תקוע אם fetch מתעכב

---

## Build 13 – 2026-06-22
### תיקון
- Supabase keys מוטמעים ישירות בקוד כ-fallback — פתרון סופי לבעיית env vars ריקים בVercel

---

## Build 12 – 2026-06-22
### תיקון
- Supabase Proxy: bind פונקציות ל-client האמיתי — מונע client-side exception

---

## Build 11 – 2026-06-22
### תיקון
- fetchTickets עם try/finally — loading תמיד מסתיים
- /api/users/list עם error logging לדיבאג

---

## Build 10 – 2026-06-22
### תיקון
- החלפת env variables בVercel ללא BOM (ASCII encoding)
- Redeploy לאחר תיקון שגיאת ISO-8859-1 בfetch headers

---

## Build 9 – 2026-06-22
### תיקון
- Supabase client lazy initialization (Proxy) — מניעת build crash בVercel
- תיקון שם משתנה loading בדשבורד

---

## Build 8 – 2026-06-22
### הוסף
- גרסה וזכויות יוצרים בתחתית דף ההתחברות

---

## Build 7 – 2026-06-22
### תיקון
- Footer: גרסה מוצגת מתחת לזכויות יוצרים (מרכוז במקום flex RTL)

---

## Build 6 – 2026-06-22
### תיקון
- תיקון build error בVercel: supabase admin client lazy initialization
- הוספת `force-dynamic` לכל API routes

---

## Build 5 – 2026-06-22
### הוסף
- אותנטיקציה אמיתית עם Supabase Auth (email + סיסמה)
- טבלת `profiles` בSupabase לניהול משתמשים
- API routes server-side ליצירה/מחיקת משתמשים
- דף ניהול משתמשים לסופר אדמין (כפתור "משתמשים" ב-header)
- קבלן רואה רק תקלות של עצמו
- RTL מלא

---

## Build 4 – 2026-06-22
### שונה
- הסרת עמודת "תיאור תקלה" מהטבלה הראשית
- הסרת שדה "הערות קבלן" לגמרי
- תיאור התקלה ניתן לעריכה רק ע"י בקרת איכות/אדמין — קבלן קורא בלבד
- קבלן מתקשר אך ורק דרך הצ'אט

---

## Build 3 – 2026-06-22
### הוסף
- מערכת ניהול גרסאות (version.ts + CHANGELOG)
- זכויות יוצרים Igor Ositchansky – Advance Engineering
- תמיכה בייבוא תקלות מ-Excel

---

## Build 2 – 2026-06-22
### הוסף
- חיבור מלא ל-Supabase (PostgreSQL)
- Realtime subscription לעדכונים חיים
- Deploy ל-Vercel Production
- Environment variables מאובטחים

---

## Build 1 – 2026-06-22
### הוסף
- אפליקציה מלאה לניהול תקלות על תיקי קבלנים
- מספר תיק בפורמט TP-xx-xxx-P-xxx-xxx
- תמיכה בקבלנים TMT ו-EBS
- סטטוסים: פתוח, בטיפול, ממתין לאישור, סגור
- 4 רמות הרשאה: סופר אדמין, בקרת איכות, מנהל פרוייקט קבלן, עובד קבלן
- עדכון המוני (Bulk Actions)
- היסטוריית תכתובת בין בקרת איכות לקבלן
- מדידת זמן פתיחת תקלות
- סינון, חיפוש וטאבים לפי סטטוס
- צביעת שורות לפי קירבה לתאריך טסט (צהוב/אדום)
- עדיפות וניהול שיוך לפי הרשאות
- GitHub + Vercel + Supabase
