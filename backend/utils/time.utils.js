function pad2(n) {
  return String(n).padStart(2, '0');
}

function timeToMinutes(timeStr) {
  if (typeof timeStr !== 'string') return NaN;
  const [h, m] = timeStr.split(':').map((v) => Number(v));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

function minutesToTime(totalMinutes) {
  const mins = Math.max(0, Math.min(24 * 60, totalMinutes));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

function addMinutes(timeStr, minutesToAdd) {
  const base = timeToMinutes(timeStr);
  if (!Number.isFinite(base)) return null;
  return minutesToTime(base + minutesToAdd);
}

function parseDateTimeLocal(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  // Local time (not UTC)
  const [y, mo, d] = dateStr.split('-').map((v) => Number(v));
  const [h, mi] = timeStr.split(':').map((v) => Number(v));
  if ([y, mo, d, h, mi].some((v) => !Number.isFinite(v))) return null;
  return new Date(y, mo - 1, d, h, mi, 0, 0);
}

function intervalsOverlap(aStartMin, aEndMin, bStartMin, bEndMin) {
  return aStartMin < bEndMin && bStartMin < aEndMin;
}

function computeSlots(openTime, closeTime, slotMinutes) {
  const open = timeToMinutes(openTime);
  const close = closeTime === '24:00' ? 24 * 60 : timeToMinutes(closeTime);
  const step = Number(slotMinutes) || 60;

  if (!Number.isFinite(open) || !Number.isFinite(close) || open >= close || step <= 0) {
    return [];
  }

  const slots = [];
  for (let t = open; t + step <= close; t += step) {
    slots.push({
      startTime: minutesToTime(t),
      endTime: minutesToTime(t + step)
    });
  }

  return slots;
}

module.exports = {
  timeToMinutes,
  minutesToTime,
  addMinutes,
  parseDateTimeLocal,
  intervalsOverlap,
  computeSlots
};
