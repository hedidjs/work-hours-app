#!/bin/bash

# Work Hours App Script
# סקריפט להפעלת אפליקציית ניהול שעות עבודה

echo "⏰ מנהל אפליקציית שעות עבודה..."

# נתיב לפרויקט
APP_PATH="/Users/rontzarfati/Desktop/work/work-hours-app"

echo "⏰ בודק תהליכים פעילים..."

# בודק אם יש תהליכי Vite פעילים על פורט 5173
VITE_PROCESSES=$(lsof -ti:5173 2>/dev/null | wc -l)
SERVER_PROCESSES=$(lsof -ti:3001 2>/dev/null | wc -l)

if [ $VITE_PROCESSES -gt 0 ]; then
    echo "🛑 סוגר אפליקציה על פורט 5173..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    sleep 1
fi

if [ $SERVER_PROCESSES -gt 0 ]; then
    echo "🛑 סוגר שרת על פורט 3001..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    sleep 1
fi

echo "✅ מוכן להפעלה"
echo ""
echo "🚀 מפעיל שרת נתונים ואפליקציה..."
echo "   🗄️  שרת: http://localhost:3001"
echo "   🌐 אפליקציה: http://localhost:5173"
echo ""
echo "💡 לחץ Ctrl+C לסגירה"
echo ""

# לולאה להרצה חוזרת
while true; do
    cd "$APP_PATH"

    # מפעיל את השרת ברקע
    echo "🗄️  מפעיל שרת נתונים..."
    node server/index.cjs &
    SERVER_PID=$!

    # ממתין שהשרת יעלה
    sleep 2

    # פותח את הדפדפן אחרי 3 שניות (ברקע)
    (sleep 3 && open "http://localhost:5173") &

    # מפעיל את Vite
    echo "🌐 מפעיל אפליקציה..."
    npm run dev

    # שומר את קוד היציאה
    EXIT_CODE=$?

    # סוגר את השרת
    echo "🛑 סוגר שרת..."
    kill $SERVER_PID 2>/dev/null

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [ $EXIT_CODE -eq 0 ]; then
        echo "✅ האפליקציה נסגרה בהצלחה"
    else
        echo "❌ האפליקציה נסגרה עם שגיאה (קוד: $EXIT_CODE)"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # שואל האם להריץ שוב
    read -p "🔄 להריץ שוב? (y/n): " answer

    if [[ ! $answer =~ ^[Yy]$ ]]; then
        echo ""
        echo "👋 ביי!"
        break
    fi

    echo ""
    echo "🔄 מפעיל מחדש..."
    echo ""
done
