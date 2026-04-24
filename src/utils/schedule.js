// Maps JS getDay() index to schedule key
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const DAYS = [
  { key: 'saturday',  label: 'السبت' },
  { key: 'sunday',    label: 'الأحد' },
  { key: 'monday',    label: 'الاثنين' },
  { key: 'tuesday',   label: 'الثلاثاء' },
  { key: 'wednesday', label: 'الأربعاء' },
  { key: 'thursday',  label: 'الخميس' },
  { key: 'friday',    label: 'الجمعة' },
];

export const DEFAULT_SCHEDULE = {
  saturday:  { enabled: true,  from: '09:00', to: '21:00' },
  sunday:    { enabled: true,  from: '09:00', to: '21:00' },
  monday:    { enabled: true,  from: '09:00', to: '21:00' },
  tuesday:   { enabled: true,  from: '09:00', to: '21:00' },
  wednesday: { enabled: true,  from: '09:00', to: '21:00' },
  thursday:  { enabled: true,  from: '09:00', to: '21:00' },
  friday:    { enabled: false, from: '09:00', to: '21:00' },
};

// Returns true (open), false (closed by schedule), null (no schedule set)
export const isInSchedule = (schedule) => {
  if (!schedule) return null;
  const todayKey = DAY_KEYS[new Date().getDay()];
  const day = schedule[todayKey];
  if (!day?.enabled) return false;
  const now = new Date();
  const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return current >= day.from && current <= day.to;
};

export const todayLabel = () => {
  return DAYS.find((d) => d.key === DAY_KEYS[new Date().getDay()])?.label || '';
};
