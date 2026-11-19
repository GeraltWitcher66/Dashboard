// ===== داده نمونه مشتریان =====
// برای استفاده واقعی، آرایه customers را با دیتای خود جایگزین کنید

const BRANCHES = ["مرکز توزیع تهران", "مرکز توزیع کرج", "شعبه اصفهان", "شعبه شیراز"];
const SALESMEN = ["علی محمدی", "رضا کریمی", "سعید احمدی", "مهدی قاسمی", "امیر حسینی", "بهرام نادری"];
const ROUTES = ["مسیر ویزیت شمال", "مسیر ویزیت جنوب", "مسیر ویزیت شرق", "مسیر ویزیت غرب", "مسیر ویزیت مرکز", "مسیر ویزیت حومه"];

const FIRST_NAMES = ["محمد", "علی", "رضا", "حسین", "مهدی", "احمد", "جعفر", "مصطفی", "ابراهیم", "صادق",
  "فاطمه", "زهرا", "مریم", "سارا", "نرگس", "الهام", "مرضیه", "شراره", "آرش", "بهزاد",
  "کامران", "فرهاد", "نوید", "پارسا", "سامان", "مبینا", "ندا", "شیوا", "بهنام", "محسن"];
const LAST_NAMES = ["محمدی", "رضایی", "احمدی", "کریمی", "موسوی", "هاشمی", "قاسمی", "نادری", "حسینی", "شریفی",
  "عابدی", "جوادی", "پورمحمد", "سلطانی", "مرادی", "کاظمی", "نجفی", "عزیزی", "رمضانی", "یوسفی",
  "باقری", "توکلی", "صادقی", "فرهادی", "ناصری", "اکبری", "محمودی", "قاسم‌زاده", "رستمی", "شفیعی"];
const STORE_TYPES = ["پخش مواد غذایی", "سوپرمارکت", "هایپرمارکت", "بقالی", "فروشگاه زنجیره‌ای", "عمده‌فروشی", "کافه‌رستوران", "نانوایی"];

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateCustomers(count = 120) {
  const rand = mulberry32(42);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;

  // تخصیص فروشنده به هر شعبه
  const branchSalesmen = {
    "مرکز توزیع تهران": SALESMEN.slice(0, 3),
    "مرکز توزیع کرج": SALESMEN.slice(2, 5),
    "شعبه اصفهان": [SALESMEN[3], SALESMEN[5], SALESMEN[0]],
    "شعبه شیراز": [SALESMEN[1], SALESMEN[4], SALESMEN[5]],
  };
  const branchRoutes = {
    "مرکز توزیع تهران": [ROUTES[0], ROUTES[2], ROUTES[4]],
    "مرکز توزیع کرج": [ROUTES[5], ROUTES[4], ROUTES[1]],
    "شعبه اصفهان": [ROUTES[1], ROUTES[3], ROUTES[5]],
    "شعبه شیراز": [ROUTES[3], ROUTES[2], ROUTES[5]],
  };

  const customers = [];
  for (let i = 1; i <= count; i++) {
    const branch = pick(BRANCHES);
    const salesman = pick(branchSalesmen[branch]);
    const route = pick(branchRoutes[branch]);

    // توزیع قدرت خرید: اکثر مشتریان کوچک، تعداد کمی بزرگ
    const tier = rand();
    let rialBase, cartonBase, weightBase;
    if (tier < 0.55) { rialBase = int(50, 400); }
    else if (tier < 0.85) { rialBase = int(400, 1500); }
    else { rialBase = int(1500, 6000); }
    cartonBase = Math.round(rialBase * (0.04 + rand() * 0.04));
    weightBase = Math.round(cartonBase * (12 + rand() * 18));

    const rial = rialBase * 1_000_000; // ریال
    const carton = cartonBase;
    const weight = weightBase;
    const days = int(4, 95);
    const openYear = int(1395, 1403);
    const openMonth = int(1, 12);
    const openDay = int(1, 28);
    const lastMonth = int(7, 12);
    const lastDay = int(1, 28);

    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const name = `${first} ${last} ${pick(["", "", "پور", "زاده"]).trim()}`.trim();

    customers.push({
      code: `C${String(1000 + i)}`,
      name,
      storeType: pick(STORE_TYPES),
      rial,
      carton,
      weight,
      days,
      openDate: `${openYear}/${String(openMonth).padStart(2, "0")}/${String(openDay).padStart(2, "0")}`,
      lastBuy: `1404/${String(lastMonth).padStart(2, "0")}/${String(lastDay).padStart(2, "0")}`,
      route,
      salesman,
      branch,
    });
  }
  return customers;
}

const CUSTOMERS = generateCustomers(120);
