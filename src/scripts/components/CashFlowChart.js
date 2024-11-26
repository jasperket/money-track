class CashFlowChart extends HTMLElement {
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
        // Add resize listener after chart is created
        window.addEventListener("resize", this.handleResize.bind(this));
      };
      document.head.appendChild(script);
    } else {
      this.render();
      window.addEventListener("resize", this.handleResize.bind(this));
    }
  }

  // Handle window resize
  handleResize() {
    if (this.chart) {
      this.chart.resize();
    }
  }

  connectedCallback() {
    this.setupEventListeners();
    // Add CSS styles when component is connected
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
    // Add styles to make the component responsive
    this.style.display = "block";
    this.style.width = "100%";
    this.style.height = "15rem"; // Increased height for better visibility
    this.style.position = "relative";
  }

  setupEventListeners() {
    this.updateChart = this.updateChart.bind(this);
    window.addEventListener("storage", this.updateChart);
  }

  processData() {
    const categories = JSON.parse(localStorage.getItem("categories")) || [];
    const dailyTotals = new Map();

    categories.forEach((category) => {
      if (!category.transactions) return;

      category.transactions.forEach((transaction) => {
        const date = new Date(transaction.date).toISOString().split("T")[0];
        const amount = parseFloat(transaction.amount);

        if (!dailyTotals.has(date)) {
          dailyTotals.set(date, { income: 0, expenses: 0, balance: 0 });
        }

        const daily = dailyTotals.get(date);
        if (category.type === "income") {
          daily.income += amount;
        } else {
          daily.expenses += amount;
        }
        daily.balance = daily.income - daily.expenses;
      });
    });

    return Array.from(dailyTotals.entries()).sort(
      (a, b) => new Date(a[0]) - new Date(b[0]),
    );
  }

  createChart(canvas) {
    if (!window.Chart) {
      console.error("Chart.js not loaded");
      return;
    }

    const sortedData = this.processData();

    const labels = sortedData.map(([date]) => {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    });

    const incomeData = sortedData.map(([_, data]) => data.income);
    const expensesData = sortedData.map(([_, data]) => data.expenses);
    const balanceData = sortedData.map(([_, data]) => data.balance);

    const ctx = canvas.getContext("2d");
    return new window.Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Income",
            data: incomeData,
            borderColor: "#4ade80", // green-400
            backgroundColor: "rgba(74, 222, 128, 0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Expenses",
            data: expensesData,
            borderColor: "#f87171", // red-400
            backgroundColor: "rgba(248, 113, 113, 0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Balance",
            data: balanceData,
            borderColor: "#60a5fa", // blue-400
            backgroundColor: "rgba(96, 165, 250, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
            mode: "index",
            intersect: false,
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: ${new Intl.NumberFormat(
                  "en-PH",
                  {
                    style: "currency",
                    currency: "PHP",
                  },
                ).format(context.raw)}`;
              },
            },
          },
        },
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
        interaction: {
          intersect: false,
          mode: "index",
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
    // Create wrapper div for better sizing control
    const wrapper = document.createElement("div");
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    wrapper.style.position = "relative";

    // Create canvas element
    const canvas = document.createElement("canvas");
    canvas.id = "cashFlowChart";
    wrapper.appendChild(canvas);

    // Clear any existing content and add the wrapper
    this.innerHTML = "";
    this.appendChild(wrapper);

    // Create the chart if Chart.js is loaded
    if (window.Chart) {
      this.chart = this.createChart(canvas);
    }
  }
}

// Register the custom element
customElements.define("cash-flow-chart", CashFlowChart);

export default CashFlowChart;
