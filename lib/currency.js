// Helper function to format currency in Indian Rupees
export function formatINR(amount) {
  const num = Number(amount);
  if (isNaN(num)) return "₹0";
  return num.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

// Helper function to format currency with decimals
export function formatINRWithDecimals(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
