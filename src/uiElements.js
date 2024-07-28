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
            this.element.appendChild($.configOptions[configItem].element);
        }
    }
}





class Canvas {
    constructor() {
        this.element = undefined;
        this.elements = [];
    }

    onClick(e) {
        this.rect = this.element.getBoundingClientRect();
        this.rect = { x: this.rect.x, y: this.rect.y, w: this.rect.width, h: this.rect.height };

        let x = e.offsetX;
        let y = e.offsetY;

        $.configBar.setConfigList([]);


        switch ($.toolManager.curTool) {
            case ToolType.None: break;
            case ToolType.Text:
                let element = new TextElement(x / this.rect.w * 100, (y - 10) / this.rect.h * 100);
                this.addElement(element, () => { element.element.focus();  console.log("asdasd") });
                break;
        }
        $.toolManager.setTool(ToolType.None);


    }

    init() {
        this.element = parseHTML(`<div class="canvas"></div>`); 
        this.element.addEventListener("click", (e) => this.onClick(e));
    }

    addElement(element, callback = () => { }) {
        this.elements.push(element);
        this.element.appendChild(this.elements[this.elements.length - 1].element);
        element.element.addEventListener("load", () => {
            element.config();
            callback();
        }, { once: true });



    }

    relativePos(x, y) {
        console.log(this);
        this.rect = this.element.getBoundingClientRect();
        this.rect = { x: this.rect.x, y: this.rect.y, w: this.rect.width, h: this.rect.height };
        return { x: x - this.rect.x, y: y - this.rect.y };
    }
}
