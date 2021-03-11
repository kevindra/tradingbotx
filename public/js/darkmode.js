$("a[href='#']").on('click', function (e) {
  e.preventDefault();
});

var tooltipTriggerList = [].slice.call(
  document.querySelectorAll('[data-bs-toggle="tooltip"]')
);
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl);
});

var popoverTriggerList = [].slice.call(
  document.querySelectorAll('[data-bs-toggle="popover"]')
);
var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
  return new bootstrap.Popover(popoverTriggerEl);
});

var darkMode = document.getElementById('darkMode');

var darkLabel = 'darkModeLabel';
var darkLang = 'Dark';
var lightLang = 'Light';

// var imgID = "logo";
// var darkImg = "/public/images/dark.png";
// var lightImg = "/public/images/light.png";

window.addEventListener('load', function () {
  if (darkMode) {
    initTheme();
    darkMode.addEventListener('change', function () {
      resetTheme();
    });
  }
});

function initTheme() {
  var darkThemeSelected =
    localStorage.getItem('darkMode') !== null &&
    localStorage.getItem('darkMode') === 'dark';
  darkMode.checked = darkThemeSelected;
  darkThemeSelected
    ? document.body.setAttribute('data-theme', 'dark')
    : document.body.removeAttribute('data-theme');
  // darkThemeSelected ? document.getElementById(imgID).src = darkImg : document.getElementById(imgID).src = lightImg;
  darkThemeSelected
    ? (document.getElementById(darkLabel).innerHTML = darkLang)
    : (document.getElementById(darkLabel).innerHTML = lightLang);

  darkThemeSelected
    ? (document.getElementsByTagName('nav')[0].className =
        'navbar navbar-expand-lg navbar-dark bg-white')
    : (document.getElementsByTagName('nav')[0].className =
        'navbar navbar-expand-lg navbar-dark bg-dark');
}

function resetTheme() {
  if (darkMode.checked) {
    document.body.setAttribute('data-theme', 'dark');
    localStorage.setItem('darkMode', 'dark');
    // document.getElementById(imgID).src = darkImg;
    document.getElementById(darkLabel).innerHTML = darkLang;
    document.getElementsByTagName('nav')[0].className =
      'navbar navbar-expand-lg navbar-dark bg-white';
  } else {
    document.body.removeAttribute('data-theme');
    localStorage.removeItem('darkMode');
    // document.getElementById(imgID).src = lightImg;
    document.getElementById(darkLabel).innerHTML = lightLang;
    document.getElementsByTagName('nav')[0].className =
      'navbar navbar-expand-lg navbar-dark bg-dark';
  }
}
