// assets/js/components/dropdown.js
let hideTimeout;
let dropdown;
let userButton;

export const showDropdown = () => {
  clearTimeout(hideTimeout);
  dropdown.style.display = 'block';
  userButton.style.transform = 'scale(1.3)';
  userButton.style.paddingTop = '0';
  userButton.style.paddingBottom = '0';
};

const hideDropdown = () => {
  dropdown.style.display = 'none';
  userButton.style.transform = 'scale(1)';
};

export const hideDropdownWithDelay = () => {
  hideTimeout = setTimeout(hideDropdown, 1000);
};

export function initDropdown() {
  userButton = document.getElementById('header-user-button');
  dropdown = document.querySelector('.dropdown-menu');
  const userIcons = document.querySelectorAll('.add-friend-button, .support-button, .region-button');

  if (!userButton || !dropdown) return; // if header not loaded yet

  userButton.addEventListener('mouseenter', showDropdown);
  userButton.addEventListener('mouseleave', hideDropdownWithDelay);
  dropdown.addEventListener('mouseenter', showDropdown);
  dropdown.addEventListener('mouseleave', hideDropdownWithDelay);
  userIcons.forEach(icon => icon.addEventListener('mouseenter', hideDropdown));
}