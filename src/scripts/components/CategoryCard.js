import { formatCurrency } from "../utils/helpers.js";

class CategoryCard extends HTMLElement {
  constructor() {
    super();
    this._category = null;
  }

  static get observedAttributes() {
    return ["name", "type"];
  }

  get category() {
    return this._category;
  }

  set category(value) {
    this._category = value;
    this.render();
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  createFromTemplate() {
    const template = document.getElementById("category-card-template");
    const clone = template.content.cloneNode(true);

    // Set category name and type
    clone.querySelector("h2").textContent = this._category?.name || "";
    clone.querySelector("p").textContent =
      this._category?.type.charAt(0).toUpperCase() +
        this._category?.type.slice(1) || "";

    // Render existing transactions
    const transactionsContainer = clone.querySelector(".mt-4");
    transactionsContainer.innerHTML = ""; // Clear template transaction

    if (this._category?.transactions?.length) {
      this._category.transactions.forEach((transaction, index) => {
        const transactionElement = this.createTransactionElement(transaction);
        // Add staggered animation delay based on index
        transactionElement.style.animationDelay = `${index * 100}ms`;
        transactionsContainer.appendChild(transactionElement);
      });
    }

    return clone;
  }

  createTransactionElement(transaction) {
    const div = document.createElement("div");
    div.className =
      "bg-zinc-900 grid grid-cols-3 rounded p-2 text-center opacity-0 animate-transaction";

    div.innerHTML = `
      <p>${transaction.name}</p>
      <p class="border-green-400 border-x">${formatCurrency(transaction.amount)}</p>
      <p>${new Date(transaction.date).toLocaleDateString()}</p>
    `;

    return div;
  }

  setupEventListeners() {
    // Form submission
    const form = this.querySelector("form");
    form.addEventListener("submit", this.handleAddTransaction.bind(this));

    // Delete category
    const deleteBtn = this.querySelector(".delete");
    deleteBtn.addEventListener("click", this.handleDeleteCategory.bind(this));

    // Make form inputs unique by adding category name to id
    const inputs = form.querySelectorAll("input");
    inputs.forEach((input) => {
      const baseName = input.id;
      input.id = `${baseName}-${this._category.name}`;
    });
  }

  handleAddTransaction(e) {
    e.preventDefault();
    const form = e.target;

    const newTransaction = {
      name: form.querySelector('[name="transactionName"]').value,
      amount: parseFloat(
        form.querySelector('[name="transactionAmount"]').value,
      ),
      date: form.querySelector('[name="transactionDate"]').value,
      id: Date.now().toString(),
    };

    // Validate input
    if (
      !newTransaction.name ||
      isNaN(newTransaction.amount) ||
      !newTransaction.date
    ) {
      alert("Please fill in all fields correctly");
      return;
    }

    // Initialize transactions array if it doesn't exist
    if (!this._category.transactions) {
      this._category.transactions = [];
    }

    // Dispatch the event
    this.dispatchEvent(
      new CustomEvent("transactionadded", {
        bubbles: true,
        detail: {
          categoryName: this._category.name,
          transaction: newTransaction,
        },
      }),
    );

    // Add new transaction to DOM with animation
    const transactionsContainer = this.querySelector(".mt-4");
    const transactionElement = this.createTransactionElement(newTransaction);

    // Add animation class and handle animation end
    transactionElement.classList.add("slide-in");
    transactionElement.addEventListener("animationend", () => {
      transactionElement.classList.remove("slide-in");
    });

    transactionsContainer.insertBefore(
      transactionElement,
      transactionsContainer.firstChild,
    );

    form.reset();
  }

  handleDeleteCategory() {
    if (confirm("Are you sure you want to delete this category?")) {
      this.dispatchEvent(
        new CustomEvent("categorydelete", {
          bubbles: true,
          detail: {
            categoryName: this._category.name,
          },
        }),
      );
    }
  }

  render() {
    this.innerHTML = "";
    const content = this.createFromTemplate();
    this.appendChild(content);
  }
}

customElements.define("category-card", CategoryCard);

export default CategoryCard;
