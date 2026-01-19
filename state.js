const STATE = {
  dates: Array(5)
    .fill(null)
    .map(() => new Date(2024, 4, 1)),
  selectedDayElements: Array(5).fill(null),
  selectedDays: Array(5).fill(null),
  currentBookingData: null, // Per salvare i dati temporanei del checkout
};
