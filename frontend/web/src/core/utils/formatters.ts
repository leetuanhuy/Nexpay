export const CurrencyFormatter = {
  formatVND: (amount: number = 0): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  },
};

export const DateFormatter = {
  formatDateTime: (isoDateStr?: string): string => {
    if (!isoDateStr) return '';
    try {
      return new Date(isoDateStr).toLocaleString('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'medium',
      });
    } catch {
      return isoDateStr;
    }
  },
};
