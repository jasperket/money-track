import { formatCurrency } from "./utils/helpers.js";

// Function to calculate total balance
const calculateBalance = () => {
  const categories = JSON.parse(localStorage.getItem("categories")) || [];
  let balance = 0;

  categories.forEach((category) => {
    if (!category.transactions) return;

    category.transactions.forEach((transaction) => {
      const amount = parseFloat(transaction.amount);
      if (category.type === "income") {
        balance += amount;
      } else if (category.type === "expense") {
        balance -= amount;
      }
    });
  });

  return balance;
};

// Function to update balance display
const updateBalance = () => {
  const balanceElement = document.getElementById("currentBalance");
  const balance = calculateBalance();

  // Update color based on balance
  if (balance < 0) {
    balanceElement.classList.remove("text-green-400");
    balanceElement.classList.add("text-red-400");
  } else {
    balanceElement.classList.remove("text-red-400");
    balanceElement.classList.add("text-green-400");
  }

  balanceElement.textContent = formatCurrency(balance);
};

// Initialize when the page loads
document.addEventListener("DOMContentLoaded", updateBalance);
