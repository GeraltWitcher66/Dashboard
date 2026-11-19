// ===== فرمت اعداد فارسی =====
const fmt = new Intl.NumberFormat("fa-IR");
const fmtCompact = new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 });
const fmtMoney = (v) => `${fmtCompact.format(v)} ریال`;

const METRICS = {
  rial: { label: "خرید ریالی", unit: "ریال", fmt: fmtMoney, rawFmt: fmt.format },
  carton: { label: "خرید کارتنی", unit: "کارتن", fmt: (v) => `${fmt.format(v)} کارتن`, rawFmt: fmt.format },
  weight: { label: "خرید وزنی", unit: "کیلوگرم", fmt: (v) => `${fmt.format(v)} کیلوگرم`, rawFmt: fmt.format },
  days: { label: "تعداد روزهای خرید", unit: "روز", fmt: (v) => `${fmt.format(v)} روز`, rawFmt: fmt.format },
};

const PALETTE = ["#0284c7", "#059669", "#d97706", "#db2777", "#7c3aed", "#e11d48", "#0d9488", "#ca8a04", "#2563eb", "#9333ea"];
const BRANCH_COLORS = ["#0284c7", "#059669", "#d97706", "#db2777"];
const ROUTE_COLORS = ["#0284c7", "#059669", "#d97706", "#db2777", "#7c3aed", "#e11d48"];
const GRID = "rgba(100, 116, 139, 0.15)";
const TICK = "#475569";
const LEGEND = "#334155";

let state = { branch: "", salesman: "", route: "", topMetric: "rial", rankMetric: "rial" };
let charts = {};

// ===== فیلتر =====
function applyFilters() {
  return CUSTOMERS.filter(
    (c) =>
      (!state.branch || c.branch === state.branch) &&
      (!state.salesman || c.salesman === state.salesman) &&
      (!state.route || c.route === state.route)
  );
}

function aggregate(list, key) {
  const map = new Map();
  list.forEach((c) => {
    const k = c[key];
    if (!map.has(k)) map.set(k, { rial: 0, carton: 0, weight: 0, days: 0, count: 0 });
    const a = map.get(k);
    a.rial += c.rial;
    a.carton += c.carton;
    a.weight += c.weight;
    a.days += c.days;
    a.count += 1;
  });
  return [...map.entries()].map(([name, v]) => ({ name, ...v }));
}

// ===== KPI =====
function renderKPIs(list) {
  const totalRial = list.reduce((s, c) => s + c.rial, 0);
  const totalCarton = list.reduce((s, c) => s + c.carton, 0);
  const totalWeight = list.reduce((s, c) => s + c.weight, 0);
  const avgDays = list.length ? Math.round(list.reduce((s, c) => s + c.days, 0) / list.length) : 0;
  const best = [...list].sort((a, b) => b.rial - a.rial)[0];

  const items = [
    { title: "تعداد مشتری", value: fmt.format(list.length), sub: "مشتری فیلتر شده", color: "#0284c7" },
    { title: "مجموع فروش ریالی", value: fmtMoney(totalRial), sub: "جمع مبالغ خرید", color: "#059669" },
    { title: "مجموع فروش کارتنی", value: `${fmt.format(totalCarton)} کارتن`, sub: "تعداد کارتن", color: "#d97706" },
    { title: "مجموع فروش وزنی", value: `${fmt.format(totalWeight)} کیلوگرم`, sub: "وزن کل", color: "#db2777" },
    { title: "میانگین روزهای خرید", value: `${fmt.format(avgDays)} روز`, sub: "به ازای هر مشتری", color: "#7c3aed" },
    { title: "مشتری برتر (ریالی)", value: best ? best.name.split(" ").slice(0, 2).join(" ") : "—", sub: best ? fmtMoney(best.rial) : "", color: "#0d9488" },
  ];

  document.getElementById("kpiRow").innerHTML = items
    .map(
      (i) => `
    <div class="kpi" style="--kpi-color:${i.color}">
      <div class="kpi-title">${i.title}</div>
      <div class="kpi-value">${i.value}</div>
      ${i.sub ? `<div class="kpi-sub">${i.sub}</div>` : ""}
    </div>`
    )
    .join("");
}

// ===== نمودار مشتریان برتر =====
function renderTopCustomers(list, metric) {
  const top = [...list].sort((a, b) => b[metric] - a[metric]).slice(0, 10);
  const ctx = document.getElementById("chartTopCustomers");
  const labels = top.map((c) => `${c.name.split(" ").slice(0, 2).join(" ")} (${c.code})`);
  const data = top.map((c) => c[metric]);

  if (charts.top) charts.top.destroy();
  charts.top = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: METRICS[metric].label,
          data,
          backgroundColor: PALETTE.map((c, i) => c + (i < 3 ? "dd" : "88")),
          borderColor: PALETTE,
          borderWidth: 1.5,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          textDirection: "rtl",
          titleFont: { family: "Vazirmatn" },
          bodyFont: { family: "Vazirmatn" },
          callbacks: { label: (ctx) => ` ${METRICS[metric].fmt(ctx.parsed.x)}` },
        },
      },
      scales: {
        x: {
          reverse: true,
          ticks: {
            color: TICK,
            font: { family: "Vazirmatn" },
            callback: (v) => fmtCompact.format(v),
          },
          grid: { color: GRID },
        },
        y: {
          ticks: { color: LEGEND, font: { family: "Vazirmatn", size: 11 } },
          grid: { display: false },
        },
      },
    },
  });
}

