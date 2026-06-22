# CHANGELOG – TP Reject Management System

כל הזכויות שמורות © Igor Ositchansky – Advance Engineering

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
