
class DragManager {
    constructor() {
        this.element = undefined;
        this.canvasElement = undefined;

        document.addEventListener("mousemove", (e) => {
            e.stopPropagation();

            if (this.element == undefined) return;
            if (this.canvasElement == undefined) return;
            if (e.which == 0) {
                $.onUpdateCanvas();
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




const ToolType = Object.freeze({ None: "None", Text: "Text" });
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


class ImgPasteManager {
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
        let pos = $.canvas.relativePos($.mousePos.x, $.mousePos.y);
        $.canvas.addElement(new ImageElement(pos.x, pos.y, data));
        console.log("asdasd");
    }

}



class PreviewManager {
    constructor() {
        this.previewElem = undefined;
        this.editElem = undefined;


        this.previewBtnElem = undefined;
        this.previewCancelElem = undefined;
        this.previewCancelElemClone = undefined;


        this.canvas = undefined;
        this.shown = false;
    }

    init() {
        this.previewElem = document.getElementById("preview-area");
        this.previewElem.style.display = "none";

        this.editElem = document.getElementById("edit-area");
        document.addEventListener("keydown", (e) => this.onKeyDown(e));


        this.previewCancelElem = document.getElementById("preview-cancel");
        this.previewCancelElemClone = this.previewCancelElem.cloneNode(true);
        this.previewCancelElemClone.onclick = () => { this.toggleShown(false); }


        this.previewBtnElem = document.getElementById("preview-btn");
        this.previewBtnElem.onclick = () => this.preview();
    }



    onKeyDown(e) {
        if (!this.shown) return;
        if (e.key == "Escape") {
            toggleShown(false);
        }
    }

    toggleShown(force) {
        if(force != undefined) {
            this.shown = !force;
        }
        if (!this.shown) {
            this.editElem.style.display = "none";
            this.previewElem.style.display = "";
        } else if (this.shown) {
            this.editElem.style.display = "";
            this.previewElem.style.display = "none";
        }
        this.shown = !this.shown;

    }

    createElem(elem) {
        let shown = this.shown;
            this.toggleShown(false);
            let rect = this.canvas.getRect();
            let elemPos = elem.getScreenPosition();
            this.toggleShown(true);
            let curWidth = this.previewElem.getBoundingClientRect().width;
        this.toggleShown(shown);

        let scale = curWidth / rect.w;
        let relativePosition = { x: (elemPos.x - rect.x) / rect.w * 100, y: (elemPos.y - rect.y) / rect.h * 100 };


        let htmlElem = elem.element.cloneNode(true);
        htmlElem.style.position = "absolute";
        htmlElem.style.left = `${relativePosition.x}%`;
        htmlElem.style.top = `${relativePosition.y }%`;
        htmlElem.style.scale = `${scale}`;



        return htmlElem;
    }
    preview() {
        this.shown = true;

        this.canvas = $.canvas;
        clearElemNodes(this.previewElem);
        this.previewElem.appendChild(this.previewCancelElemClone);



        for (let elem of this.canvas.elements) {
            let htmlElem = this.createElem(elem);
            this.previewElem.appendChild(htmlElem);
        }

        this.toggleShown(true);

    }
}