// ===== نمودار سهم شعبه =====
function renderBranchShare(list) {
  const agg = aggregate(list, "branch").sort((a, b) => b.rial - a.rial);
  const ctx = document.getElementById("chartBranchShare");
  if (charts.branchShare) charts.branchShare.destroy();
  charts.branchShare = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: agg.map((a) => a.name),
      datasets: [
        {
          data: agg.map((a) => a.rial),
          backgroundColor: BRANCH_COLORS,
          borderColor: "#ffffff",
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "58%",
      plugins: {
        legend: { position: "bottom", labels: { color: LEGEND, font: { family: "Vazirmatn" }, padding: 12 } },
        tooltip: {
          rtl: true,
          textDirection: "rtl",
          titleFont: { family: "Vazirmatn" },
          bodyFont: { family: "Vazirmatn" },
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return ` ${fmtMoney(ctx.parsed)} — ${fmt.format(+pct)}٪`;
            },
          },
        },
      },
    },
  });
}

// ===== نمودار فروشندگان =====
function renderSalesmen(list) {
  const agg = aggregate(list, "salesman").sort((a, b) => b.rial - a.rial);
  const ctx = document.getElementById("chartSalesmen");
  if (charts.salesmen) charts.salesmen.destroy();
  charts.salesmen = new Chart(ctx, {
    type: "bar",
    data: {
      labels: agg.map((a) => a.name),
      datasets: [
        {
          label: "فروش ریالی",
          data: agg.map((a) => a.rial),
          backgroundColor: "#0284c7cc",
          borderRadius: 6,
        },
        {
          label: "تعداد مشتری",
          data: agg.map((a) => a.count),
          backgroundColor: "#05966999",
          borderRadius: 6,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: LEGEND, font: { family: "Vazirmatn" } } },
        tooltip: {
          rtl: true,
          textDirection: "rtl",
          titleFont: { family: "Vazirmatn" },
          bodyFont: { family: "Vazirmatn" },
          callbacks: { label: (ctx) => (ctx.datasetIndex === 0 ? ` فروش: ${fmtMoney(ctx.parsed.y)}` : ` مشتریان: ${fmt.format(ctx.parsed.y)} نفر`) },
        },
      },
      scales: {
        x: { reverse: true, ticks: { color: TICK, font: { family: "Vazirmatn" } }, grid: { display: false } },
        y: { ticks: { color: TICK, callback: (v) => fmtCompact.format(v) }, grid: { color: GRID } },
        y1: { position: "left", ticks: { color: "#059669" }, grid: { display: false } },
      },
    },
  });
}

// ===== نمودار مسیرها =====
function renderRoutes(list) {
  const agg = aggregate(list, "route").sort((a, b) => b.rial - a.rial);
  const ctx = document.getElementById("chartRoutes");
  if (charts.routes) charts.routes.destroy();
  charts.routes = new Chart(ctx, {
    type: "bar",
    data: {
      labels: agg.map((a) => a.name),
      datasets: [
        { label: "ریالی", data: agg.map((a) => a.rial), backgroundColor: "#7c3aed99", borderRadius: 6 },
        { label: "کارتنی", data: agg.map((a) => a.carton), backgroundColor: "#d9770699", borderRadius: 6, yAxisID: "y1" },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: LEGEND, font: { family: "Vazirmatn" } } },
        tooltip: {
          rtl: true,
          textDirection: "rtl",
          titleFont: { family: "Vazirmatn" },
          bodyFont: { family: "Vazirmatn" },
          callbacks: { label: (ctx) => (ctx.datasetIndex === 0 ? ` ${fmtMoney(ctx.parsed.y)}` : ` ${fmt.format(ctx.parsed.y)} کارتن`) },
        },
      },
      scales: {
        x: { reverse: true, ticks: { color: TICK, font: { family: "Vazirmatn" } }, grid: { display: false } },
        y: { ticks: { color: TICK, callback: (v) => fmtCompact.format(v) }, grid: { color: GRID } },
        y1: { position: "left", ticks: { color: "#d97706" }, grid: { display: false } },
      },
    },
  });
}

