class ExpenseDistributionChart extends HTMLElement {
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
    const expenseData = new Map();

    // Filter expense categories and calculate totals
    categories
      .filter((category) => category.type === "expense")
      .forEach((category) => {
        if (!category.transactions) return;

        const total = category.transactions.reduce((sum, transaction) => {
          return sum + parseFloat(transaction.amount);
        }, 0);

        if (total > 0) {
          expenseData.set(category.name, total);
        }
      });

    // If no data, add a placeholder
    if (expenseData.size === 0) {
      expenseData.set("No expenses yet", 1);
    }

    return expenseData;
  }

  generateColors(count) {
    const colors = [
      "#4ade80", // green-400
      "#f87171", // red-400
      "#60a5fa", // blue-400
      "#fbbf24", // amber-400
      "#a78bfa", // violet-400
      "#34d399", // emerald-400
      "#f472b6", // pink-400
      "#818cf8", // indigo-400
      "#fb923c", // orange-400
      "#2dd4bf", // teal-400
    ];

    while (colors.length < count) {
      const hue = (colors.length * 137.508) % 360;
      colors.push(`hsl(${hue}, 70%, 60%)`);
    }

    return colors;
  }

  createChart(canvas) {
    if (!window.Chart) {
      console.error("Chart.js not loaded");
      return;
    }

    const expenseData = this.processData();
    const labels = Array.from(expenseData.keys());
    const data = Array.from(expenseData.values());
    const colors = this.generateColors(labels.length);

    const total = data.reduce((sum, value) => sum + value, 0);

    Chart.defaults.color = "#ffffff"; // Set default text color to white for all charts

    const ctx = canvas.getContext("2d");
    return new window.Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors,
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
                weight: "normal",
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
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                const formattedValue = new Intl.NumberFormat("en-PH", {
                  style: "currency",
                  currency: "PHP",
                }).format(value);
                return `${context.label}: ${formattedValue} (${percentage}%)`;
              },
            },
          },
        },
        layout: {
          padding: {
            top: 20,
            right: 20, // Increased to accommodate right legend
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
    canvas.id = "expenseDistributionChart";
    wrapper.appendChild(canvas);

    this.innerHTML = "";
    this.appendChild(wrapper);

    if (window.Chart) {
      this.chart = this.createChart(canvas);
    }
  }
}

customElements.define("expense-distribution-chart", ExpenseDistributionChart);

export default ExpenseDistributionChart;
