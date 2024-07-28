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

let lastSelectedEvent = undefined;


class AppState {
    constructor() {
        // managers
        this.toolManager = new ToolManager();
        this.dragManager = new DragManager();
        this.imgPasteManager = new ImgPasteManager();

        // ui
        this.canvasContainerElem = undefined;
        this.tabsElem = undefined; 
        this.selectedTabElem = undefined;

        this.toolsBar = new ToolsBar();
        this.configBar = new ConfigBar();
        this.canvasList = [];
        this.canvas = this.canvasList[0];
        this.configOptions = {
            TextResize : new InputArea(IconPath.TextResize),
            WidthResize : new InputArea(IconPath.WidthResize),
            HeightResize : new InputArea(IconPath.HeightResize),
        };

        // globals
        this.mousePos = {x : 0, y : 0};

        // events
        window.addEventListener("load",() => this.onLoad());
        document.addEventListener("mousemove",(e) => this.onMouseMove(e));
    }
    onLoad() {
        this.configBar.init();
        this.dragManager.init();
        
        this.canvasContainerElem = document.getElementById("canvas-container");
        this.tabsElem = document.getElementById("tabs-container");
        this.addCanvas();
    }
    onMouseMove(e) {
        this.mousePos.x =  e.pageX;
        this.mousePos.y =  e.pageY;
    }

    setCanvas(canvas) {
        this.canvas = canvas;
        this.dragManager.canvasElement = canvas.element;
        clearElemNodes(this.canvasContainerElem);
        this.canvasContainerElem.appendChild(this.canvas.element);
    }

    async onUpdateCanvas() {
        let data = (await html2canvas(this.canvas.element)).toDataURL();
        this.selectedTabElem.setAttribute("src",data);
    }

    addCanvas() {
        let canvas = new Canvas();
        canvas.init();
        this.canvasList.push(canvas);

        const elem = parseHTML(`<img class="tab"/>`);
        if(this.selectedTabElem == undefined) {
            this.selectedTabElem = elem;
            this.selectedTabElem.classList.add("selected-tab");
            this.setCanvas(canvas)
        }
        elem.addEventListener("click",() => {
            if(this.selectedTabElem) { this.selectedTabElem.classList.remove("selected-tab"); }
            this.selectedTabElem = elem;
            this.selectedTabElem.classList.add("selected-tab");

            this.setCanvas(canvas)
        });
        this.tabsElem.appendChild(elem);
    }


}

var $ = new AppState();


