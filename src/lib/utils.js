export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateShort(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function validatePayload(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Data harus berupa objek JSON yang valid.'] };
  }

  if (data.mode !== 'rekap') {
    errors.push('Field "mode" harus bernilai "rekap".');
  }

  if (typeof data.total_pemasukan !== 'number') {
    errors.push('Field "total_pemasukan" harus berupa angka.');
  }

  if (typeof data.total_pengeluaran !== 'number') {
    errors.push('Field "total_pengeluaran" harus berupa angka.');
  }

  if (typeof data.saldo_akhir !== 'number') {
    errors.push('Field "saldo_akhir" harus berupa angka.');
  }

  if (!Array.isArray(data.history)) {
    errors.push('Field "history" harus berupa array.');
  } else {
    data.history.forEach((item, index) => {
      if (!item.tgl) errors.push(`history[${index}]: field "tgl" wajib diisi.`);
      if (!item.tipe || !['Pemasukan', 'Pengeluaran'].includes(item.tipe)) {
        errors.push(`history[${index}]: field "tipe" harus "Pemasukan" atau "Pengeluaran".`);
      }
      if (typeof item.nominal !== 'number' || item.nominal < 0) {
        errors.push(`history[${index}]: field "nominal" harus berupa angka positif.`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

export function getDailyAggregates(history) {
  const daily = {};

  history.forEach(item => {
    const day = item.tgl.split(' ')[0];
    if (!daily[day]) {
      daily[day] = { date: day, pemasukan: 0, pengeluaran: 0 };
    }
    if (item.tipe === 'Pemasukan') {
      daily[day].pemasukan += item.nominal;
    } else {
      daily[day].pengeluaran += item.nominal;
    }
  });

  return Object.values(daily).sort((a, b) => new Date(a.date) - new Date(b.date));
}
