import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import './App.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const API_BASE_URL = 'http://localhost:5001';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Mutfak');
  const [editingId, setEditingId] = useState(null);

  // Kategori Bütçe Limitleri
  const [limits, setLimits] = useState({
    Mutfak: 5000,
    Fatura: 3000,
    Eğlence: 2000,
    Diğer: 1500
  });
  const [limitInput, setLimitInput] = useState('');
  const [selectedLimitCategory, setSelectedLimitCategory] = useState('Mutfak');

  // Tasarruf Hedefleri
  const [savingsGoals, setSavingsGoals] = useState([
    { id: 1, title: 'Yeni Laptop', targetAmount: 30000, currentAmount: 12000 },
    { id: 2, title: 'Acil Durum Fonu', targetAmount: 15000, currentAmount: 8500 }
  ]);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');

  // Arama ve Filtreleme
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions`);
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Veriler çekilirken hata oluştu:', error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount) return alert('Lütfen başlık ve tutar girin.');

    const transactionData = {
      title,
      amount: Number(amount),
      type: type === 'Gider' || type === 'expense' ? 'expense' : 'income',
      category
    };

    try {
      if (editingId) {
        const response = await fetch(`${API_BASE_URL}/api/transactions/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionData),
        });
        if (response.ok) {
          handleCancelEdit();
          fetchTransactions();
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/api/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionData),
        });
        if (response.ok) {
          setTitle('');
          setAmount('');
          fetchTransactions();
        }
      }
    } catch (error) {
      console.error('Kaydetme işleminde hata oluştu:', error);
    }
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setTitle(transaction.title);
    setAmount(transaction.amount);
    setType(transaction.type);
    setCategory(transaction.category);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setAmount('');
    setType('expense');
    setCategory('Mutfak');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu işlemi silmek istediğinize emin misiniz?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/${id}`, { method: 'DELETE' });
      if (response.ok) fetchTransactions();
    } catch (error) {
      console.error('Silme işleminde hata oluştu:', error);
    }
  };

  const handleLimitUpdate = (e) => {
    e.preventDefault();
    if (!limitInput) return;
    setLimits({ ...limits, [selectedLimitCategory]: Number(limitInput) });
    setLimitInput('');
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget) return alert('Lütfen hedef başlığı ve tutarı girin.');
    const newGoal = {
      id: Date.now(),
      title: goalTitle,
      targetAmount: Number(goalTarget),
      currentAmount: Number(goalCurrent) || 0
    };
    setSavingsGoals([...savingsGoals, newGoal]);
    setGoalTitle('');
    setGoalTarget('');
    setGoalCurrent('');
  };

  const handleDeleteGoal = (id) => {
    setSavingsGoals(savingsGoals.filter((g) => g.id !== id));
  };

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) return alert('İndirilecek veri bulunamadı.');
    const headers = ['ID,Başlık,Tutar (TL),Tür,Kategori\n'];
    const rows = filteredTransactions.map((t) => `${t.id},"${t.title}",${t.amount},${t.type === 'income' ? 'Gelir' : 'Gider'},"${t.category}"`);
    const blob = new Blob(['\uFEFF' + headers.concat(rows).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cuzdanim_islemler.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (filteredTransactions.length === 0) return alert('İndirilecek veri bulunamadı.');
    const blob = new Blob([JSON.stringify(filteredTransactions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cuzdanim_islemler.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryTotal = (cat) => {
    return transactions
      .filter((t) => t.type === 'expense' && t.category === cat)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
  };

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalBalance = totalIncome - totalExpense;

  const filteredTransactions = transactions
    .filter((t) => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return b.id - a.id;
      if (sortBy === 'oldest') return a.id - b.id;
      if (sortBy === 'amount-high') return b.amount - a.amount;
      if (sortBy === 'amount-low') return a.amount - b.amount;
      return 0;
    });

  const chartCategories = ['Mutfak', 'Fatura', 'Eğlence', 'Diğer'];
  const chartDataValues = chartCategories.map((cat) => getCategoryTotal(cat));

  const pieData = {
    labels: chartCategories,
    datasets: [
      {
        data: chartDataValues,
        backgroundColor: ['#e53e3e', '#3182ce', '#dd6b20', '#319795'],
        borderColor: '#1a202c',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif", padding: '30px 15px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.025em', color: '#38bdf8', margin: '0 0 8px 0' }}>
            💳 Cüzdanım 
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>Kişisel Finans ve Bütçe Yönetimi Portalı</p>
        </header>

        {/* Özet İstatistik Kartları */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px', marginBottom: '25px' }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Toplam Gelir</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#4ade80', marginTop: '6px' }}>+{totalIncome.toLocaleString()} TL</div>
          </div>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Toplam Gider</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#f87171', marginTop: '6px' }}>-{totalExpense.toLocaleString()} TL</div>
          </div>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Net Bakiye</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: totalBalance >= 0 ? '#38bdf8' : '#fb923c', marginTop: '6px' }}>{totalBalance.toLocaleString()} TL</div>
          </div>
        </div>

        {/* Grafik ve Bütçe Limitleri Yanyana Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '25px' }}>
          
          {/* Harcama Grafiği */}
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 15px 0', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📊 Harcama Dağılımı
            </h3>
            {chartDataValues.reduce((a, b) => a + b, 0) > 0 ? (
              <div style={{ maxWidth: '240px', margin: '0 auto' }}>
                <Pie data={pieData} />
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', margin: '40px 0' }}>Grafik gösterimi için gider ekleyin.</p>
            )}
          </div>

          {/* Kategori Bütçe Limitleri */}
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 15px 0', color: '#f1f5f9' }}>🎯 Bütçe Limit Yapılandırması</h3>
            <form onSubmit={handleLimitUpdate} style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
              <select value={selectedLimitCategory} onChange={(e) => setSelectedLimitCategory(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}>
                <option value="Mutfak">Mutfak</option>
                <option value="Fatura">Fatura</option>
                <option value="Eğlence">Eğlence</option>
                <option value="Diğer">Diğer</option>
              </select>
              <input type="number" placeholder="Limit TL" value={limitInput} onChange={(e) => setLimitInput(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px', flex: 1 }} />
              <button type="submit" style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Güncelle</button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.keys(limits).map((cat) => {
                const spent = getCategoryTotal(cat);
                const limit = limits[cat];
                const isExceeded = spent > limit;
                return (
                  <div key={cat} style={{ backgroundColor: '#0f172a', padding: '10px 12px', borderRadius: '6px', border: isExceeded ? '1px solid #ef4444' : '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span>{cat}</span>
                    <span style={{ color: isExceeded ? '#f87171' : '#38bdf8', fontWeight: '600' }}>
                      {spent} / {limit} TL {isExceeded && '⚠️ (Aşıldı)'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tasarruf Hedefleri Kartı */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '25px' }}>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 15px 0', color: '#f1f5f9' }}>🚀 Tasarruf Hedefleri</h3>
          <form onSubmit={handleAddGoal} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '15px' }}>
            <input type="text" placeholder="Hedef Adı" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }} />
            <input type="number" placeholder="Hedef Tutar" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }} />
            <input type="number" placeholder="Mevcut Birikim" value={goalCurrent} onChange={(e) => setGoalCurrent(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }} />
            <button type="submit" style={{ backgroundColor: '#0d9488', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Hedef Ekle</button>
          </form>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {savingsGoals.map((goal) => {
              const percentage = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
              return (
                <div key={goal.id} style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600' }}>{goal.title}</span>
                    <span style={{ color: '#94a3b8' }}>{goal.currentAmount} / {goal.targetAmount} TL (%{percentage})</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: '#334155', borderRadius: '10px', height: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ width: `${percentage}%`, backgroundColor: percentage >= 100 ? '#22c55e' : '#0284c7', height: '100%', transition: 'width 0.4s' }}></div>
                  </div>
                  <button onClick={() => handleDeleteGoal(goal.id)} style={{ backgroundColor: 'transparent', color: '#ef4444', border: 'none', padding: 0, fontSize: '0.75rem', cursor: 'pointer' }}>Sil</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* İşlem Ekleme / Düzenleme Formu */}
        <div style={{ backgroundColor: '#1e293b', border: editingId ? '1px solid #eab308' : '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '25px' }}>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 15px 0', color: editingId ? '#fde047' : '#f1f5f9' }}>
            {editingId ? '✏️ İşlemi Düzenle' : '➕ Yeni Finansal İşlem Ekle'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
            <input type="text" placeholder="İşlem Başlığı" value={title} onChange={(e) => setTitle(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', padding: '10px 12px', borderRadius: '6px' }} />
            <input type="number" placeholder="Tutar (TL)" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', padding: '10px 12px', borderRadius: '6px' }} />
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', padding: '10px 12px', borderRadius: '6px' }}>
              <option value="expense">Gider</option>
              <option value="income">Gelir</option>
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', padding: '10px 12px', borderRadius: '6px' }}>
              <option value="Mutfak">Mutfak</option>
              <option value="Fatura">Fatura</option>
              <option value="Eğlence">Eğlence</option>
              <option value="Gelir">Gelir</option>
              <option value="Diğer">Diğer</option>
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" style={{ backgroundColor: editingId ? '#ca8a04' : '#16a34a', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', flex: 1 }}>
                {editingId ? 'Güncelle' : 'Kaydet'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} style={{ backgroundColor: '#475569', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>İptal</button>
              )}
            </div>
          </form>
        </div>

        {/* Arama, Filtreleme ve Dışa Aktarma Bölümü */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '25px' }}>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 15px 0', color: '#f1f5f9' }}>🔍 Filtreleme ve Rapor Yönetimi</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '15px' }}>
            <input type="text" placeholder="İşlem ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }} />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}>
              <option value="all">Tüm Türler</option>
              <option value="income">Gelir</option>
              <option value="expense">Gider</option>
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}>
              <option value="all">Tüm Kategoriler</option>
              <option value="Mutfak">Mutfak</option>
              <option value="Fatura">Fatura</option>
              <option value="Eğlence">Eğlence</option>
              <option value="Gelir">Gelir</option>
              <option value="Diğer">Diğer</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}>
              <option value="newest">En Yeni</option>
              <option value="oldest">En Eski</option>
              <option value="amount-high">Tutar (Yüksek-Düşük)</option>
              <option value="amount-low">Tutar (Düşük-Yüksek)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #334155', paddingTop: '15px' }}>
            <button onClick={exportToCSV} style={{ backgroundColor: '#15803d', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>📥 CSV İndir</button>
            <button onClick={exportToJSON} style={{ backgroundColor: '#0369a1', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>📄 JSON İndir</button>
          </div>
        </div>

        {/* İşlem Geçmişi Listesi */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 15px 0', color: '#f1f5f9' }}>
            📜 İşlem Geçmişi ({filteredTransactions.length})
          </h3>
          {filteredTransactions.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', margin: '20px 0' }}>Kriterlere uygun kayıt bulunamadı.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredTransactions.map((t) => (
                <div key={t.id} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: '600', color: '#f8fafc', display: 'block' }}>{t.title}</span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{t.category}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontWeight: '700', fontSize: '1.05rem', color: t.type === 'income' ? '#4ade80' : '#f87171' }}>
                      {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} TL
                    </span>
                    <button onClick={() => handleEdit(t)} style={{ backgroundColor: '#ca8a04', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Düzenle</button>
                    <button onClick={() => handleDelete(t.id)} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Sil</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;