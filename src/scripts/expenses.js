import { Category } from "./classes/Category.js";

// Get DOM elements
const openDialogBtn = document.getElementById("add-category-btn");
const addCategoryDialog = document.getElementById("add-category-dialog");
const categoryForm = addCategoryDialog.querySelector("form");
const submitCategoryBtn = document.getElementById("submit-category");

// Open dialog on button click
openDialogBtn.addEventListener("click", () => {
  clearAllErrors();
  categoryForm.reset();
  addCategoryDialog.showModal();
});

// Close dialog
const closeDialogBtn = document.getElementById("add-category-close");
closeDialogBtn.addEventListener("click", () => {
  addCategoryDialog.close();
  clearAllErrors();
});

// Initialize categories array from localStorage or empty array if none exists
let categories = JSON.parse(localStorage.getItem("categories")) || [];

// Function to show error message
function showError(inputElement, message) {
  // Remove any existing error message
  const existingError =
    inputElement.parentElement.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }

  // Create and add new error message
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message text-red-500 text-sm mt-1";
  errorDiv.textContent = message;
  inputElement.parentElement.appendChild(errorDiv);

  // Add error styling to input
  inputElement.classList.add("border", "border-red-500");
}

// Function to clear all errors
function clearAllErrors() {
  const errorMessages = categoryForm.querySelectorAll(".error-message");
  errorMessages.forEach((error) => error.remove());

  const inputs = categoryForm.querySelectorAll("input, select");
  inputs.forEach((input) => {
    input.classList.remove("border", "border-red-500");
  });
}

// Event listener for form submission
categoryForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Clear any existing errors
  clearAllErrors();

  // Get form values
  const nameInput = document.getElementById("name");
  const typeSelect = document.getElementById("type");

  const name = nameInput.value.trim();
  const type = typeSelect.value;

  let isValid = true;

  // Validate input
  if (!name) {
    showError(nameInput, "Please enter a category name");
    isValid = false;
  }

  // Check for duplicate category names
  if (
    categories.some(
      (category) => category.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    showError(nameInput, "A category with this name already exists");
    isValid = false;
  }

  if (!isValid) {
    return;
  }

  // Create new category
  const newCategory = new Category(name, type);
  newCategory.transactions = []; // Initialize empty transactions array

  // Add to categories array
  categories.push(newCategory);

  // Save to localStorage
  saveCategories();

  // Reset form and close dialog
  categoryForm.reset();
  clearAllErrors();
  addCategoryDialog.close();
});

// Function to save categories to localStorage
function saveCategories() {
  localStorage.setItem("categories", JSON.stringify(categories));
}
