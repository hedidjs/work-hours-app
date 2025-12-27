const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// נתיב לקובץ הנתונים
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// פונקציה לקריאת נתונים
function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading data:', error);
  }
  return {
    employers: [],
    workDays: [],
    businessDetails: {
      logo: '',
      name: '',
      businessNumber: '',
      address: '',
      phone: '',
      email: '',
      bankName: '',
      bankBranch: '',
      bankAccount: '',
    }
  };
}

// פונקציה לשמירת נתונים
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing data:', error);
    return false;
  }
}

// קבלת כל הנתונים
app.get('/api/data', (req, res) => {
  const data = readData();
  res.json(data);
});

// שמירת כל הנתונים
app.post('/api/data', (req, res) => {
  const success = writeData(req.body);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false, error: 'Failed to save data' });
  }
});

// מעסיקים
app.get('/api/employers', (req, res) => {
  const data = readData();
  res.json(data.employers);
});

app.post('/api/employers', (req, res) => {
  const data = readData();
  const employer = req.body;
  const index = data.employers.findIndex(e => e.id === employer.id);
  if (index >= 0) {
    data.employers[index] = employer;
  } else {
    data.employers.push(employer);
  }
  writeData(data);
  res.json(employer);
});

app.delete('/api/employers/:id', (req, res) => {
  const data = readData();
  data.employers = data.employers.filter(e => e.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

// ימי עבודה
app.get('/api/workdays', (req, res) => {
  const data = readData();
  res.json(data.workDays);
});

app.post('/api/workdays', (req, res) => {
  const data = readData();
  const workDay = req.body;
  const index = data.workDays.findIndex(w => w.id === workDay.id);
  if (index >= 0) {
    data.workDays[index] = workDay;
  } else {
    data.workDays.push(workDay);
  }
  writeData(data);
  res.json(workDay);
});

app.delete('/api/workdays/:id', (req, res) => {
  const data = readData();
  data.workDays = data.workDays.filter(w => w.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

// פרטי עסק
app.get('/api/business', (req, res) => {
  const data = readData();
  res.json(data.businessDetails);
});

app.post('/api/business', (req, res) => {
  const data = readData();
  data.businessDetails = req.body;
  writeData(data);
  res.json(data.businessDetails);
});

app.listen(PORT, () => {
  console.log(`🚀 שרת נתונים רץ על http://localhost:${PORT}`);
});
