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

    // First process income categories
    categories
      .filter((category) => category.type === "income")
      .forEach((category) => {
        if (!category.transactions) return;
        const total = category.transactions.reduce(
          (sum, transaction) => sum + parseFloat(transaction.amount),
          0,
        );
        if (total > 0) {
          data.income.set(category.name, total);
        }
      });

    // Then process expense categories
    categories
      .filter((category) => category.type === "expense")
      .forEach((category) => {
        if (!category.transactions) return;
        const total = category.transactions.reduce(
          (sum, transaction) => sum + parseFloat(transaction.amount),
          0,
        );
        if (total > 0) {
          data.expenses.set(category.name, total);
        }
      });

    // Add placeholders if no data
    if (data.income.size === 0) data.income.set("No income", 1);
    if (data.expenses.size === 0) data.expenses.set("No expenses", 1);

    return data;
  }

  generateColors(type, count) {
    if (type === "income") {
      const greenColors = [
        "#4ade80", // green-400
        "#34d399", // emerald-400
        "#2dd4bf", // teal-400
        "#22c55e", // green-500
        "#10b981", // emerald-500
      ];

      // If we need more colors, generate them in the green spectrum
      while (greenColors.length < count) {
        const hue = 120 + ((greenColors.length * 20) % 60); // Stay in green spectrum
        greenColors.push(`hsl(${hue}, 70%, 60%)`);
      }

      return greenColors.slice(0, count);
    } else {
      const redColors = [
        "#ef4444", // red-500
        "#f87171", // red-400
        "#fb923c", // orange-400
        "#f97316", // orange-500
        "#fbbf24", // amber-400
      ];

      // If we need more colors, generate them in the red spectrum
      while (redColors.length < count) {
        const hue = 0 + ((redColors.length * 20) % 60); // Stay in red spectrum
        redColors.push(`hsl(${hue}, 70%, 60%)`);
      }

      return redColors.slice(0, count);
    }
  }

  createChart(canvas) {
    if (!window.Chart) {
      console.error("Chart.js not loaded");
      return;
    }

    const data = this.processData();

    // Process expenses first, then income
    const expenseLabels = Array.from(data.expenses.keys());
    const expenseData = Array.from(data.expenses.values());
    const expenseColors = this.generateColors("expense", expenseLabels.length);

    const incomeLabels = Array.from(data.income.keys());
    const incomeData = Array.from(data.income.values());
    const incomeColors = this.generateColors("income", incomeLabels.length);

    // Combine data - putting expenses first, then income
    const combinedLabels = [...expenseLabels, ...incomeLabels];
    const combinedData = [...expenseData, ...incomeData];
    const combinedColors = [...expenseColors, ...incomeColors];

    const totalExpenses = expenseData.reduce((a, b) => a + b, 0);
    const totalIncome = incomeData.reduce((a, b) => a + b, 0);

    Chart.defaults.color = "#ffffff";

    const ctx = canvas.getContext("2d");
    return new window.Chart(ctx, {
      type: "doughnut",
      data: {
        labels: combinedLabels,
        datasets: [
          {
            data: combinedData,
            backgroundColor: combinedColors,
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
            display: true,
            position: "right",
            align: "center",
            labels: {
              boxWidth: 15,
              padding: 15,
              color: "#ffffff",
              font: {
                size: 14,
                family: "Inter, sans-serif",
              },
              usePointStyle: true,
              pointStyle: "circle",
              filter: function (legendItem, data) {
                return data.datasets[0].data[legendItem.index] > 0;
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
                const isExpense = context.dataIndex < expenseLabels.length;
                const total = isExpense ? totalExpenses : totalIncome;
                const percentage = ((value / total) * 100).toFixed(1);
                const formattedValue = new Intl.NumberFormat("en-PH", {
                  style: "currency",
                  currency: "PHP",
                }).format(value);
                return `${context.label}: ${formattedValue} (${percentage}%)`;
              },
              afterLabel: function (context) {
                const isExpense = context.dataIndex < expenseLabels.length;
                return `Type: ${isExpense ? "Expense" : "Income"}`;
              },
            },
          },
        },
        layout: {
          padding: {
            top: 20,
            right: 20,
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
    wrapper.style.height = "15rem";
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
