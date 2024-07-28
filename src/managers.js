
class DragManager {
    constructor() {
        this.element = undefined;
        this.canvasElement = undefined;

        document.addEventListener("mousemove", (e) => {
            e.stopPropagation();

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
    }

}

