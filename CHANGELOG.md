# CHANGELOG – TP Reject Management System

כל הזכויות שמורות © Igor Ositchansky – Advance Engineering

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
