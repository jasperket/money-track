import { formatCurrency } from "../utils/helpers.js";
import "./TransactionItem.js";

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
    const transactionElement = document.createElement("transaction-item");
    transactionElement.transaction = transaction;
    return transactionElement;
  }

  handleDeleteTransaction(transactionId) {
    const confirmDialog = document.getElementById("confirm-dialog");
    const confirmMessage = document.getElementById("confirm-message");
    const confirmDelete = document.getElementById("confirm-delete");
    const confirmCancel = document.getElementById("confirm-cancel");
    const confirmClose = document.getElementById("confirm-dialog-close");

    confirmMessage.textContent =
      "Are you sure you want to delete this transaction?";

    const closeDialog = () => {
      confirmDialog.close();
      confirmDelete.removeEventListener("click", handleConfirm);
      confirmCancel.removeEventListener("click", handleCancel);
      confirmClose.removeEventListener("click", handleCancel);
    };

    const handleConfirm = () => {
      this.dispatchEvent(
        new CustomEvent("transactiondelete", {
          bubbles: true,
          detail: {
            categoryName: this._category.name,
            transactionId: transactionId,
          },
        }),
      );

      const transactionElement = this.querySelector(
        `[data-transaction-id="${transactionId}"]`,
      );
      if (transactionElement) {
        transactionElement.style.animation = "fadeOut 0.3s ease-out forwards";
        transactionElement.addEventListener("animationend", () => {
          transactionElement.remove();
        });
      }

      closeDialog();
    };

    const handleCancel = () => {
      closeDialog();
    };

    confirmDelete.addEventListener("click", handleConfirm);
    confirmCancel.addEventListener("click", handleCancel);
    confirmClose.addEventListener("click", handleCancel);

    confirmDialog.showModal();
  }

  handleDeleteCategory() {
    const confirmDialog = document.getElementById("confirm-dialog");
    const confirmMessage = document.getElementById("confirm-message");
    const confirmDelete = document.getElementById("confirm-delete");
    const confirmCancel = document.getElementById("confirm-cancel");
    const confirmClose = document.getElementById("confirm-dialog-close");

    confirmMessage.textContent =
      "Are you sure you want to delete this category and all its transactions?";

    const closeDialog = () => {
      confirmDialog.close();
      confirmDelete.removeEventListener("click", handleConfirm);
      confirmCancel.removeEventListener("click", handleCancel);
      confirmClose.removeEventListener("click", handleCancel);
    };

    const handleConfirm = () => {
      this.dispatchEvent(
        new CustomEvent("categorydelete", {
          bubbles: true,
          detail: {
            categoryName: this._category.name,
          },
        }),
      );
      closeDialog();
    };

    const handleCancel = () => {
      closeDialog();
    };

    confirmDelete.addEventListener("click", handleConfirm);
    confirmCancel.addEventListener("click", handleCancel);
    confirmClose.addEventListener("click", handleCancel);

    confirmDialog.showModal();
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

  render() {
    this.innerHTML = "";
    const content = this.createFromTemplate();
    this.appendChild(content);
  }
}

customElements.define("category-card", CategoryCard);

export default CategoryCard;
