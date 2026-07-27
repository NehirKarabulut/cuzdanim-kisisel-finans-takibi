const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

app.use(cors({ origin: '*' }));
app.use(express.json());

let transactions = [
  { id: 1, type: 'income', title: 'Maaş', amount: 25000, category: 'Gelir', date: '2026-07-01' },
  { id: 2, type: 'expense', title: 'Market', amount: 1200, category: 'Mutfak', date: '2026-07-02' }
];

// Tüm işlemleri getir (GET)
app.get('/api/transactions', (req, res) => {
  res.json(transactions);
});

// Yeni işlem ekle (POST)
app.post('/api/transactions', (req, res) => {
  const { type, title, amount, category } = req.body;
  
  if (!title || !amount) {
    return res.status(400).json({ message: 'Lütfen alanları doldurun.' });
  }

  const newTransaction = {
    id: Date.now(),
    type: type || 'expense',
    title,
    amount: Number(amount),
    category: category || 'Genel',
    date: new Date().toISOString().split('T')[0]
  };

  transactions.push(newTransaction);
  res.status(201).json(newTransaction);
});

// 🛠️ 28. GÜN: İşlem Düzenle (PUT)
app.put('/api/transactions/:id', (req, res) => {
  const id = Number(req.params.id);
  const { title, amount, type, category } = req.body;

  const index = transactions.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'İşlem bulunamadı.' });
  }

  transactions[index] = {
    ...transactions[index],
    title: title || transactions[index].title,
    amount: amount ? Number(amount) : transactions[index].amount,
    type: type || transactions[index].type,
    category: category || transactions[index].category,
  };

  res.json(transactions[index]);
});

// 🗑️ 28. GÜN: İşlem Sil (DELETE)
app.delete('/api/transactions/:id', (req, res) => {
  const id = Number(req.params.id);
  transactions = transactions.filter((t) => t.id !== id);
  res.json({ message: 'İşlem başarıyla silindi.', id });
});

app.listen(PORT, () => {
  console.log(`Backend sunucusu http://localhost:${PORT} üzerinde çalışıyor.`);
});