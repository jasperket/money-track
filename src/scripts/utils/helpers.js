// Format to peso
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

// New animation function for counting up numbers
export function animateValue(element, start, end, duration = 1000) {
  // Handle special cases where end is not a valid number
  if (isNaN(end)) {
    element.textContent = formatCurrency(0);
    return;
  }

  // Clear any existing animation
  if (element.currentAnimation) {
    cancelAnimationFrame(element.currentAnimation);
  }

  const startTime = performance.now();

  // Animation function
  function animate(currentTime) {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);

    // Easing function for smooth animation
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);

    // Calculate current value
    const currentValue = start + (end - start) * easeOutQuart;

    // Update element with formatted currency
    element.textContent = formatCurrency(currentValue);

    // Continue animation if not complete
    if (progress < 1) {
      element.currentAnimation = requestAnimationFrame(animate);
    }
  }

  // Start animation
  element.currentAnimation = requestAnimationFrame(animate);
}
