// format numerical value
function formatNumbers (value, decimals = 1) {
    // Nine Zeroes for Billions
    return Math.abs(Number(value)) >= 1.0e+9
    ? (Math.abs(Number(value)) / 1.0e+9).toFixed(2) + "B"

    // Six Zeroes for Millions 
    : Math.abs(Number(value)) >= 1.0e+6
    ? (Math.abs(Number(value)) / 1.0e+6).toFixed(decimals) + "M"

    // Three Zeroes for Thousands
    : Math.abs(Number(value)) >= 1.0e+3
    ? (Math.abs(Number(value)) / 1.0e+3).toFixed(0) + "K"

    : Math.abs(Number(value));
}

module.exports = {
    formatNumbers
  }