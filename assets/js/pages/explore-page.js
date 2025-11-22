import loadImages, { resizeGridItem } from '/assets/js/components/load-images.js';

const pages = document.querySelectorAll(".page");
const underline = document.querySelector(".underline");
const filters = document.querySelectorAll(".choice input");
const grid = document.querySelector(".grid");
const infoScreen = document.querySelector(".image-info-screen");
const mainImage = document.querySelector(".placeholder-img");
const backButton = document.querySelector(".back-button");
const filterToggle = document.getElementById('filterToggle');
const filterSidebar = document.querySelector('.filter-side-bar');

const PAGE_MAP = ["fyp", "friends", "brandoftheday", "following", "trending"];

let currentPage = "fyp";
let imageElements = [];

// ---- UI Helpers ----
function moveUnderline(el) {
  const { offsetLeft, offsetWidth } = el;
  underline.style.width = offsetWidth / 2 + 'px';
  underline.style.left = offsetLeft + offsetWidth / 4 + 'px';
}

function resetView() {
  grid.style.display = "grid";
  infoScreen.style.display = "none";
  mainImage.style.display = "none";
  mainImage.src = "/assets/images/icons/placeholder.jpg";
}

function getSelectedFilters() {
  const filterData = { page: [currentPage] };

  filters.forEach(f => {
    if (!f.checked) return;
    const category = f.closest(".choices").previousElementSibling.textContent.trim();
    const value = f.nextElementSibling.textContent.trim();
    (filterData[category] ??= []).push(value);
  });

  return filterData;
}

// ---- Image Loading ----
async function loadPageImages(filters) {
  document.querySelector(".image-reel")?.remove();
  document.querySelector(".image-info-screen").classList.remove("active");
  mainImage.src = "/assets/images/icons/placeholder.jpg";

  imageElements = await loadImages(filters);

  imageElements.forEach(img => {
    img.addEventListener("click", () => {
      grid.style.display = "none";
      infoScreen.style.display = "flex";
      mainImage.src = img.src;
      mainImage.style.display = "block";
    });
  });
}

// ---- Page Click ----
pages.forEach((p, index) => {
  p.addEventListener("click", async () => {
    pages.forEach(pg => pg.style.color = "rgb(91, 89, 89)");
    p.style.color = "black";
    moveUnderline(p);

    currentPage = PAGE_MAP[index];
    await loadPageImages(getSelectedFilters());
    resetView();
  });
});

// ---- Filter Click ----
filters.forEach(f => {
  f.addEventListener("change", async () => {
    await loadPageImages(getSelectedFilters());
    resetView();
  });
});

// ---- Back Button ----
backButton.addEventListener("click", () => {
  resetView();
  setTimeout(() => imageElements.forEach(resizeGridItem), 50);
});

// ---- Sidebar Toggle ----
filterToggle.addEventListener('click', () => {
  filterSidebar.classList.toggle('collapsed');
  filterToggle.textContent = filterSidebar.classList.contains('collapsed') ? '→' : '←';
});

// Initial load
moveUnderline(pages[0]);
loadPageImages({ page: [currentPage] });