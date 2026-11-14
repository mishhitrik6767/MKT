// document.addEventListener("DOMContentLoaded", () => {
/* ---------- Стан ---------- */
const state = {
  courses: [],
  status: "loading", // "loading" | "ready" | "error"
  cart: loadCart(),
  courseSearch: "",
  page: location.hash === "#/cart" ? "cart" : "home",
  orderSent: false,
};

const headerEl = document.getElementById("header");
const mainEl = document.getElementById("main");

/* ---------- Завантаження даних ---------- */
async function loadCourses() {
  const response = await fetch("store_db.json");
  if (!response.ok) {
    throw new Error(`Не вдалося завантажити store_db.json (${response.status})`);
  }
  return response.json();
}

async function init() {
  state.status = "loading";
  render();
  try {
    state.courses = await loadCourses();
    state.status = "ready";
  } catch (error) {
    console.error(error);
    state.status = "error";
  }
  render();
}

/* ---------- Кошик (localStorage) ---------- */
function loadCart() {
  try {
    const data = JSON.parse(localStorage.getItem("course-cart") || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem("course-cart", JSON.stringify(state.cart));
}

function toggleCart(id) {
  state.cart = state.cart.includes(id)
    ? state.cart.filter((item) => item !== id)
    : [...state.cart, id];
  saveCart();
  render();
}

/* ---------- Допоміжні функції ---------- */
const formatPrice = (value) => new Intl.NumberFormat("uk-UA").format(value) + " ₴";

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[ch]);

function pluralCourses(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "курс";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "курси";
  return "курсів";
}

const arrowIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
const bagIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 8.5h11l1 12h-13l1-12Z"/><path d="M9 9V6.5a3 3 0 0 1 6 0V9"/></svg>`;

/* ---------- Навігація ---------- */
function navigate(nextPage) {
  history.pushState({}, "", nextPage === "cart" ? "#/cart" : "#/");
  state.page = nextPage;
  state.orderSent = false;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.addEventListener("popstate", () => {
  state.page = location.hash === "#/cart" ? "cart" : "home";
  state.orderSent = false;
  render();
});

/* ---------- Шаблони ---------- */
function headerTemplate() {
  return `
    <button class="brand" data-action="home" aria-label="На головну">MKT<span>.</span>COURSES</button>
    <nav aria-label="Основна навігація">
      <button class="${state.page === "home" ? "active" : ""}" data-action="home">Курси</button>
      <button class="cart-link" data-action="cart">
        ${bagIcon}Кошик<span class="cart-count">${state.cart.length}</span>
      </button>
    </nav>`;
}

function statusTemplate() {
  if (state.status === "loading") {
    return `<div class="status-box">Завантаження курсів…</div>`;
  }
  return `
    <div class="status-box">
      <p>Не вдалося завантажити курси.</p>
      <button class="primary-button" data-action="retry">Спробувати ще раз</button>
    </div>`;
}

function courseCardTemplate(course) {
  const selected = state.cart.includes(course.id);
  const design =
    course.id === 4 ? " course-card--targeting" : course.id === 5 ? " course-card--email" : "";
  const search = state.courseSearch.trim().toLocaleLowerCase("uk-UA");
  const searchableText = [course.title, course.description, course.level, course.duration]
    .join(" ")
    .toLocaleLowerCase("uk-UA");
  return `
    <article class="course-card${design}" data-search="${esc(searchableText)}"${searchableText.includes(search) ? "" : " hidden"}>
      <div class="course-top">
        <span class="course-number" style="background-color: ${esc(course.accent)}">${esc(course.number)}</span>
        <span class="level">${esc(course.level)}</span>
      </div>
      <div class="course-content">
        <h3>${esc(course.title)}</h3>
        <p>${esc(course.description)}</p>
      </div>
      <div class="course-meta">
        <span>${esc(course.duration)}</span><i></i><span>${esc(course.lessons)} занять</span>
      </div>
      <div class="course-bottom">
        <strong>${formatPrice(course.price)}</strong>
        <button class="add-button${selected ? " selected" : ""}" data-action="toggle" data-id="${course.id}">
          ${selected ? "Додано" : "До кошика"}${selected ? "<span>✓</span>" : arrowIcon}
        </button>
      </div>
    </article>`;
}

function homeTemplate() {
  const search = state.courseSearch.trim().toLocaleLowerCase("uk-UA");
  const matchingCourses = state.courses.filter((course) =>
    [course.title, course.description, course.level, course.duration]
      .join(" ")
      .toLocaleLowerCase("uk-UA")
      .includes(search),
  );
  const list =
    state.status === "ready"
      ? `${state.courses.map(courseCardTemplate).join("")}<p class="search-empty" role="status"${matchingCourses.length ? " hidden" : ""}>Курсів за вашим запитом не знайдено.</p>`
      : statusTemplate();

  const floatingCart =
    state.cart.length > 0
      ? `<div class="floating-cart">
           <span>${state.cart.length} ${pluralCourses(state.cart.length)} у кошику</span>
           <button data-action="cart">Перейти до кошика ${arrowIcon}</button>
         </div>`
      : "";

  return `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Практичне навчання маркетингу</p>
        <h1>Маркетинг, що <em>працює.</em></h1>
        <p class="hero-text">Опануй актуальні інструменти, створи сильне портфоліо та почни заробляти на своїх знаннях.</p>
        <button class="primary-button" data-action="scroll-courses">Обрати курс ${arrowIcon}</button>
      </div>
      <div class="hero-visual" aria-label="Робочий процес креативної команди">
        <img src="https://images.unsplash.com/photo-1752650733543-9e5cb5a3a7ad?auto=format&fit=crop&w=1200&q=85"
             alt="Креативна команда працює з візуальними матеріалами">
        <div class="hero-sticker"><strong>100%</strong><span>практики</span></div>
        <div class="spark spark-one"></div>
        <div class="spark spark-two"></div>
      </div>
    </section>

    <section class="courses-section" id="courses">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Обери свій напрям</p>
          <h2>Наші курси</h2>
        </div>
        <form class="course-search" id="course-search-form">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 5 5"></path></svg>
          <input type="search" data-course-search value="${esc(state.courseSearch)}" placeholder="Знайти курс" aria-label="Знайти курс">
          <button class="search-button" type="submit">Шукати</button>
        </form>
      </div>
      <div class="course-list">${list}</div>
      ${floatingCart}
    </section>`;
}

function successTemplate() {
  return `
    <div class="success-icon">✓</div>
    <p class="eyebrow">Замовлення прийнято</p>
    <h1>Дякуємо!</h1>
    <p>Ми вже надіслали деталі та доступ до курсів на вашу електронну пошту.</p>
    <button class="primary-button" data-action="home">Повернутися до курсів ${arrowIcon}</button>`;
}

function cartTemplate() {
  const items = state.courses.filter((course) => state.cart.includes(course.id));
  const total = items.reduce((sum, course) => sum + course.price, 0);

  const head = `
    <button class="back-button" data-action="home"><span>←</span> Продовжити вибір</button>
    <div class="cart-title">
      <p class="eyebrow">Твій вибір</p>
      <h1>Кошик <span>(${items.length})</span></h1>
    </div>`;

  if (state.status !== "ready") {
    return head + statusTemplate();
  }

  if (items.length === 0) {
    return `${head}
      <div class="empty-cart">
        ${bagIcon}
        <h2>Тут поки порожньо</h2>
        <p>Обери курс, який допоможе зробити наступний крок у кар’єрі.</p>
        <button class="primary-button" data-action="home">Переглянути курси ${arrowIcon}</button>
      </div>`;
  }

  const rows = items
    .map(
      (course) => `
      <article class="cart-item">
        <span class="course-number" style="background-color: ${esc(course.accent)}">${esc(course.number)}</span>
        <div class="cart-item-info">
          <span>${esc(course.level)} · ${esc(course.duration)}</span>
          <h2>${esc(course.title)}</h2>
        </div>
        <strong>${formatPrice(course.price)}</strong>
        <button class="remove-button" data-action="remove" data-id="${course.id}"
                aria-label="Видалити ${esc(course.title)}">×</button>
      </article>`,
    )
    .join("");

  return `${head}
    <div class="checkout-layout">
      <section class="cart-items" aria-label="Обрані курси">
        ${rows}
        <div class="total-row"><span>Разом</span><strong>${formatPrice(total)}</strong></div>
      </section>

      <form class="checkout-form" id="checkout-form">
        <div>
          <p class="eyebrow">Оформлення</p>
          <h2>Ваші дані</h2>
        </div>
        <label>Ім’я та прізвище
          <input name="name" type="text" placeholder="Олена Коваль" required>
        </label>
        <label>Електронна пошта
          <input name="email" type="email" placeholder="hello@email.com" required>
        </label>
        <label>Номер телефону
          <input name="phone" type="tel" placeholder="+380 00 000 00 00" required>
        </label>
        <button class="checkout-button" type="submit">Оформити замовлення ${arrowIcon}</button>
        <p class="form-note">Після оформлення ми надішлемо інструкції для оплати.</p>
      </form>
    </div>`;
}

/* ---------- Рендер ---------- */
function render() {
  // зберігаємо введене у формі, щоб воно не губилось при перемальовуванні
  const saved = {};
  document.querySelectorAll("#checkout-form input").forEach((input) => {
    saved[input.name] = input.value;
  });

  headerEl.innerHTML = headerTemplate();

  if (state.page === "home") {
    mainEl.className = "";
    mainEl.innerHTML = homeTemplate();
  } else if (state.orderSent) {
    mainEl.className = "success-page";
    mainEl.innerHTML = successTemplate();
  } else {
    mainEl.className = "cart-page";
    mainEl.innerHTML = cartTemplate();
    document.querySelectorAll("#checkout-form input").forEach((input) => {
      if (saved[input.name]) input.value = saved[input.name];
    });
  }
}

/* ---------- Події ---------- */
document.addEventListener("click", (event) => {
  const el = event.target.closest("[data-action]");
  if (!el) return;
  const id = Number(el.dataset.id);

  switch (el.dataset.action) {
    case "home":
      navigate("home");
      break;
    case "cart":
      navigate("cart");
      break;
    case "toggle":
    case "remove":
      toggleCart(id);
      break;
    case "scroll-courses":
      document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" });
      break;
    case "retry":
      init();
      break;
  }
});

function filterCourses(value) {
  state.courseSearch = value;
  const search = value.trim().toLocaleLowerCase("uk-UA");
  let visibleCourses = 0;

  document.querySelectorAll(".course-card").forEach((card) => {
    const matches = card.dataset.search.includes(search);
    card.hidden = !matches;
    if (matches) visibleCourses += 1;
  });

  const emptyMessage = document.querySelector(".search-empty");
  if (emptyMessage) emptyMessage.hidden = visibleCourses > 0;
}

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-course-search]")) {
    filterCourses(event.target.value);
  }
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "course-search-form") {
    event.preventDefault();
    filterCourses(event.target.querySelector("[data-course-search]").value);
    return;
  }

  if (event.target.id !== "checkout-form") return;
  event.preventDefault();
  state.orderSent = true;
  state.cart = [];
  saveCart();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ---------- Старт ---------- */
init();
// });
