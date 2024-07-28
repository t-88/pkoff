function parseHTML(html) {
    let element = document.createElement("div");
    element.innerHTML = html.trim();
    return element.firstChild;
}
function getSelectedTextEvent() {
    let event = undefined;
    let text = "";
    if (window.getSelection) {
        event = window.getSelection();
        text = window.getSelection().toString();
    } else if (document.selection) {
        event = document.selection;
        text = document.selection.createRange().text;
    }
    return [text, event];
}
function getFontSize(elem) {
    return window.getComputedStyle(elem).fontSize.substring(0, window.getComputedStyle(elem).fontSize.length - 2);
}
function parseFontSize(elem) {
    return elem.style.fontSize.substring(0, elem.style.fontSize.length - 2);
}


function clearElemNodes(elem) {
    while(elem.firstChild) {
        elem.removeChild(elem.lastChild);
    }
}