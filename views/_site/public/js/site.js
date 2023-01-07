// asynchronous function for the seach bar
function searchSite() {
    var input, filter, ul, li, a, i, txtValue, message;
    input = document.getElementById("myInput");
    filter = input.value.toUpperCase();
    ul = document.getElementById("myUL");
    li = ul.getElementsByTagName("li");
    message = document.getElementById('messageSearch');
    if (filter == '') {
        ul.classList.add('d-none');
        message.classList.remove('d-none');
        message.innerText = 'Enter a keyword above to search this site\'s pages.';
    } else {
        for (i = 0; i < li.length; i++) {
            a = li[i].getElementsByTagName("div")[0];
            txtValue = a.textContent || a.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                li[i].style.display = "";
                ul.classList.remove('d-none');
                message.classList.add('d-none');
            } else {
                li[i].style.display = "none";
                ul.classList.add('d-none');
                message.classList.remove('d-none');
                message.innerText = 'No search results found.';
            }
        }
    }
}
// copy text to clipboard
function copyToClipboard(target) {
    // get the text field
    var copyText = document.getElementById(target);
    var toast = document.getElementById('toast')
    var toastHeading = document.getElementById('toast-heading')
    var toastBody = document.getElementById('toast-body')
    // select the text field
    copyText.select();
    copyText.setSelectionRange(0, 99999); // For mobile devices
    // copy the text inside the text field
    navigator.clipboard.writeText(copyText.value);
    // create toast for copied text
    var toast = new bootstrap.Toast(toast)
    toastHeading.innerText = 'Copied to clipboard'
    toastBody.innerText = copyText.value
    toast.show()
}
// generate share links
if (window.location.href.indexOf("post") > -1) {
    // sets share link input
    var linkInput = document.getElementById('shareLink')
    linkInput.setAttribute("id", location.origin + location.pathname)
    linkInput.setAttribute("value", location.origin + location.pathname)
    // sets share button and copies link text
    var shareButton = document.getElementById('shareButton')
    shareButton.setAttribute('onclick', 'copyToClipboard(' + "'" + location.origin + location.pathname + "'" + ')')
}
// generate copyright dates
const pubDate = 2023
const currentYear = new Date().getFullYear()
var displayYear = document.getElementById('year')
if (pubDate == currentYear) {
    displayYear.innerText = currentYear
} else {
    displayYear.innerText = pubDate + ' - ' + currentYear
}