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

// ============================================
// URL STATE MANAGEMENT
// ============================================

/**
 * Updates the URL with the current tab and post URL
 */
function updateUrlWithPost(imageUrl) {
  const url = new URL(window.location);
  
  // Always save the current tab
  url.searchParams.set('tab', currentPage);
  
  if (imageUrl) {
    // Encode the image URL to be URL-safe
    const encodedUrl = encodeURIComponent(imageUrl);
    url.searchParams.set('post', encodedUrl);
  } else {
    url.searchParams.delete('post');
  }
  window.history.pushState({}, '', url);
}

/**
 * Updates the URL with just the tab (no post)
 */
function updateUrlWithTab(tab) {
  const url = new URL(window.location);
  url.searchParams.set('tab', tab);
  url.searchParams.delete('post'); // Clear post when changing tabs
  window.history.pushState({}, '', url);
}

/**
 * Gets the post URL from the URL parameters
 */
function getPostUrlFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const encodedUrl = params.get('post');
  return encodedUrl ? decodeURIComponent(encodedUrl) : null;
}

/**
 * Gets the active tab from URL parameters
 */
function getTabFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('tab') || 'fyp';
}

/**
 * Finds the index of an image by its URL
 */
function findImageIndexByUrl(imageUrl) {
  return imageElements.findIndex(img => {
    // Compare the src, accounting for potential domain differences
    const imgSrc = img.src.replace(window.location.origin, '');
    const targetSrc = imageUrl.replace(window.location.origin, '');
    return imgSrc === targetSrc;
  });
}

/**
 * Opens a specific post by its URL
 */
function openPostByUrl(imageUrl) {
  const index = findImageIndexByUrl(imageUrl);
  
  if (index === -1) {
    console.warn('Post not found in current images:', imageUrl);
    updateUrlWithPost(null);
    return;
  }
  
  // Trigger the click event on the image
  const img = imageElements[index];
  if (img) {
    img.click();
  }
}

/**
 * Restores the tab from URL on page load
 */
function restoreTabFromUrl() {
  const savedTab = getTabFromUrl();
  const tabIndex = PAGE_MAP.indexOf(savedTab);
  
  if (tabIndex !== -1) {
    currentPage = savedTab;
    
    // Update UI to reflect the active tab
    pages.forEach((pg, idx) => {
      if (idx === tabIndex) {
        pg.style.color = "black";
        moveUnderline(pg);
      } else {
        pg.style.color = "rgb(91, 89, 89)";
      }
    });
  }
}

/**
 * Restores the post view from URL on page load
 */
async function restorePostFromUrl() {
  const postUrl = getPostUrlFromUrl();
  
  if (postUrl) {
    // Wait a bit for images to load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    openPostByUrl(postUrl);
  }
}

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
  
  // Clear URL parameter when closing post view
  updateUrlWithPost(null);
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

  imageElements.forEach((img, index) => {
    img.addEventListener("click", () => {
      grid.style.display = "none";
      infoScreen.style.display = "flex";
      mainImage.src = img.src;
      mainImage.style.display = "block";
      
      // Update URL with current post URL (unique identifier)
      updateUrlWithPost(img.src);
    });
  });
  
  // After images load, check if we need to restore a post from URL
  restorePostFromUrl();
}

// ---- Page Click ----
pages.forEach((p, index) => {
  p.addEventListener("click", async () => {
    pages.forEach(pg => pg.style.color = "rgb(91, 89, 89)");
    p.style.color = "black";
    moveUnderline(p);

    currentPage = PAGE_MAP[index];
    
    // Update URL with new tab
    updateUrlWithTab(currentPage);
    
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

// ---- Handle Browser Back/Forward Buttons ----
window.addEventListener('popstate', () => {
  const savedTab = getTabFromUrl();
  const postUrl = getPostUrlFromUrl();
  
  // First, restore the correct tab if it changed
  if (savedTab !== currentPage) {
    const tabIndex = PAGE_MAP.indexOf(savedTab);
    if (tabIndex !== -1) {
      currentPage = savedTab;
      
      // Update UI
      pages.forEach((pg, idx) => {
        if (idx === tabIndex) {
          pg.style.color = "black";
          moveUnderline(pg);
        } else {
          pg.style.color = "rgb(91, 89, 89)";
        }
      });
      
      // Reload images for the new tab
      loadPageImages(getSelectedFilters());
    }
  }
  
  // Then handle post state
  if (postUrl) {
    // User navigated back to a post view
    setTimeout(() => openPostByUrl(postUrl), 500);
  } else {
    // User navigated back to grid view
    resetView();
    setTimeout(() => imageElements.forEach(resizeGridItem), 50);
  }
});

// Initial load
moveUnderline(pages[0]);

// Restore tab from URL, then load images for that tab
restoreTabFromUrl();
loadPageImages({ page: [currentPage] });