
function parseHTML(html) {
    let element = document.createElement("div");
    element.innerHTML = html;
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

let lastSelectedText = undefined;
let lastSelectedEvent = undefined;

class TextElement {
    constructor(x, y) {
        this.value = "";
        this.element = parseHTML(`<div contenteditable="true">0123456789ABCDEFG</div>`);
        this.element.classList = ["text-element"];
        this.element.style.position = "absolute";
        this.element.style.top = `${y}%`;
        this.element.style.left = `${x}%`;
        this.updateCanvas = () => { };


        this.element.addEventListener("mouseup", (e) => {
            // e.stopPropagation();
            if (getSelectedTextEvent()[0].length == 0) {
                lastSelectedText = undefined;
                lastSelectedEvent = undefined;
                return;
            }

            let [text, event] = getSelectedTextEvent();
            lastSelectedText = this;

            if (this.element.childNodes.length == 1) {
                lastSelectedEvent = {
                    lelem: event.baseNode.parentNode,
                    relem: event.extentNode.parentNode,
                    lbound: Math.min(event.baseOffset, event.extentOffset),
                    rbound: Math.max(event.baseOffset, event.extentOffset),
                    text: event.toString(),
                };
            } else if (event.baseNode.parentNode.getBoundingClientRect().x <= event.extentNode.parentNode.getBoundingClientRect().x) {
                lastSelectedEvent = {
                    lelem: event.baseNode.parentNode,
                    relem: event.extentNode.parentNode,
                    lbound: event.baseOffset,
                    rbound: event.extentOffset,
                    text: event.toString(),
                };
            } else {
                lastSelectedEvent = {
                    lelem: event.extentNode.parentNode,
                    relem: event.baseNode.parentNode,
                    lbound: event.extentOffset,
                    rbound: event.baseOffset,
                    text: event.toString(),
                };

            } {

            }




        });
        this.element.addEventListener("focusout", () => {
            this.element.setAttribute("contenteditable", false);
        });
        this.element.addEventListener("dblclick", () => {
            this.element.setAttribute("contenteditable", true);
            this.element.focus();
        });

    }

    inputArea() {
        return `<span contenteditable="true">${this.value}</span>`;
    }
    textArea() {
        return `<span>${this.value}</span>`;
    }


    config() {
        configBar.setConfigsOptions(this.element, [ConfigsType.TextSize]);
    }
}

ToolType = Object.freeze({ None: "None", Text: "Text" });
class ToolManager {

    constructor() {
        this.curTool = ToolType.None;
    }

    setTool(toolType) {
        switch (toolType) {
            case ToolType.None:
                this.curTool = ToolType.None;
                document.body.style.cursor = ""
                break;
            case ToolType.Text:
                this.curTool = ToolType.Text;
                document.body.style.cursor = "text";
                break;

        }
    }
}
class ToolsBar {
    constructor() {

    }

    init() {

    }


}

function getFontSize(elem) {
    return window.getComputedStyle(elem).fontSize.substring(0, window.getComputedStyle(elem).fontSize.length - 2);
}

const ConfigsType = Object.freeze({ TextSize: "TextSize" });
class ConfigBar {
    constructor() {
        this.activeConfigs = {};
        this.configs = {};
        this.activeElement = undefined;
    }


    init() {
        this.element = document.getElementById("config-bar");

        this.configs[ConfigsType.TextSize] = parseHTML(`<div class="config-item" id="text-config-item"><label> Size </label><input type="number"></div>`);
    }

    initConfigType(configType) {
        this.activeConfigs[configType] = this.configs[configType];
        switch (configType) {
            case ConfigsType.TextSize:
                let inputElement = this.activeConfigs[ConfigsType.TextSize].getElementsByTagName("input")[0];
                let fontSize = window.getComputedStyle(this.activeElement).fontSize.substring(0, window.getComputedStyle(this.activeElement).fontSize.length - 2);
                inputElement.defaultValue = fontSize;

                inputElement.addEventListener("change", (e) => {
                    let fontSize = window.getComputedStyle(this.activeElement).fontSize.substring(0, window.getComputedStyle(this.activeElement).fontSize.length - 2);
                    if (lastSelectedEvent == undefined) {
                        this.activeElement.style.fontSize = e.target.value + "px";
                    } else {
                        let lelem = lastSelectedEvent.lelem;
                        let relem = lastSelectedEvent.relem;
                        let lbound = lastSelectedEvent.lbound;
                        let rbound = lastSelectedEvent.rbound;
                        if (lelem == relem) {
                            lbound = Math.min(lastSelectedEvent.lbound, lastSelectedEvent.rbound);
                            rbound = Math.max(lastSelectedEvent.lbound, lastSelectedEvent.rbound);
                        }
                        let selectedText = lastSelectedEvent.text;
                        if (lelem.parentElement != undefined && lelem.parentElement.classList.contains("text-element")) {
                            let parentElem = lelem.parentElement;


                            let i = 0;
                            let leftSideTexts = [];
                            let middleSideTexts = [];
                            let rightSideTexts = [];

                            // left
                            for (i = 0; i < parentElem.childNodes.length; i++) {
                                if (parentElem.childNodes[i] == lelem) {
                                    break;
                                }
                                if (parentElem.childNodes[i].textContent) {
                                    leftSideTexts.push([parentElem.childNodes[i].textContent, getFontSize(parentElem.childNodes[i])]);
                                }
                            }
                            if (lelem.textContent.substring(0, lbound)) {
                                leftSideTexts.push([lelem.textContent.substring(0, lbound), getFontSize(lelem)]);
                            }

                            // middle
                            if (lelem != relem) {
                                if (lelem.textContent.substring(lbound)) { middleSideTexts.push([lelem.textContent.substring(lbound), getFontSize(lelem)]); }
                                i++;
                                for (i = i; i < parentElem.childNodes.length; i++) {
                                    if (parentElem.childNodes[i] == relem) {
                                        break;
                                    }
                                    if (parentElem.childNodes[i].textContent) {
                                        middleSideTexts.push([parentElem.childNodes[i].textContent, getFontSize(parentElem.childNodes[i])]);
                                    }
                                }
                                if (relem.textContent.substring(0, rbound)) { middleSideTexts.push([relem.textContent.substring(0, rbound), getFontSize(relem)]); }
                                i++;



                            } else {
                                if (selectedText) {
                                    middleSideTexts.push([selectedText, getFontSize(relem)]);
                                }
                                i++;
                            }
                            // right
                            if (relem.textContent.substring(rbound)) {
                                rightSideTexts.push([relem.textContent.substring(rbound), getFontSize(relem)]);
                            }


                            for (i = i; i < parentElem.childNodes.length; i++) {
                                if (parentElem.childNodes[i].textContent) {
                                    rightSideTexts.push([parentElem.childNodes[i].textContent, getFontSize(parentElem.childNodes[i])]);
                                }
                            }

                            while (parentElem.firstChild) {
                                parentElem.removeChild(parentElem.lastChild);
                            }

                            let maxFont = -1;
                            middleSideTexts.forEach((([text, size]) => {
                                if (size > maxFont) {
                                    maxFont = size;
                                }
                            }));
                            for (let [text, size] of leftSideTexts) {
                                parentElem.appendChild(parseHTML(`<span style="font-size: ${size}px">${text}</span>`))
                            }
                            parentElem.appendChild(parseHTML(`<span id="resizable-text" style="font-size: ${maxFont}px">${selectedText}</span>`))
                            for (let [text, size] of rightSideTexts) {
                                parentElem.appendChild(parseHTML(`<span style="font-size: ${size}px">${text}</span>`))
                            }
                            fontSize = maxFont;



                        } else {
                            let text = lelem.textContent;
                            while (lelem.firstChild) {
                                lelem.removeChild(lelem.lastChild);
                            }
                            if (text.substring(0, lastSelectedEvent.lbound)) {
                                lelem.appendChild(parseHTML(`<span>${text.substring(0, lastSelectedEvent.lbound)}</span>`))
                            }
                            if (selectedText) {
                                lelem.appendChild(parseHTML(`<span id="resizable-text">${selectedText}</span>`))
                            }
                            if (text.substring(lastSelectedEvent.lbound + selectedText.length)) {
                                lelem.appendChild(parseHTML(`<span>${text.substring(lastSelectedEvent.lbound + selectedText.length)}</span>`))
                            }
                        }
                        document.getElementById("resizable-text").style.fontSize = e.target.value + "px";

                    }
                    inputElement.defaultValue = fontSize;
                });



                break;
        }
    }
    setConfigsOptions(element, configsTypes) {
        this.activeElement = element;
        this.activeConfigs = {};
        for (let configsType of configsTypes) {
            this.initConfigType(configsType);
        }

        this.element.innerHTML = "";

        for (let type of Object.keys(this.activeConfigs)) {

            this.element.appendChild(this.activeConfigs[type]);
        }
    }
}


class AddSliderBtn {
    constructor() {
        this.element = undefined;
    }

    onAddSlider() {
        curState = CanvasState.Edit;
        this.element.style.display = "none";
    }

    init() {
        this.element = document.getElementById("add-slider-btn");
        this.element.addEventListener("click", this.onAddSlider);
        this.element.style.display = "none";
    }
}

class EditSlider {
    constructor() {
        this.element = undefined;
        this.elements = [];
    }

    onClick(e) {
        let rect = this.element.getBoundingClientRect();
        this.rect = { x: rect.x, y: rect.y, w: rect.width, h: rect.height };

        let x = e.offsetX;
        let y = e.offsetY;

        switch (toolManager.curTool) {
            case ToolType.None: break;
            case ToolType.Text:
                this.elements.push(new TextElement(x / this.rect.w * 100, (y - 10) / this.rect.h * 100));
                this.element.appendChild(this.elements[this.elements.length - 1].element);
                this.elements[this.elements.length - 1].element.focus();
                this.elements[this.elements.length - 1].config();
                this.elements[this.elements.length - 1].idx = this.elements.length - 1;
                this.elements[this.elements.length - 1].updateCanvas = (elem) => {
                    this.element.replaceChild(elem.element, this.element.children[elem.idx]);
                }
                toolManager.setTool(ToolType.None);
                break;
        }

    }

    init() {
        this.element = document.getElementById("edit-slider");
        this.element.addEventListener("click", (e) => this.onClick(e));
        this.element.style.display = "";

        curState = CanvasState.Edit;
    }
}

function toolBtnSelectText() {
    toolManager.setTool(ToolType.Text);
}


function init() {
    addSliderBtn.init();
    editSlider.init();
    configBar.init();
}


let CanvasState = Object.freeze({ New: "New", Edit: "Edit" });
let curState = CanvasState.New;


let toolManager = new ToolManager();


let toolsBar = new ToolsBar();
let configBar = new ConfigBar();

let addSliderBtn = new AddSliderBtn();
let editSlider = new EditSlider();





window.onload = init;
