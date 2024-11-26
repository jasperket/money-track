class IncomeExpenseDistributionChart extends HTMLElement {
  constructor() {
    super();
    this.chart = null;
    this.loadChartJS();
  }

  async loadChartJS() {
    if (!window.Chart) {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
      script.async = true;
      script.onload = () => {
        this.render();
        window.addEventListener("resize", this.handleResize.bind(this));
      };
      document.head.appendChild(script);
    } else {
      this.render();
      window.addEventListener("resize", this.handleResize.bind(this));
    }
  }

  handleResize() {
    if (this.chart) {
      this.chart.resize();
    }
  }

  connectedCallback() {
    this.setupEventListeners();
    this.setupStyles();
  }

  disconnectedCallback() {
    if (this.chart) {
      this.chart.destroy();
    }
    window.removeEventListener("storage", this.updateChart);
    window.removeEventListener("resize", this.handleResize);
  }

  setupStyles() {
    this.style.display = "block";
    this.style.width = "100%";
    this.style.height = "100%";
    this.style.minHeight = "400px";
    this.style.position = "relative";
  }

  setupEventListeners() {
    this.updateChart = this.updateChart.bind(this);
    window.addEventListener("storage", this.updateChart);
  }

  processData() {
    const categories = JSON.parse(localStorage.getItem("categories")) || [];
    const data = {
      income: new Map(),
      expenses: new Map(),
    };

    // Process transactions by category type
    categories.forEach((category) => {
      if (!category.transactions) return;

      const total = category.transactions.reduce((sum, transaction) => {
        return sum + parseFloat(transaction.amount);
      }, 0);

      if (total > 0) {
        if (category.type === "income") {
          data.income.set(category.name, total);
        } else {
          data.expenses.set(category.name, total);
        }
      }
    });

    // Add placeholders if no data
    if (data.income.size === 0) data.income.set("No income", 1);
    if (data.expenses.size === 0) data.expenses.set("No expenses", 1);

    return data;
  }

  generateColors(type, count) {
    const incomeColors = [
      "#4ade80", // green-400
      "#34d399", // emerald-400
      "#2dd4bf", // teal-400
      "#22c55e", // green-500
      "#10b981", // emerald-500
      "#14b8a6", // teal-500
    ];

    const expenseColors = [
      "#f87171", // red-400
      "#fb923c", // orange-400
      "#fbbf24", // amber-400
      "#ef4444", // red-500
      "#f97316", // orange-500
      "#f59e0b", // amber-500
    ];

    const baseColors = type === "income" ? incomeColors : expenseColors;
    const colors = [...baseColors];

    while (colors.length < count) {
      const hue =
        type === "income"
          ? 120 + ((colors.length * 20) % 60) // green hues
          : 0 + ((colors.length * 20) % 60); // red hues
      colors.push(`hsl(${hue}, 70%, 60%)`);
    }

    return colors;
  }

  createChart(canvas) {
    if (!window.Chart) {
      console.error("Chart.js not loaded");
      return;
    }

    const data = this.processData();

    // Prepare datasets
    const incomeLabels = Array.from(data.income.keys());
    const incomeData = Array.from(data.income.values());
    const expenseLabels = Array.from(data.expenses.keys());
    const expenseData = Array.from(data.expenses.values());

    const incomeColors = this.generateColors("income", incomeLabels.length);
    const expenseColors = this.generateColors("expenses", expenseLabels.length);

    const totalIncome = incomeData.reduce((a, b) => a + b, 0);
    const totalExpenses = expenseData.reduce((a, b) => a + b, 0);

    // Set default text color to white globally
    Chart.defaults.color = "#ffffff";

    const ctx = canvas.getContext("2d");
    return new window.Chart(ctx, {
      type: "doughnut",
      data: {
        labels: [...incomeLabels, ...expenseLabels],
        datasets: [
          {
            data: [...incomeData, ...expenseData],
            backgroundColor: [...incomeColors, ...expenseColors],
            borderColor: "rgb(9, 9, 11)", // zinc-950
            borderWidth: 2,
            hoverOffset: 15,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: {
            display: true, // Explicitly enable legend
            position: "right", // Move legend to right side
            align: "center", // Center align legend items
            labels: {
              boxWidth: 15, // Smaller, more compact boxes
              padding: 15,
              color: "#ffffff", // Ensure white text
              font: {
                size: 14,
                family: "Inter, sans-serif", // Match app font
              },
              usePointStyle: true, // Use circular points
              pointStyle: "circle", // Specifically circular
              filter: function (legendItem, data) {
                return data.datasets[0].data[legendItem.index] > 0; // Only show non-zero values
              },
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            padding: 12,
            callbacks: {
              label: function (context) {
                const value = context.raw;
                const isIncome = context.dataIndex < incomeLabels.length;
                const total = isIncome ? totalIncome : totalExpenses;
                const percentage = ((value / total) * 100).toFixed(1);
                const formattedValue = new Intl.NumberFormat("en-PH", {
                  style: "currency",
                  currency: "PHP",
                }).format(value);
                return `${context.label}: ${formattedValue} (${percentage}%)`;
              },
              afterLabel: function (context) {
                const isIncome = context.dataIndex < incomeLabels.length;
                return `Type: ${isIncome ? "Income" : "Expense"}`;
              },
            },
          },
        },
        layout: {
          padding: {
            top: 20,
            right: 20, // Increased padding for legend
            bottom: 20,
            left: 20,
          },
        },
      },
    });
  }

  updateChart() {
    if (this.chart) {
      this.chart.destroy();
    }
    const canvas = this.querySelector("canvas");
    if (canvas) {
      this.chart = this.createChart(canvas);
    }
  }

  render() {
    const wrapper = document.createElement("div");
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    wrapper.style.position = "relative";

    const canvas = document.createElement("canvas");
    canvas.id = "incomeExpenseChart";
    wrapper.appendChild(canvas);

    this.innerHTML = "";
    this.appendChild(wrapper);

    if (window.Chart) {
      this.chart = this.createChart(canvas);
    }
  }
}

customElements.define("income-expense-chart", IncomeExpenseDistributionChart);

export default IncomeExpenseDistributionChart;
