export const UNIT_LABELS = {
  plate: 'طبق',
  kg: 'كغ',
  box: 'علبة',
  piece: 'حبة',
  liter: 'لتر',
  dozen: 'دزينة',
};

export const getUnitLabel = (unit) => UNIT_LABELS[unit] || 'وحدة';

export const PREP_TIME_LABELS = {
  30: '30 دقيقة', 60: 'ساعة', 90: 'ساعة ونصف', 120: 'ساعتان',
  180: '3 ساعات', 240: '4 ساعات', 360: '6 ساعات', 480: '8 ساعات',
  720: '12 ساعة', 1440: '24 ساعة', 2880: 'يومان',
};

export const formatPrepTime = (mins) =>
  PREP_TIME_LABELS[mins] || (mins < 60 ? `${mins} دقيقة` : `${Math.floor(mins / 60)} ساعات`);
