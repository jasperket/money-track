class WeeklySpendingChart extends HTMLElement {
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
    const expenseCategories = categories.filter(
      (cat) => cat.type === "expense",
    );

    // Get the last 4 weeks
    const weeks = [];
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      weeks.unshift(weekStart);
    }

    // Initialize data structure
    const weeklyData = weeks.map((week) => ({
      week: week,
      categories: {},
    }));

    // Process transactions
    expenseCategories.forEach((category) => {
      if (!category.transactions) return;

      category.transactions.forEach((transaction) => {
        const transactionDate = new Date(transaction.date);
        const amount = parseFloat(transaction.amount);

        // Find which week this transaction belongs to
        const weekIndex = weeks.findIndex((week) => {
          const weekEnd = new Date(week);
          weekEnd.setDate(week.getDate() + 7);
          return transactionDate >= week && transactionDate < weekEnd;
        });

        if (weekIndex !== -1) {
          if (!weeklyData[weekIndex].categories[category.name]) {
            weeklyData[weekIndex].categories[category.name] = 0;
          }
          weeklyData[weekIndex].categories[category.name] += amount;
        }
      });
    });

    return {
      weeks: weeks,
      data: weeklyData,
      categories: expenseCategories.map((cat) => cat.name),
    };
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

    const { weeks, data, categories } = this.processData();
    const colors = this.generateColors(categories.length);

    // Prepare datasets
    const datasets = categories.map((category, index) => ({
      label: category,
      data: data.map((week) => week.categories[category] || 0),
      backgroundColor: colors[index],
      borderColor: "rgb(9, 9, 11)", // zinc-950
      borderWidth: 1,
    }));

    // Format week labels
    const labels = weeks.map((week) => {
      const endOfWeek = new Date(week);
      endOfWeek.setDate(week.getDate() + 6);
      return `${week.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { day: "numeric" })}`;
    });

    const ctx = canvas.getContext("2d");
    return new window.Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
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
            stacked: true,
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
                size: 12,
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
                const total = tooltipItems.reduce(
                  (sum, item) => sum + item.parsed.y,
                  0,
                );
                return `Total: ${new Intl.NumberFormat("en-PH", {
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
    canvas.id = "weeklySpendingChart";
    wrapper.appendChild(canvas);

    this.innerHTML = "";
    this.appendChild(wrapper);

    if (window.Chart) {
      this.chart = this.createChart(canvas);
    }
  }
}

customElements.define("weekly-spending-chart", WeeklySpendingChart);

export default WeeklySpendingChart;
