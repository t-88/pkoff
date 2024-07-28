
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
const ConfigsType = Object.freeze({
    TextResize: "TextResize",
    WidthResize: "WidthResize",
    HeightResize: "HeightResize",
});
const IconPath = {
    TextResize: "assets/font.png",
    WidthResize: "assets/horizontal.png",
    HeightResize: "assets/vertical.png",
};

let ToolType = Object.freeze({ None: "None", Text: "Text" });
let lastSelectedEvent = undefined;
let mousePos = { x: 0, y: 0 };

let curTab = undefined;


class InputArea {
    constructor(icon) {
        this.element = parseHTML(`
            <div class="input-area-box">
                <img src="${icon}"/>
                <input class="number-input" type="number" value="0"/>
                <input   type="checkbox" />
            </div>
        `);

        this.onChange = () => { };
        this.onToggleCheckbox = () => { };
        this.connectedElem = undefined;
        this.element.getElementsByTagName("input")[0].addEventListener("change", (e) => { this.onChange(e); });
        this.element.getElementsByTagName("input")[1].addEventListener("change", (e) => { this.onToggleCheckbox(e); });
    }

    setDefualtValue(value) {
        this.element.getElementsByTagName("input")[0].value = value;
        this.element.getElementsByTagName("input")[0].defaultValue = value;
    }
    config(element, defaultVal, onChangeCallback, disableCheckbox = true, checkboxDefaultVal = false, onToggleCheckbox = () => { }) {
        this.connectedElem = element;
        this.setDefualtValue(defaultVal)
        this.onChange = onChangeCallback;

        if (checkboxDefaultVal) { this.element.getElementsByTagName("input")[1].setAttribute("checked", checkboxDefaultVal); }
        this.element.getElementsByTagName("input")[1].style.display = disableCheckbox ? "none" : "";
        this.onToggleCheckbox = onToggleCheckbox;
    }
}

class DragManager {
    constructor() {
        this.element = undefined;
        this.canvasElement = undefined;

        document.addEventListener("mousemove", (e) => {
            e.stopPropagation();
            mousePos.x = e.pageX;
            mousePos.y = e.pageY;

            if (this.element == undefined) return;
            if (this.canvasElement == undefined) return;
            if (e.which == 0) {
                this.element = undefined;
                return;
            }

            let canvasRect = this.canvasElement.getBoundingClientRect();
            canvasRect = { x: canvasRect.x, y: canvasRect.y, w: canvasRect.width, h: canvasRect.height };
            let elementRect = this.element.getBoundingClientRect();
            elementRect = { x: elementRect.x, y: elementRect.y, w: elementRect.width, h: elementRect.height };


            this.element.style.left = `${e.pageX - canvasRect.x - elementRect.w / 2}px`;
            this.element.style.top = `${e.pageY - canvasRect.y - elementRect.h / 2}px`;
        });
    }

    init(canvasElement) {
        this.canvasElement = canvasElement;
    }
}

class TextElement {
    constructor(x, y) {
        this.value = "";
        this.element = parseHTML(`<div contenteditable="true"><span>0123456789ABCDEFG</span></div>`);
        this.element.classList = ["text-element"];
        this.element.style.position = "absolute";
        this.element.style.top = `${y}%`;
        this.element.style.left = `${x}%`;
        this.updateCanvas = () => { };

        this.element.addEventListener("mousedown", (e) => {
            if (!this.element.classList.contains("text-element-unfoced")) return;
            dragManager.element = this.element;
        });

        this.element.addEventListener("mouseup", (e) => {
            e.stopPropagation();
            if (getSelectedTextEvent()[0].length == 0) {
                lastSelectedEvent = undefined;
                return;
            }

            let [_, event] = getSelectedTextEvent();

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
            this.element.classList.remove("text-element-unfoced");
            this.element.classList.add("text-element-unfoced");
        });
        this.element.addEventListener("dblclick", () => {
            this.element.setAttribute("contenteditable", true);
            this.element.classList.remove("text-element-unfoced");

            this.element.focus();
        });

        this.element.addEventListener("click", (e) => {
            e.stopPropagation();
            this.config();
        });
    }

