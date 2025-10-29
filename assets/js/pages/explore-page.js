import loadImages, { resizeGridItem } from '/assets/js/components/load-images.js';

const pages = document.querySelectorAll(".page");
const underline = document.querySelector(".underline");

function moveUnderline(p) {
    const { offsetLeft, offsetWidth } = p;
    const newWidth = offsetWidth / 2;
    const newLeft = offsetLeft + (offsetWidth / 2) - (newWidth / 2);

    underline.style.width = newWidth + 'px';
    underline.style.left = newLeft + 'px';
    p.style.color = "black";
}

let imageElements = [];
const grid = document.querySelector(".grid");
const infoScreen = document.querySelector(".image-info-screen");
const mainImage = document.querySelector(".placeholder-img");
const backButton = document.querySelector(".back-button");

// Load the first page (small) by default
loadPageImages("fyp");

// Move underline to first page
moveUnderline(pages[0]);

pages.forEach((p, index) => {
    p.addEventListener("click", async () => {
        moveUnderline(p);

        pages.forEach(page => (page.style.color = "rgb(91, 89, 89)"));
        p.style.color = "black";

        // Pick the size based on which page index
        let page;
        if (index === 0) page = "fyp";
        else if (index === 1) page = "friends";
        else if (index === 2) page = "brandoftheday";
        else if (index === 3) page = "following";
        else if (index === 4) page = "trending";
        await loadPageImages(page);

        grid.style.display = "grid";
        infoScreen.style.display = "none";
        mainImage.style.display = "none";
        mainImage.src = "/assets/images/icons/placeholder.jpg";
    });
});

async function loadPageImages(page) {
    // 🧹 Reset any old gallery/reel from previous tab
    const gallery = document.querySelector("#gallery");
    const imageInfoScreen = document.querySelector(".image-info-screen");
    const placeholderImg = document.querySelector(".placeholder-img");
    const reel = document.querySelector(".image-reel");
    
    // Remove old reel if it exists
    if (reel) reel.remove();

    // Reset placeholder and image info
    placeholderImg.src = "/assets/images/icons/placeholder.jpg";
    imageInfoScreen.classList.remove("active");

    // Load new images
    imageElements = await loadImages(page);
    imageElements.forEach((img) => {
        img.addEventListener("click", function () {
            grid.style.display = "none";
            infoScreen.style.display = "flex";

            mainImage.src = this.src;
            mainImage.style.display = "block";
        });
    });
}

backButton.addEventListener("click", function() {
    grid.style.display = "grid";
    infoScreen.style.display = "none";
    mainImage.style.display = "none";
    mainImage.src = "/assets/images/icons/placeholder.jpg";

    setTimeout(() => {
        imageElements.forEach(img => resizeGridItem(img));
    }, 50);
});

// Sidebar toggle
const filterToggle = document.getElementById('filterToggle');
const filterSidebar = document.querySelector('.filter-side-bar');
filterToggle.addEventListener('click', () => {
    filterSidebar.classList.toggle('collapsed');
    filterToggle.textContent = filterSidebar.classList.contains('collapsed') ? '→' : '←';
});
