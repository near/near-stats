//set the document into light or dark mode
function setTheme(themeName) {
  localStorage.setItem('theme', themeName);
  document.documentElement.className = themeName;
}

// maintain previous dark/light mode setting on reload
function keepTheme(setChecked) {
  if (localStorage.getItem('theme')) {
    if (localStorage.getItem('theme') === 'theme-dark') {
      setTheme('theme-dark');
      setChecked(true)
    } else if (localStorage.getItem('theme') === 'theme-light') {
      setTheme('theme-light')
      setChecked(false)
    }
  } else {
    setTheme('theme-light')
    setChecked(false)
  }
}

module.exports = {
  setTheme,
  keepTheme
}