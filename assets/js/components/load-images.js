function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export default async function loadImages(filterPage = null) {
    const response = await fetch("/data/images.json");
    let images = await response.json();

    // If the JSON is an array of objects, not strings
    if (images.length && typeof images[0] !== "string") {
        if (filterPage) {
            images = images.filter(img => img.page === filterPage);
        }

        images = shuffleArray(images);
    } else {
        images = shuffleArray(images);
    }

    const gallery = document.getElementById("gallery");
    gallery.innerHTML = ""; // clear existing images

    if (images.length === 0) {
        gallery.classList.add("no-images");
        const message = document.createElement("p");
        if (filterPage === "friends") message.textContent = "You currently have no friends added.";
        if (filterPage == "following") message.textContent = "You are not currently following any creators.";
        message.classList.add("no-medium-message");
        gallery.appendChild(message);
        return []; // stop here so nothing else runs
    } else {
        gallery.classList.remove("no-images");
    }

    const imageElements = [];

    images.forEach(imgData => {
        const src = typeof imgData === "string" ? imgData : imgData.url;
        const img = document.createElement("img");
        img.src = src;
        img.classList.add("grid-image");
        gallery.appendChild(img);
        imageElements.push(img);

        img.addEventListener("load", () => resizeGridItem(img));
    });

    window.addEventListener("resize", () => {
        imageElements.forEach(img => resizeGridItem(img));
    });

    const sidebar = document.querySelector('.filter-side-bar');
    if (sidebar) {
        const observer = new MutationObserver(() => {
            setTimeout(() => {
                imageElements.forEach(img => resizeGridItem(img));
            }, 100);
        });
        observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    }

    return imageElements;
}

function resizeGridItem(item) {
    const grid = document.getElementById("gallery");
    const rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
    const rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-row-gap'));
    const rowSpan = Math.ceil((item.getBoundingClientRect().height + rowGap) / (rowHeight + rowGap));
    item.style.gridRowEnd = "span " + rowSpan;
}

export { resizeGridItem };