    onSelectionResize(e) {

        // no text selected to resize
        if (lastSelectedEvent == undefined) {
            this.element.innerHTML = this.element.textContent;
            this.element.style.fontSize = e.target.value + "px";
            return;
        }

        let fontSize = getFontSize(this.element);

        let lelem = lastSelectedEvent.lelem;
        let relem = lastSelectedEvent.relem;
        let lbound = lastSelectedEvent.lbound;
        let rbound = lastSelectedEvent.rbound;
        let selectedText = lastSelectedEvent.text;


        let selectionInSameSpan = lelem == relem;
        if (selectionInSameSpan) {
            lbound = Math.min(lastSelectedEvent.lbound, lastSelectedEvent.rbound);
            rbound = Math.max(lastSelectedEvent.lbound, lastSelectedEvent.rbound);
        }

        if (lelem.parentElement == this.element) {

            let parentElem = this.element;

            let i = 0;
            let leftSideTexts = [];
            let middleSideTexts = [];
            let rightSideTexts = [];

            // left
            for (i = 0; i < parentElem.childNodes.length; i++) {
                if (parentElem.childNodes[i] == lelem) {
                    if (lelem.textContent.substring(0, lbound)) {
                        leftSideTexts.push([lelem.textContent.substring(0, lbound), parseFontSize(lelem)]);
                    }
                    break;
                }
                if (parentElem.childNodes[i].textContent) {
                    leftSideTexts.push([parentElem.childNodes[i].textContent, parseFontSize(parentElem.childNodes[i])]);
                }
            }


            // middle
            if (selectionInSameSpan) {
                if (selectedText) {
                    middleSideTexts.push([selectedText, parseFontSize(relem)]);
                }
                i++;
            } else {
                if (lelem.textContent.substring(lbound)) {
                    middleSideTexts.push([lelem.textContent.substring(lbound), parseFontSize(lelem)]);
                }

                i++;
                for (i = i; i < parentElem.childNodes.length; i++) {
                    if (parentElem.childNodes[i] == relem) {
                        if (relem.textContent.substring(0, rbound)) {
                            middleSideTexts.push([relem.textContent.substring(0, rbound), parseFontSize(relem)]);
                        }
                        break;
                    }
                    if (parentElem.childNodes[i].textContent) {
                        middleSideTexts.push([parentElem.childNodes[i].textContent, parseFontSize(parentElem.childNodes[i])]);
                    }
                }
                i++;
            }

            // right
            if (relem.textContent.substring(rbound)) {
                rightSideTexts.push([relem.textContent.substring(rbound), parseFontSize(relem)]);
            }

            for (i = i; i < parentElem.childNodes.length; i++) {
                if (parentElem.childNodes[i].textContent) {
                    rightSideTexts.push([parentElem.childNodes[i].textContent, parseFontSize(parentElem.childNodes[i])]);
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
    onWidthResize(e) {
        this.element.style.width = `${parseInt(e.target.value)}px`;
    }

    config() {
        configElements[ConfigsType.TextResize].config(this.element, getFontSize(this.element), (e) => this.onSelectionResize(e));
        configElements[ConfigsType.WidthResize].config(this.element, parseInt(this.element.getBoundingClientRect().width), (e) => this.onWidthResize(e));
        configBar.setConfigList([ConfigsType.TextResize, ConfigsType.WidthResize]);
    }
}

class ImageElement {
    constructor(x, y, data) {
        this.data = data;
        this.element = parseHTML(`<img class="image-element" src="${data}"/>`);
        this.element.style.position = "absolute";
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.widthResizeEnabled = true;
        this.heightResizeEnabled = false;
        this.inputWidth = parseInt(this.element.getBoundingClientRect().width);
        this.inputHeight = parseInt(this.element.getBoundingClientRect().height);

        this.element.addEventListener("mousedown", (e) => {
            e.preventDefault();
            dragManager.element = this.element;
        });
        this.element.addEventListener("click", (e) => {
            e.stopPropagation();
            this.config();
        });
    }

    onWidthResize(e) {
        this.inputWidth = `${parseInt(e.target.value)}px`;
        if (!this.widthResizeEnabled) return;
        this.element.style.width = `${parseInt(e.target.value)}px`;
    }
    onHeightResize(e) {
        this.inputHeight = `${parseInt(e.target.value)}px`;
        if (!this.heightResizeEnabled) return;
        this.element.style.height = `${parseInt(e.target.value)}px`;
    }
    disableWidthResize(e) {
        this.widthResizeEnabled = e.target.checked;
        if (this.widthResizeEnabled) {
            this.element.style.width = this.inputWidth;
        } else {
            this.element.style.width = "";
        }
    }
    disableHeightResize(e) {
        this.heightResizeEnabled = e.target.checked;
        if (this.heightResizeEnabled) {
            this.element.style.height = this.inputHeight;
        } else {
            this.element.style.height = "";
        }

    }

    config() {
        this.inputWidth = parseInt(this.element.getBoundingClientRect().width);
        this.inputHeight = parseInt(this.element.getBoundingClientRect().height);
        if (this.heightResizeEnabled) {
            this.element.style.height = `${parseInt(this.inputHeight)}px`;
        }
        if (this.widthResizeEnabled) {
            this.element.style.width = `${parseInt(this.inputWidth)}px`;
        }




        configElements[ConfigsType.WidthResize].config(this.element, this.inputWidth, (e) => this.onWidthResize(e), false, true, (e) => this.disableWidthResize(e));
        configElements[ConfigsType.HeightResize].config(this.element, this.inputHeight, (e) => this.onHeightResize(e), false, false, (e) => this.disableHeightResize(e));
        configBar.setConfigList([ConfigsType.WidthResize, ConfigsType.HeightResize]);

    }
}



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




                break;
        }
    }

    setConfigList(configList) {
        while (this.element.firstChild) {
            this.element.removeChild(this.element.firstChild);
        }
        for (let configItem of configList) {
            this.element.appendChild(configElements[configItem].element);
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
        this.rect = this.element.getBoundingClientRect();
        this.rect = { x: this.rect.x, y: this.rect.y, w: this.rect.width, h: this.rect.height };

        let x = e.offsetX;
        let y = e.offsetY;

        configBar.setConfigList([]);


        switch (toolManager.curTool) {
            case ToolType.None: break;
            case ToolType.Text:
                this.addElement(new TextElement(x / this.rect.w * 100, (y - 10) / this.rect.h * 100), () => {
                    this.elements[this.elements.length - 1].element.focus();

                })
                break;
        }
        toolManager.setTool(ToolType.None);


    }

    init() {
        this.element = document.getElementById("edit-slider");
        this.element.addEventListener("click", (e) => this.onClick(e));
        this.element.style.display = "";

        curState = CanvasState.Edit;
    }

    addElement(element, callback = () => { }) {
        this.elements.push(element);
        this.element.appendChild(this.elements[this.elements.length - 1].element);
        element.element.addEventListener("load", () => {
            element.config()
            callback();
        }, { once: true });



        this.canvasChanged();
    }

    async canvasChanged()  {
        let data =  (await html2canvas(this.element)).toDataURL();
        curTab.setAttribute("src",data);
    }

    relativePos(x, y) {
        this.rect = this.element.getBoundingClientRect();
        this.rect = { x: this.rect.x, y: this.rect.y, w: this.rect.width, h: this.rect.height };
        return { x: x - this.rect.x, y: y - this.rect.y };
    }
}

function toolBtnSelectText() {
    toolManager.setTool(ToolType.Text);
}


class ImgPaste {
    constructor() {
        document.addEventListener("paste", (e) => this.onPaste(e));
    }
    onPaste(e) {
        const clipboardData = e.clipboardData || window.clipboardData;
        for (let file of clipboardData.files) {
            if (file.type != "image/png") return;

            var fileReader = new FileReader();
            fileReader.addEventListener('load', () => this.onReadImgData(fileReader));
            fileReader.readAsDataURL(file);
        }
    }
    onReadImgData(fr) {
        let data = fr.result;
        let pos = editSlider.relativePos(mousePos.x, mousePos.y);
        editSlider.addElement(new ImageElement(pos.x, pos.y, data));
    }

}

function init() {
    addSliderBtn.init();
    editSlider.init();
    configBar.init();
    dragManager.init(editSlider.element);

    configElements[ConfigsType.TextResize] = new InputArea(IconPath.TextResize);
    configElements[ConfigsType.WidthResize] = new InputArea(IconPath.WidthResize);
    configElements[ConfigsType.HeightResize] = new InputArea(IconPath.HeightResize);


    curTab = document.getElementById("tabs").querySelectorAll(".tab")[0];

}


let CanvasState = Object.freeze({ New: "New", Edit: "Edit" });
let curState = CanvasState.New;


let toolManager = new ToolManager();
let dragManager = new DragManager();
let imgPaste = new ImgPaste();


let toolsBar = new ToolsBar();
let configElements = {};

let configBar = new ConfigBar();

let addSliderBtn = new AddSliderBtn();
let editSlider = new EditSlider();





window.onload = init;