// ===== رادار مقایسه شعبه =====
function renderBranchRadar(list) {
  const agg = aggregate(list, "branch");
  const max = { rial: 1, carton: 1, weight: 1, days: 1 };
  ["rial", "carton", "weight", "days"].forEach((k) => (max[k] = Math.max(...agg.map((a) => a[k]), 1)));
  const ctx = document.getElementById("chartBranchRadar");
  if (charts.radar) charts.radar.destroy();
  charts.radar = new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["ریالی", "کارتنی", "وزنی", "روزهای خرید", "تعداد مشتری"],
      datasets: agg.map((a, i) => ({
        label: a.name,
        data: [
          (a.rial / max.rial) * 100,
          (a.carton / max.carton) * 100,
          (a.weight / max.weight) * 100,
          (a.days / max.days) * 100,
          (a.count / Math.max(...agg.map((x) => x.count), 1)) * 100,
        ],
        borderColor: BRANCH_COLORS[i % BRANCH_COLORS.length],
        backgroundColor: BRANCH_COLORS[i % BRANCH_COLORS.length] + "26",
        pointBackgroundColor: BRANCH_COLORS[i % BRANCH_COLORS.length],
        borderWidth: 2,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: LEGEND, font: { family: "Vazirmatn" } } }, tooltip: { rtl: true, textDirection: "rtl", titleFont: { family: "Vazirmatn" }, bodyFont: { family: "Vazirmatn" } } },
      scales: {
        r: {
          angleLines: { color: GRID },
          grid: { color: GRID },
          pointLabels: { color: "#334155", font: { family: "Vazirmatn", size: 11 } },
          ticks: { display: false },
          suggestedMin: 0,
          suggestedMax: 100,
        },
      },
    },
  });
}

// ===== جدول رتبه‌بندی =====
function renderRankTable(list, metric) {
  const sorted = [...list].sort((a, b) => b[metric] - a[metric]).slice(0, 50);
  const tbody = document.querySelector("#rankTable tbody");
  tbody.innerHTML = sorted
    .map((c, i) => {
      const rankCls = i < 3 ? `rank r${i + 1}` : "rank";
      const nameCls = i < 3 ? "top-name" : "";
      const metricCell = metric === "rial" ? "hot" : "";
      return `
      <tr>
        <td><span class="${rankCls}">${fmt.format(i + 1)}</span></td>
        <td>${c.code}</td>
        <td class="${nameCls}">${c.name}</td>
        <td>${c.storeType}</td>
        <td>${c.branch}</td>
        <td>${c.salesman}</td>
        <td>${c.route}</td>
        <td class="num ${metric === "rial" ? metricCell : ""}">${fmt.format(c.rial)}</td>
        <td class="num ${metric === "carton" ? metricCell : ""}">${fmt.format(c.carton)}</td>
        <td class="num ${metric === "weight" ? metricCell : ""}">${fmt.format(c.weight)}</td>
        <td class="num ${metric === "days" ? metricCell : ""}">${fmt.format(c.days)}</td>
        <td>${c.openDate}</td>
        <td>${c.lastBuy}</td>
      </tr>`;
    })
    .join("");
}

// ===== رندر کلی =====
function renderAll() {
  const list = applyFilters();
  renderKPIs(list);
  renderTopCustomers(list, state.topMetric);
  renderBranchShare(list);
  renderSalesmen(list);
  renderRoutes(list);
  renderBranchRadar(list);
  renderRankTable(list, state.rankMetric);
}

// ===== رویدادها =====
function initFilters() {
  const fill = (id, values) => {
    const sel = document.getElementById(id);
    values.forEach((v) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
  };
  fill("filterBranch", [...new Set(CUSTOMERS.map((c) => c.branch))]);
  fill("filterSalesman", [...new Set(CUSTOMERS.map((c) => c.salesman))]);
  fill("filterRoute", [...new Set(CUSTOMERS.map((c) => c.route))]);

  document.getElementById("filterBranch").addEventListener("change", (e) => { state.branch = e.target.value; renderAll(); });
  document.getElementById("filterSalesman").addEventListener("change", (e) => { state.salesman = e.target.value; renderAll(); });
  document.getElementById("filterRoute").addEventListener("change", (e) => { state.route = e.target.value; renderAll(); });
  document.getElementById("btnReset").addEventListener("click", () => {
    state = { ...state, branch: "", salesman: "", route: "" };
    document.getElementById("filterBranch").value = "";
    document.getElementById("filterSalesman").value = "";
    document.getElementById("filterRoute").value = "";
    renderAll();
  });

  document.querySelectorAll("#topMetricSeg button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#topMetricSeg button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.topMetric = btn.dataset.metric;
      renderTopCustomers(applyFilters(), state.topMetric);
    });
  });
  document.querySelectorAll("#rankMetricSeg button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#rankMetricSeg button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.rankMetric = btn.dataset.metric;
      renderRankTable(applyFilters(), state.rankMetric);
    });
  });
}

initFilters();
renderAll();
