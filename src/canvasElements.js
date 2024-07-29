const CanvasElem = Object.freeze({
    Elem: "Elem",
    TextElem: "TextElem",
    ImageElem: "ImageElem",
});


class Element {
    constructor(x, y) {
        this.element = undefined;
        this.type = CanvasElem.Elem;
    }

    onClick(e) { }
    onMouseDown(e) { }
    config() { }


    getScreenPosition() {
        let rect = this.element.getBoundingClientRect();
        return {x: rect.x , y: rect.y};
    }
}

class TextElement extends Element {
    constructor(x, y) {
        super(x, y);

        this.element = parseHTML(`<div  class="text-element" 
                                        contenteditable="true"
                                        style="position: absolute;top: ${y}%;left: ${x}%;">
                                        <span></span>
                                  </div>`);
        this.element.addEventListener("mousedown", (e) => this.onMouseDown(e));
        this.element.addEventListener("click", (e) => this.onClick(e));
        this.element.addEventListener("mouseup", (e) => this.onMouseUp(e));
        this.element.addEventListener("focusout", (e) => this.onFocusOut(e));
        this.element.addEventListener("dblclick", (e) => this.onDoubleClick(e));
        this.type = CanvasElem.TextElem;
    }



    onMouseUp(e) {
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

        }
    }
    onFocusOut(e) {
        this.element.setAttribute("contenteditable", false);
        this.element.classList.remove("text-element-unfoced");
        this.element.classList.add("text-element-unfoced");
        $.onUpdateCanvas();
    }
    onDoubleClick(e) {
        this.element.setAttribute("contenteditable", true);
        this.element.classList.remove("text-element-unfoced");
        this.element.focus();
    }

    onMouseDown(e) {
        if (!this.element.classList.contains("text-element-unfoced")) return;
        $.dragManager.element = this.element;
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

        $.onUpdateCanvas();
    }
    onWidthResize(e) {
        this.element.style.width = `${parseInt(e.target.value)}px`;
        $.onUpdateCanvas();
    }
    onClick(e) {
        e.stopPropagation();
        this.config();
    }

    config() {


        $.configOptions[ConfigsType.TextResize].config(this.element, getFontSize(this.element), (e) => this.onSelectionResize(e));
        $.configOptions[ConfigsType.WidthResize].config(this.element, parseInt(this.element.getBoundingClientRect().width), (e) => this.onWidthResize(e));
        $.configBar.setConfigList([ConfigsType.TextResize, ConfigsType.WidthResize]);
        $.onUpdateCanvas();
    }
}

class ImageElement extends Element {
    constructor(x, y, data) {
        super(x, y);
        this.data = data;
        this.element = parseHTML(`<img class="image-element" 
                                       src="${data}"
                                        style="
                                            position: absolute;
                                            top: ${y}px;
                                            left: ${x}px;
                                   "/>`);

        this.element.addEventListener("mousedown", (e) => this.onMouseDown(e));
        this.element.addEventListener("click", (e) => this.onClick(e));

        this.loaded = false;
        this.widthResizeEnabled = true;
        this.heightResizeEnabled = false;
        this.inputWidth = parseInt(this.element.getBoundingClientRect().width);
        this.inputHeight = parseInt(this.element.getBoundingClientRect().height);
        this.type = CanvasElem.ImageElem;


    }
    onMouseDown(e) {
        e.preventDefault();
        $.dragManager.element = this.element;
    }
    onClick(e) {
        e.stopPropagation();
        this.config();
    }


    onWidthResize(e) {
        this.inputWidth = `${parseInt(e.target.value)}px`;
        if (!this.widthResizeEnabled) return;
        this.element.style.width = `${parseInt(e.target.value)}px`;
        $.onUpdateCanvas();
    }
    onHeightResize(e) {
        this.inputHeight = `${parseInt(e.target.value)}px`;
        if (!this.heightResizeEnabled) return;
        this.element.style.height = `${parseInt(e.target.value)}px`;
        $.onUpdateCanvas();

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
        let self = this;
        function callback() {
            self.loaded = true;
            self.inputWidth = parseInt(self.element.getBoundingClientRect().width);
            self.inputHeight = parseInt(self.element.getBoundingClientRect().height);
            if (self.heightResizeEnabled) {
                self.element.style.height = `${parseInt(self.inputHeight)}px`;
            }
            if (self.widthResizeEnabled) {
                self.element.style.width = `${parseInt(self.inputWidth)}px`;
            }


            $.configOptions[ConfigsType.WidthResize].config(self.element, self.inputWidth, (e) => self.onWidthResize(e), false, true, (e) => self.disableWidthResize(e));
            $.configOptions[ConfigsType.HeightResize].config(self.element, self.inputHeight, (e) => self.onHeightResize(e), false, false, (e) => self.disableHeightResize(e));
            $.configBar.setConfigList([ConfigsType.WidthResize, ConfigsType.HeightResize]);
            $.onUpdateCanvas();
        }

        if (!this.loaded) {
            this.element.addEventListener("load", () => { callback(); }, { once: true });
        } else {
            callback();
        }

    }
}


