// src/scripts/expenses.js

import { Category } from "./classes/Category.js";
import "./components/CategoryCard.js"; // Make sure the path is correct

// Get DOM elements
const openDialogBtn = document.getElementById("add-category-btn");
const addCategoryDialog = document.getElementById("add-category-dialog");
const categoryForm = addCategoryDialog.querySelector("form");
const submitCategoryBtn = document.getElementById("submit-category");
const categoriesContainer = document.getElementById("categories-container");

// Initialize categories array from localStorage or empty array if none exists
let categories = JSON.parse(localStorage.getItem("categories")) || [];

// Function to save categories to localStorage
function saveCategories() {
  localStorage.setItem("categories", JSON.stringify(categories));
}

// Function to render all categories
function renderCategories() {
  categoriesContainer.innerHTML = ""; // Clear existing cards

  // Sort categories to maintain consistent order
  const sortedCategories = [...categories].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  sortedCategories.forEach((category) => {
    // Ensure transactions are sorted by date
    if (category.transactions) {
      category.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    const categoryCard = document.createElement("category-card");
    categoryCard.category = category;
    categoriesContainer.appendChild(categoryCard);
  });
}

// Event handlers for custom events
document.addEventListener("transactionadded", (e) => {
  const { categoryName, transaction } = e.detail;
  const category = categories.find((c) => c.name === categoryName);

  if (category) {
    if (!category.transactions) {
      category.transactions = [];
    }

    // Check if transaction with this ID already exists
    const existingTransaction = category.transactions.find(
      (t) => t.id === transaction.id,
    );

    if (!existingTransaction) {
      category.transactions.push(transaction);
      saveCategories();
    }
  }
});

document.addEventListener("categorydelete", (e) => {
  const { categoryName } = e.detail;
  const categoryIndex = categories.findIndex((c) => c.name === categoryName);
  if (categoryIndex > -1) {
    categories.splice(categoryIndex, 1);
    saveCategories();
    renderCategories();
  }
});

// Form handling functions
function showError(inputElement, message) {
  const existingError =
    inputElement.parentElement.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }

  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message text-red-500 text-sm mt-1";
  errorDiv.textContent = message;
  inputElement.parentElement.appendChild(errorDiv);

  inputElement.classList.add("border", "border-red-500");
}

function clearAllErrors() {
  const errorMessages = categoryForm.querySelectorAll(".error-message");
  errorMessages.forEach((error) => error.remove());

  const inputs = categoryForm.querySelectorAll("input, select");
  inputs.forEach((input) => {
    input.classList.remove("border", "border-red-500");
  });
}

// Event Listeners
openDialogBtn.addEventListener("click", () => {
  clearAllErrors();
  categoryForm.reset();
  addCategoryDialog.showModal();
});

const closeDialogBtn = document.getElementById("add-category-close");
closeDialogBtn.addEventListener("click", () => {
  addCategoryDialog.close();
  clearAllErrors();
});

// Form submission handler
categoryForm.addEventListener("submit", (e) => {
  e.preventDefault();

  clearAllErrors();

  const nameInput = document.getElementById("name");
  const typeSelect = document.getElementById("type");

  const name = nameInput.value.trim();
  const type = typeSelect.value;

  let isValid = true;

  if (!name) {
    showError(nameInput, "Please enter a category name");
    isValid = false;
  }

  if (
    categories.some(
      (category) => category.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    showError(nameInput, "A category with this name already exists");
    isValid = false;
  }

  if (!isValid) return;

  // Create new category
  const newCategory = new Category(name, type);
  newCategory.transactions = [];

  // Add to categories array
  categories.push(newCategory);

  // Save to localStorage
  saveCategories();

  // Create and add new category card
  renderCategories();

  // Reset form and close dialog
  categoryForm.reset();
  clearAllErrors();
  addCategoryDialog.close();
});

// Initialize when the page loads
document.addEventListener("DOMContentLoaded", renderCategories);
