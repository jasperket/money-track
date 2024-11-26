class ReadOnlyTransactionItem extends HTMLElement {
  constructor() {
    super();
    this._transaction = null;
  }

  static get observedAttributes() {
    return ["name", "amount", "date"];
  }

  get transaction() {
    return this._transaction;
  }

  set transaction(value) {
    this._transaction = value;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  createFromTemplate() {
    const template = document.getElementById("readonly-transaction-template");
    const clone = template.content.cloneNode(true);

    if (this._transaction) {
      // Set transaction data
      const container = clone.querySelector("div");
      container.dataset.transactionId = this._transaction.id;

      clone.querySelector(".transaction-name").textContent =
        this._transaction.name;
      clone.querySelector(".transaction-amount").textContent =
        new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
        }).format(this._transaction.amount);
      clone.querySelector(".transaction-date").textContent = new Date(
        this._transaction.date,
      ).toLocaleDateString();

      // Add color coding based on transaction type
      const amountElement = clone.querySelector(".transaction-amount");
      if (this._transaction.type === "expense") {
        amountElement.classList.add("text-red-400");
      } else {
        amountElement.classList.add("text-green-400");
      }
    }

    return clone;
  }

  render() {
    this.innerHTML = "";
    const content = this.createFromTemplate();
    this.appendChild(content);
  }
}

customElements.define("readonly-transaction-item", ReadOnlyTransactionItem);

// Function to render recent transactions in the dashboard
function renderRecentTransactions(limit = 5) {
  const categories = JSON.parse(localStorage.getItem("categories")) || [];
  const transactionsContainer = document.querySelector("#recent-transactions");

  if (!transactionsContainer) return;

  // Clear existing transactions
  transactionsContainer.innerHTML = "";

  // Get all transactions from all categories
  const allTransactions = categories.reduce((acc, category) => {
    if (category.transactions) {
      // Add category type to each transaction
      const transactionsWithType = category.transactions.map((t) => ({
        ...t,
        type: category.type,
      }));
      return [...acc, ...transactionsWithType];
    }
    return acc;
  }, []);

  // Sort by date (most recent first)
  allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Take only the most recent transactions
  const recentTransactions = allTransactions.slice(0, limit);

  // Render each transaction
  recentTransactions.forEach((transaction, index) => {
    const transactionElement = document.createElement(
      "readonly-transaction-item",
    );
    transactionElement.transaction = transaction;
    // Add staggered animation delay based on index
    transactionElement.style.animationDelay = `${index * 100}ms`;
    transactionsContainer.appendChild(transactionElement);
  });
}

export { ReadOnlyTransactionItem, renderRecentTransactions };
