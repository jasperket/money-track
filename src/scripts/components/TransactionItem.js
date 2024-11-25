class TransactionItem extends HTMLElement {
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
    this.setupEventListeners();
  }

  createFromTemplate() {
    const template = document.getElementById("transaction-template");
    const clone = template.content.cloneNode(true);
    const transactionDiv = clone.querySelector("div");

    if (this._transaction) {
      // Set transaction data
      transactionDiv.dataset.transactionId = this._transaction.id;
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
    }

    return clone;
  }

  handleDelete() {
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
            transactionId: this._transaction.id,
          },
        }),
      );

      // Add fade out animation
      this.style.animation = "fadeOut 0.3s ease-out forwards";
      this.addEventListener("animationend", () => {
        this.remove();
      });

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
    const deleteButton = this.querySelector(".delete-transaction");
    if (deleteButton) {
      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation();
        this.handleDelete();
      });
    }
  }

  render() {
    this.innerHTML = "";
    const content = this.createFromTemplate();
    this.appendChild(content);
  }
}

customElements.define("transaction-item", TransactionItem);

export default TransactionItem;
