import { loadHeader } from '../components/header.js';
loadHeader();

document.getElementById('header-placeholder').innerHTML = data;

const header_buttons = document.querySelectorAll(".new-page-button")
const pages = ["homepage.html", "explore.html", "build-outfit.html", "virtual-wardrobe.html", 
        "putons.html", "find-item.html", "sales-discounts.html"
]

header_buttons.forEach((el, i) => {
    el.addEventListener("click", function() {
        window.location.href = pages[i]; // Replace with your page URL
    });
})