// src/scripts/index.js
import { formatCurrency } from "./utils/helpers.js";

// Constants for time periods
const TIME_PERIODS = {
  TOTAL: "total",
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
};

// Function to check if a date is within the selected time period
function isDateInPeriod(date, selectedPeriod) {
  const today = new Date();
  const transactionDate = new Date(date);

  switch (selectedPeriod) {
    case TIME_PERIODS.TOTAL:
      // Include all transactions regardless of date
      return true;

    case TIME_PERIODS.DAILY:
      return (
        transactionDate.getDate() === today.getDate() &&
        transactionDate.getMonth() === today.getMonth() &&
        transactionDate.getFullYear() === today.getFullYear()
      );

    case TIME_PERIODS.WEEKLY:
      // Get the start of the current week (Sunday)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return transactionDate >= startOfWeek;

    case TIME_PERIODS.MONTHLY:
      return (
        transactionDate.getMonth() === today.getMonth() &&
        transactionDate.getFullYear() === today.getFullYear()
      );

    case TIME_PERIODS.YEARLY:
      return transactionDate.getFullYear() === today.getFullYear();

    default:
      return false;
  }
}

// Calculate totals based on selected period
function calculateTotals(selectedPeriod) {
  const categories = JSON.parse(localStorage.getItem("categories")) || [];
  let income = 0;
  let expenses = 0;

  categories.forEach((category) => {
    if (!category.transactions) return;

    category.transactions.forEach((transaction) => {
      if (isDateInPeriod(transaction.date, selectedPeriod)) {
        const amount = parseFloat(transaction.amount);
        if (category.type === "income") {
          income += amount;
        } else if (category.type === "expense") {
          expenses += amount;
        }
      }
    });
  });

  return {
    income,
    expenses,
    balance: income - expenses,
  };
}

// Function to update all displays
function updateDisplays(selectedPeriod) {
  const totals = calculateTotals(selectedPeriod);

  // Update income display
  const incomeElement = document.querySelector("#income");
  incomeElement.textContent = formatCurrency(totals.income);

  // Update expenses display
  const expensesElement = document.querySelector("#expenses");
  expensesElement.textContent = formatCurrency(totals.expenses);

  // Update balance display
  const balanceElement = document.querySelector("#currentBalance");
  balanceElement.textContent = formatCurrency(totals.balance);

  // Update balance color based on value
  if (totals.balance < 0) {
    balanceElement.classList.remove("text-green-400");
    balanceElement.classList.add("text-red-400");
  } else {
    balanceElement.classList.remove("text-red-400");
    balanceElement.classList.add("text-green-400");
  }

  // Update description text based on selected period
  const periodText = document.querySelector("#period-text");
  if (periodText) {
    let description = "";
    switch (selectedPeriod) {
      case TIME_PERIODS.TOTAL:
        description = "Total";
        break;
      case TIME_PERIODS.DAILY:
        description = "Today";
        break;
      case TIME_PERIODS.WEEKLY:
        description = "This Week";
        break;
      case TIME_PERIODS.MONTHLY:
        description = "This Month";
        break;
      case TIME_PERIODS.YEARLY:
        description = "This Year";
        break;
    }
    periodText.textContent = description;
  }
}

// Initialize and set up event listeners
document.addEventListener("DOMContentLoaded", () => {
  const periodSelect = document.querySelector("#period-select");

  // Set initial period and update displays
  updateDisplays(periodSelect.value);

  // Listen for period changes
  periodSelect.addEventListener("change", (e) => {
    updateDisplays(e.target.value);
  });

  // Listen for storage changes to update displays
  window.addEventListener("storage", () => {
    updateDisplays(periodSelect.value);
  });
});
