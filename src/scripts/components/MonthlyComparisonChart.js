class MonthlyComparisonChart extends HTMLElement {
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
    const monthlyData = new Map();

    // Get all transactions and organize by month
    categories.forEach((category) => {
      if (!category.transactions) return;

      category.transactions.forEach((transaction) => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { income: 0, expenses: 0 });
        }

        const amount = parseFloat(transaction.amount);
        const monthData = monthlyData.get(monthKey);

        if (category.type === "income") {
          monthData.income += amount;
        } else {
          monthData.expenses += amount;
        }
      });
    });

    // Convert to arrays and sort by date
    const sortedEntries = Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6); // Get last 6 months

    return sortedEntries;
  }

  createChart(canvas) {
    if (!window.Chart) {
      console.error("Chart.js not loaded");
      return;
    }

    const monthlyData = this.processData();

    const labels = monthlyData.map(([month]) => {
      const [year, monthNum] = month.split("-");
      return new Date(year, monthNum - 1).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
    });

    const incomeData = monthlyData.map(([_, data]) => data.income);
    const expensesData = monthlyData.map(([_, data]) => data.expenses);

    const ctx = canvas.getContext("2d");
    return new window.Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Income",
            data: incomeData,
            backgroundColor: "rgba(74, 222, 128, 0.8)", // green-400
            borderColor: "rgb(9, 9, 11)", // zinc-950
            borderWidth: 1,
          },
          {
            label: "Expenses",
            data: expensesData,
            backgroundColor: "rgba(248, 113, 113, 0.8)", // red-400
            borderColor: "rgb(9, 9, 11)", // zinc-950
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              color: "#ffffff",
              font: {
                size: 12,
              },
            },
          },
          y: {
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              color: "#ffffff",
              font: {
                size: 12,
              },
              callback: function (value) {
                return new Intl.NumberFormat("en-PH", {
                  style: "currency",
                  currency: "PHP",
                  maximumFractionDigits: 0,
                }).format(value);
              },
            },
          },
        },
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: "#ffffff",
              padding: 20,
              font: {
                size: 14,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.dataset.label || "";
                const value = context.parsed.y;
                return `${label}: ${new Intl.NumberFormat("en-PH", {
                  style: "currency",
                  currency: "PHP",
                }).format(value)}`;
              },
              footer: function (tooltipItems) {
                const values = tooltipItems.map((item) => item.parsed.y);
                const total = values[0] - values[1]; // Income - Expenses
                return `Net: ${new Intl.NumberFormat("en-PH", {
                  style: "currency",
                  currency: "PHP",
                }).format(total)}`;
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
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    wrapper.style.position = "relative";

    const canvas = document.createElement("canvas");
    canvas.id = "monthlyComparisonChart";
    wrapper.appendChild(canvas);

    this.innerHTML = "";
    this.appendChild(wrapper);

    if (window.Chart) {
      this.chart = this.createChart(canvas);
    }
  }
}

customElements.define("monthly-comparison-chart", MonthlyComparisonChart);

export default MonthlyComparisonChart;
