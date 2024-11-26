// Generate dates for the last 30 days
const generateRecentDates = (count) => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.unshift(date.toISOString().split("T")[0]);
  }
  return dates;
};

// Generate placeholder transactions for a category
const generateTransactions = (categoryType, dates) => {
  const transactions = [];
  const isExpense = categoryType === "expense";

  dates.forEach((date) => {
    // Add 1-3 transactions per day with 70% probability
    if (Math.random() < 0.7) {
      const transactionsPerDay = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < transactionsPerDay; i++) {
        const baseAmount = isExpense
          ? Math.floor(Math.random() * 900) + 100 // Expenses: 100-1000
          : Math.floor(Math.random() * 4000) + 1000; // Income: 1000-5000

        transactions.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: "Sample Transaction " + (transactions.length + 1),
          amount: baseAmount,
          date: date,
        });
      }
    }
  });

  return transactions;
};

const placeholderData = {
  categories: [
    {
      name: "Salary",
      type: "income",
      transactions: generateTransactions("income", generateRecentDates(30)),
    },
    {
      name: "Freelance",
      type: "income",
      transactions: generateTransactions("income", generateRecentDates(30)),
    },
    {
      name: "Food",
      type: "expense",
      transactions: generateTransactions("expense", generateRecentDates(30)),
    },
    {
      name: "Transportation",
      type: "expense",
      transactions: generateTransactions("expense", generateRecentDates(30)),
    },
    {
      name: "Entertainment",
      type: "expense",
      transactions: generateTransactions("expense", generateRecentDates(30)),
    },
    {
      name: "Utilities",
      type: "expense",
      transactions: generateTransactions("expense", generateRecentDates(30)),
    },
  ],
};

// Function to initialize local storage with placeholder data
export function initializeWithPlaceholderData() {
  const existingData = localStorage.getItem("categories");

  if (!existingData || JSON.parse(existingData).length === 0) {
    localStorage.setItem(
      "categories",
      JSON.stringify(placeholderData.categories),
    );
  }
}
