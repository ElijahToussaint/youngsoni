// generates the dates for the copyright footer
const pubDate = 2023
const currentYear = new Date().getFullYear()
var displayYear = document.getElementById('year')
if (pubDate == currentYear) {
    displayYear.innerText = currentYear
} else {
    displayYear.innerText = pubDate + ' - ' + currentYear
}