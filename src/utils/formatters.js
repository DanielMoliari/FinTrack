// Currency formatter
const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

export const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return BRL.format(num);
};

export const formatCurrencyCompact = (value) => {
  const num = parseFloat(value) || 0;
  if (Math.abs(num) >= 1000) {
    return BRL.format(num);
  }
  return BRL.format(num);
};

// Parse "dd/MM/yyyy - HH:mm:ss" to Date
export const parseDate = (input) => {
  if (!input) return new Date();

  // If it's already a Date
  if (input instanceof Date) return input;

  // If it's a numeric timestamp (ms)
  if (typeof input === "number" && Number.isFinite(input))
    return new Date(input);

  // Firebase-like timestamp object { seconds, nanoseconds }
  if (typeof input === "object" && input !== null && "seconds" in input) {
    return new Date(Number(input.seconds) * 1000);
  }

  // If it's a string, try a few common formats
  if (typeof input === "string") {
    // Try ISO first
    const iso = new Date(input);
    if (!isNaN(iso)) return iso;

    // Expected format: "dd/MM/yyyy - HH:mm:ss" or "dd/MM/yyyy"
    const parts = input.split(" - ");
    const datePart = parts[0];
    if (datePart && datePart.includes("/")) {
      const [day, month, year] = datePart.split("/");
      if (day && month && year) {
        return new Date(
          parseInt(year, 10),
          parseInt(month, 10) - 1,
          parseInt(day, 10),
        );
      }
    }

    // Fallback: let Date attempt to parse it
    const fallback = new Date(input);
    if (!isNaN(fallback)) return fallback;
  }

  // Last resort
  return new Date(input);
};

// Format Date to "dd/MM/yyyy"
export const formatDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Format Date to display "dd de MMM"
const MONTHS_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];
const MONTHS_FULL = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const formatDateDisplay = (date) => {
  const d = date instanceof Date ? date : parseDate(date);
  return `${d.getDate()} de ${MONTHS_SHORT[d.getMonth()]}`;
};

export const formatMonthYear = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
};

export const getMonthName = (monthIndex) => MONTHS_SHORT[monthIndex];
export const getMonthFullName = (monthIndex) => MONTHS_FULL[monthIndex];

// Generate unique id
export const generateId = (prefix = "id") => {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${ts}_${rand}`;
};

// Format percent change
export const formatPercent = (value) => {
  const num = parseFloat(value) || 0;
  const sign = num >= 0 ? "+" : "";
  return `${sign}${num.toFixed(1)}%`;
};

// Greeting
export const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

// Group transactions by date string
export const groupByDate = (transactions) => {
  const groups = {};
  transactions.forEach((tx) => {
    const d = parseDate(tx.data_hora);
    const key = formatDate(d);
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  });
  // Sort descending
  return Object.entries(groups).sort((a, b) => {
    const [da, ma, ya] = a[0].split("/").map(Number);
    const [db, mb, yb] = b[0].split("/").map(Number);
    return new Date(yb, mb - 1, db) - new Date(ya, ma - 1, da);
  });
};
