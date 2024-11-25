export class Category {
  constructor(name, type) {
    this.name = name;
    this.type = type;
  }
  addTransaction(transaction) {
    this.transactions.push(transaction);
  }
}
