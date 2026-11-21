import { app } from "../../scripts/app.js";

const THEMES = [
    "cyberpunk", "steampunk", "minimal", "glass", "retro",
    "futuristic", "gaming", "dark", "nature", "cartoon",
    "vaporwave", "brutalist", "material", "neumorphism", "skeuomorphic"
];

const SHAPES = ["big_integer", "vertical_slider", "horizontal_slider"];

const THEME_DEFAULTS = {
    cyberpunk: { color: "#ff00ff", title: "Cyberpunk" },
    steampunk: { color: "#b57c48", title: "Steampunk" },
    minimal: { color: "#888888", title: "Minimal" },
    glass: { color: "#ffffff", title: "Glass" },
    retro: { color: "#c9a87c", title: "Retro" },
    futuristic: { color: "#00aaff", title: "Futuristic" },
    gaming: { color: "#ff0066", title: "Gaming" },
    dark: { color: "#0ff", title: "Dark" },
    nature: { color: "#6b8e4c", title: "Nature" },
    cartoon: { color: "#ffcc00", title: "Cartoon" },
    vaporwave: { color: "#ff7eb3", title: "Vaporwave" },
    brutalist: { color: "#000000", title: "Brutalist" },
    material: { color: "#6200ee", title: "Material" },
    neumorphism: { color: "#b0b0b0", title: "Neumorphism" },
    skeuomorphic: { color: "#f00", title: "Skeuomorphic" }
};

const MagikBigIntegerExtension = {
    name: "CRT.MagikBigInteger.UI",

    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "MagikBigIntegerNode") return;

        const onNodeCreated = nodeType.prototype.onNodeCreated;

        nodeType.prototype.onNodeCreated = function () {
            onNodeCreated?.apply(this, arguments);

            // Initialize properties
            this._initProperties();

            // Create UI structure
            this._createUI();

            // Set up event listeners
            this._setupEventListeners();

            // Load CSS
            this._loadCSS();

            // Apply initial theme/shape
            this._applyTheme(this.themeWidget.value);
            this._applyShape(this.shapeWidget.value);

            // Initial visual sync
            this._syncAllVisuals();

            // Set up resize observer
            this._setupResizeObserver();
        };

        // ----- Helper methods -----
        nodeType.prototype._initProperties = function () {
            this.bgcolor = "purple";
            this.title = "";

            // Find the widget by its new name "bigIntegerValue"
            const bigIntegerValueWidget = this.widgets.find(w => w.name === "bigIntegerValue"); // <-- changed
            console.log("🔍 bigIntegerValueWidget.options:", JSON.stringify(bigIntegerValueWidget.options, null, 2));
            console.log("🔍 bigIntegerValueWidget.options.step:", bigIntegerValueWidget.options.step);
            console.log("🔍 bigIntegerValueWidget.options.step2:", bigIntegerValueWidget.options.step2);
            console.log("🔍 this.properties before merge:", JSON.stringify(this.properties));
            bigIntegerValueWidget.hidden = true;
            this.bigIntegerValueWidget = bigIntegerValueWidget; // <-- store with new name

            // Hidden widgets for serialization
            this.themeWidget = this.addWidget("hidden", "theme", "cyberpunk", (v) => this._applyTheme(v), { hidden: true });
            this.shapeWidget = this.addWidget("hidden", "shape", "big_integer", (v) => this._applyShape(v), { hidden: true });

            this.properties = this.properties || {};
            this.properties.title = this.properties.title || "";
            this.properties.color = this.properties.color || "#0fff00";
            // Read from bigIntegerValueWidget.options
            this.properties.min = this.properties.min ?? bigIntegerValueWidget.options.min ?? 1;
            this.properties.max = this.properties.max ?? bigIntegerValueWidget.options.max ?? 250;
            this.properties.stepper = this.properties.stepper ?? 1;
            this.properties.precision = 0;
            // Slider track width in px for the slider shapes (0 = auto)
            this.properties.slider_width = this.properties.slider_width ?? 0;

            // Assign directly: the LiteGraph constructor pre-sets a default
            // size, so `this.size || ...` would never apply. Saved workflows
            // still restore their own size later via onConfigure.
            this.size = [875, 1000];
        };

        nodeType.prototype._loadCSS = function () {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.type = "text/css";
            link.href = new URL("./magik_big_integer_widget.css", import.meta.url).href;
            document.head.appendChild(link);
        };

        nodeType.prototype._createUI = function () {
            // Main wrapper
            const wrapper = document.createElement("div");
            wrapper.className = "magik-big-integer-wrapper";
            wrapper.style.position = 'absolute';
            wrapper.style.top = '0';
            wrapper.style.left = '0';
            wrapper.style.width = '100%';
            wrapper.style.height = '100%';
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.alignItems = 'center';
            wrapper.style.justifyContent = 'flex-start';
            wrapper.style.pointerEvents = 'none';
            wrapper.tabIndex = 0; // Make focusable for keyboard

            // Header
            const header = document.createElement("div");
            header.className = "magik-big-integer-header";

            const titleDisplay = document.createElement("div");
            titleDisplay.className = "magik-big-integer-title";
            header.appendChild(titleDisplay);

            const settingsBtn = document.createElement("button");
            settingsBtn.className = "magik-big-integer-btn";
            settingsBtn.innerHTML = "⚙";
            header.appendChild(settingsBtn);

            // MIN/MAX controls in the main panel (full-width strip below the header)
            const minMaxContainer = document.createElement("div");
            minMaxContainer.className = "magik-big-integer-minmax";

            const minLabel = document.createElement("label");
            minLabel.textContent = "MIN";
            const minInput = document.createElement("input");
            minInput.type = "number";
            minInput.step = "1";
            minInput.value = this.properties.min;

            const maxLabel = document.createElement("label");
            maxLabel.textContent = "MAX";
            const maxInput = document.createElement("input");
            maxInput.type = "number";
            maxInput.step = "1";
            maxInput.value = this.properties.max;

            minMaxContainer.appendChild(minLabel);
            minMaxContainer.appendChild(minInput);
            minMaxContainer.appendChild(maxLabel);
            minMaxContainer.appendChild(maxInput);

            wrapper.appendChild(header);
            wrapper.appendChild(minMaxContainer);

            // BigInteger container
            const bigIntegerContainer = document.createElement("div");
            bigIntegerContainer.className = "big-integer-container";

            const bigIntegerBody = document.createElement("div");
            bigIntegerBody.className = "big-integer-body";
            const bigIntegerIndicator = document.createElement("div");
            bigIntegerIndicator.className = "big-integer-indicator";
            const bigIntegerCenter = document.createElement("div");
            bigIntegerCenter.className = "big-integer-center-display";
            const bigIntegerValue = document.createElement("div");
            bigIntegerValue.className = "big-integer-value";
            bigIntegerCenter.appendChild(bigIntegerValue);
            bigIntegerBody.appendChild(bigIntegerIndicator);
            bigIntegerBody.appendChild(bigIntegerCenter);

            bigIntegerContainer.appendChild(bigIntegerBody);
            wrapper.appendChild(bigIntegerContainer);

            // Vertical slider
            const verticalContainer = document.createElement("div");
            verticalContainer.className = "vertical-slider-container";

            const vTrack = document.createElement("div");
            vTrack.className = "slider-vertical-track";
            const vThumb = document.createElement("div");
            vThumb.className = "slider-vertical-thumb";
            const vValueSpan = document.createElement("span");
            vThumb.appendChild(vValueSpan);
            vTrack.appendChild(vThumb);
            verticalContainer.appendChild(vTrack);
            wrapper.appendChild(verticalContainer);

            // Horizontal slider
            const horizontalContainer = document.createElement("div");
            horizontalContainer.className = "horizontal-slider-container";

            const hTrack = document.createElement("div");
            hTrack.className = "slider-horizontal-track";
            const hThumb = document.createElement("div");
            hThumb.className = "slider-horizontal-thumb";
            const hValueSpan = document.createElement("span");
            hThumb.appendChild(hValueSpan);
            hTrack.appendChild(hThumb);
            horizontalContainer.appendChild(hTrack);
            wrapper.appendChild(horizontalContainer);

            // Step buttons
            const minusBtn = document.createElement("button");
            minusBtn.className = "magik-big-integer-corner-btn";
            const plusBtn = document.createElement("button");
            plusBtn.className = "magik-big-integer-corner-btn";
            wrapper.appendChild(minusBtn);
            wrapper.appendChild(plusBtn);

            // DOM widget
            const domWidget = this.addDOMWidget("magik_big_integer_ui", "div", wrapper, { serialize: false });
            domWidget.element.style.position = 'relative';
            domWidget.wrapper = wrapper;

            // Store references
            this.wrapper = wrapper;
            this.titleDisplay = titleDisplay;
            this.settingsBtn = settingsBtn;
            this.minMaxContainer = minMaxContainer;
            this.minInput = minInput;
            this.maxInput = maxInput;
            this.minusBtn = minusBtn;
            this.plusBtn = plusBtn;
            this.bigIntegerBody = bigIntegerBody;
            this.bigIntegerIndicator = bigIntegerIndicator;
            this.bigIntegerCenter = bigIntegerCenter;
            this.bigIntegerValue = bigIntegerValue;
            this.vTrack = vTrack;
            this.vThumb = vThumb;
            this.vValueSpan = vValueSpan;
            this.hTrack = hTrack;
            this.hThumb = hThumb;
            this.hValueSpan = hValueSpan;

            // Accessibility: make interactive elements focusable
            this.bigIntegerBody.tabIndex = 0;
            this.vThumb.tabIndex = 0;
            this.hThumb.tabIndex = 0;

            // ARIA attributes for sliders
            this.bigIntegerBody.setAttribute('role', 'slider');
            this.vThumb.setAttribute('role', 'slider');
            this.hThumb.setAttribute('role', 'slider');
            this._updateAriaAttributes(); // set initial values

            // Modal overlay (to be appended to body)
            this.modalOverlay = document.createElement("div");
            this.modalOverlay.className = "magik-big-integer-modal-overlay";
            this.modal = this._buildModal(this.modalOverlay);
            document.body.appendChild(this.modalOverlay);
        };

        // Helper to update ARIA attributes
        nodeType.prototype._updateAriaAttributes = function () {
            const val = this.bigIntegerValueWidget.value; // <-- changed
            const min = this.properties.min;
            const max = this.properties.max;

            [this.bigIntegerBody, this.vThumb, this.hThumb].forEach(el => {
                if (el) {
                    el.setAttribute('aria-valuemin', min);
                    el.setAttribute('aria-valuemax', max);
                    el.setAttribute('aria-valuenow', val);
                    el.setAttribute('aria-valuetext', val.toString());
                }
            });
        };

        nodeType.prototype._setupEventListeners = function () {
            // Apply value helper – now using this.bigIntegerValueWidget
            const applyValue = (newValue) => {
                const props = this.properties;
                let clamped = Math.max(props.min, Math.min(props.max, newValue));
                let stepped = Math.round(clamped / props.stepper) * props.stepper;
                this.bigIntegerValueWidget.value = stepped; // <-- changed
                this.bigIntegerValueWidget.callback?.(stepped); // <-- changed
                this._updateAllVisuals();
            };

            // BigInteger drag
            let isDraggingBigInteger = false;
            let lastY = 0;
            this.bigIntegerBody.addEventListener("mousedown", (e) => {
                if (e.button !== 0) return;
                isDraggingBigInteger = true;
                lastY = e.clientY;
                this.bigIntegerBody.classList.add('dragging');
                e.preventDefault();
                e.stopPropagation();
            });

            document.addEventListener("mousemove", (e) => {
                if (!isDraggingBigInteger) return;
                const delta = lastY - e.clientY;
                lastY = e.clientY;
                const range = this.properties.max - this.properties.min;
                const sensitivity = range / 300;
                applyValue(this.bigIntegerValueWidget.value + delta * sensitivity); // <-- changed
                e.preventDefault();
            });

            document.addEventListener("mouseup", (e) => {
                if (!isDraggingBigInteger) return;
                isDraggingBigInteger = false;
                this.bigIntegerBody.classList.remove('dragging');
                e.preventDefault();
            });

            this.bigIntegerBody.addEventListener("wheel", (e) => {
                e.preventDefault();
                e.stopPropagation(); // wheel-over-bigInteger adjusts value only, don't also forward to canvas zoom
                const range = this.properties.max - this.properties.min;
                const delta = -Math.sign(e.deltaY) * (range / 100);
                applyValue(this.bigIntegerValueWidget.value + delta); // <-- changed
            });

            this.bigIntegerBody.addEventListener("contextmenu", (e) => e.preventDefault());

            // Vertical slider
            let isDraggingV = false;
            this.vThumb.addEventListener("mousedown", (e) => {
                if (e.button !== 0) return;
                isDraggingV = true;
                this.vThumb.classList.add('dragging');
                e.preventDefault();
                e.stopPropagation();
            });

            document.addEventListener("mousemove", (e) => {
                if (!isDraggingV) return;
                const rect = this.vTrack.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const pct = 1 - Math.max(0, Math.min(1, y / rect.height));
                applyValue(this.properties.min + pct * (this.properties.max - this.properties.min));
                e.preventDefault();
            });

            document.addEventListener("mouseup", (e) => {
                if (!isDraggingV) return;
                isDraggingV = false;
                this.vThumb.classList.remove('dragging');
                e.preventDefault();
            });

            this.vTrack.addEventListener("click", (e) => {
                const rect = this.vTrack.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const pct = 1 - Math.max(0, Math.min(1, y / rect.height));
                applyValue(this.properties.min + pct * (this.properties.max - this.properties.min));
            });

            // Horizontal slider
            let isDraggingH = false;
            this.hThumb.addEventListener("mousedown", (e) => {
                if (e.button !== 0) return;
                isDraggingH = true;
                this.hThumb.classList.add('dragging');
                e.preventDefault();
                e.stopPropagation();
            });

            document.addEventListener("mousemove", (e) => {
                if (!isDraggingH) return;
                const rect = this.hTrack.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const pct = Math.max(0, Math.min(1, x / rect.width));
                applyValue(this.properties.min + pct * (this.properties.max - this.properties.min));
                e.preventDefault();
            });

            document.addEventListener("mouseup", (e) => {
                if (!isDraggingH) return;
                isDraggingH = false;
                this.hThumb.classList.remove('dragging');
                e.preventDefault();
            });

            this.hTrack.addEventListener("click", (e) => {
                const rect = this.hTrack.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const pct = Math.max(0, Math.min(1, x / rect.width));
                applyValue(this.properties.min + pct * (this.properties.max - this.properties.min));
            });

            // Step buttons
            this.minusBtn.addEventListener("click", (e) => {
                applyValue(this.bigIntegerValueWidget.value - this.properties.stepper); // <-- changed
                e.preventDefault();
                e.stopPropagation();
            });

            this.plusBtn.addEventListener("click", (e) => {
                applyValue(this.bigIntegerValueWidget.value + this.properties.stepper); // <-- changed
                e.preventDefault();
                e.stopPropagation();
            });

            // Settings button
            this.settingsBtn.addEventListener("click", (e) => {
                this.modal.show();
                this.modalOverlay.style.display = "flex";
                e.preventDefault();
                e.stopPropagation();
            });

            // Keyboard support (bubbles from focusable children)
            this.wrapper.addEventListener("keydown", (e) => {
                if (e.key === "ArrowUp" || e.key === "ArrowRight") {
                    applyValue(this.bigIntegerValueWidget.value + this.properties.stepper); // <-- changed
                    e.preventDefault();
                } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
                    applyValue(this.bigIntegerValueWidget.value - this.properties.stepper); // <-- changed
                    e.preventDefault();
                }
            });

            // MIN/MAX inputs (main panel)
            const applyMinMax = () => {
                let min = parseInt(this.minInput.value, 10);
                let max = parseInt(this.maxInput.value, 10);
                if (isNaN(min)) { min = this.properties.min; this.minInput.value = min; }
                if (isNaN(max)) { max = this.properties.max; this.maxInput.value = max; }
                if (max < min) { max = min; this.maxInput.value = max; }
                this.properties.min = min;
                this.properties.max = max;
                this._updateAllVisuals();
            };
            this.minInput.addEventListener("change", applyMinMax);
            this.maxInput.addEventListener("change", applyMinMax);
            this.minMaxContainer.addEventListener("wheel", (e) => e.stopPropagation(), { passive: false });
            this.minMaxContainer.addEventListener("pointerdown", (e) => e.stopPropagation());
            this.minMaxContainer.addEventListener("keydown", (e) => e.stopPropagation());

            // Canvas pan/zoom passthrough: let wheel (over sliders/buttons/
            // background, not the bigInteger itself) and middle-mouse drag still
            // reach the LiteGraph canvas, same pattern as Magik Mega Panel.
            this.wrapper.addEventListener("wheel", (e) => this._forwardWheelToLiteGraph(e), { passive: false });
            this.wrapper.addEventListener("pointerdown", (e) => this._maybeStartCanvasPan(e));
        };

        nodeType.prototype._forwardWheelToLiteGraph = function (e) {
            const canvas = app.canvas;
            if (!canvas) return;
            e.preventDefault();
            e.stopPropagation();
            if (typeof canvas.processMouseWheel === "function") {
                canvas.processMouseWheel(e);
                return;
            }
            const canvasEl = canvas.canvas;
            if (!canvasEl) return;
            canvasEl.dispatchEvent(new WheelEvent("wheel", {
                deltaX: e.deltaX, deltaY: e.deltaY, deltaZ: e.deltaZ,
                deltaMode: e.deltaMode,
                clientX: e.clientX, clientY: e.clientY,
                screenX: e.screenX, screenY: e.screenY,
                ctrlKey: e.ctrlKey, shiftKey: e.shiftKey,
                altKey: e.altKey, metaKey: e.metaKey,
                bubbles: true, cancelable: true, composed: true,
            }));
        };

        nodeType.prototype._maybeStartCanvasPan = function (e) {
            if (e.button !== 1) return;
            const canvas = app.canvas;
            if (!canvas || typeof canvas.processMouseDown !== "function") return;
            e.preventDefault();
            e.stopPropagation();
            canvas.processMouseDown(e);
        };

        nodeType.prototype._setupResizeObserver = function () {
            this._resizeObserver = new ResizeObserver(() => this._updateLayout());
            this._resizeObserver.observe(this.widgets.find(w => w.name === "magik_big_integer_ui").element);
        };

        nodeType.prototype._updateLayout = function () {
            const container = this.widgets.find(w => w.name === "magik_big_integer_ui").element;
            const w = container.clientWidth;
            const h = container.clientHeight;
            if (w === 0 || h === 0) return;

            const btnSize = Math.max(20, Math.min(4000, Math.min(w, h) * 0.08));
            this.settingsBtn.style.width = btnSize + 'px';
            this.settingsBtn.style.height = btnSize + 'px';
            this.settingsBtn.style.fontSize = (btnSize * 0.6) + 'px';
            this.titleDisplay.style.fontSize = (btnSize * 0.5) + 'px';
            this.titleDisplay.style.lineHeight = btnSize + 'px';
            this.minMaxContainer.style.fontSize = (btnSize * 0.3) + 'px';
            this.minInput.style.width = this.maxInput.style.width = (btnSize * 1.5) + 'px';
            this.minInput.style.height = this.maxInput.style.height = (btnSize * 0.7) + 'px';
            this.minInput.style.fontSize = this.maxInput.style.fontSize = (btnSize * 0.3) + 'px';

            const minMaxHeight = btnSize * 0.7 + 8;
            const headerHeight = btnSize + 10 + minMaxHeight;
            const availableHeight = h - headerHeight;
            const availableWidth = w;

            // BigInteger sizing
            const bigIntegerSize = Math.min(availableWidth * 0.9, availableHeight * 0.9);
            this.bigIntegerBody.style.width = this.bigIntegerBody.style.height = bigIntegerSize + 'px';
            this.bigIntegerBody.style.setProperty('--big-integer-size', bigIntegerSize + 'px');
            const indicatorHeight = bigIntegerSize * 0.25;
            this.bigIntegerIndicator.style.height = indicatorHeight + 'px';
            this.bigIntegerIndicator.style.width = (bigIntegerSize * 0.043) + 'px';
            const indicatorTop = bigIntegerSize * 0.107;
            this.bigIntegerIndicator.style.top = indicatorTop + 'px';
            this.bigIntegerIndicator.style.left = `calc(50% - ${bigIntegerSize * 0.0215}px)`;
            const transformOriginY = (bigIntegerSize / 2) - indicatorTop;
            this.bigIntegerIndicator.style.transformOrigin = `center ${transformOriginY}px`;
            const centerSize = bigIntegerSize * 0.714;
            this.bigIntegerCenter.style.width = this.bigIntegerCenter.style.height = centerSize + 'px';
            this.bigIntegerValue.style.fontSize = (bigIntegerSize * 0.114) + 'px';

            const cornerBtnSize = bigIntegerSize / 7;
            this.minusBtn.style.width = this.plusBtn.style.width = cornerBtnSize + 'px';
            this.minusBtn.style.height = this.plusBtn.style.height = cornerBtnSize + 'px';
            this.minusBtn.style.fontSize = this.plusBtn.style.fontSize = (cornerBtnSize * 0.6) + 'px';

            // Vertical slider (width settable via the slider_width option)
            const sliderWidth = this.properties.slider_width > 0 ? Math.min(this.properties.slider_width, availableWidth) : 0;
            const vTrackHeight = availableHeight * 0.7;
            this.vTrack.style.height = vTrackHeight + 'px';
            const vTrackWidth = sliderWidth || 30;
            this.vTrack.style.width = vTrackWidth + 'px';
            const thumbHeight = Math.max(20, vTrackHeight * 0.1);
            this.vThumb.style.height = thumbHeight + 'px';
            this.vThumb.style.width = (vTrackWidth + 10) + 'px';
            this.vThumb.style.left = '-5px';
            this.vValueSpan.style.fontSize = (thumbHeight * 0.5) + 'px';

            // Horizontal slider (length settable via the slider_width option)
            const hTrackWidth = sliderWidth || availableWidth * 0.8;
            this.hTrack.style.width = hTrackWidth + 'px';
            this.hTrack.style.height = '30px';
            const thumbWidth = Math.max(20, hTrackWidth * 0.05);
            this.hThumb.style.width = thumbWidth + 'px';
            this.hThumb.style.height = '40px';
            this.hThumb.style.top = '-5px';
            this.hValueSpan.style.fontSize = (thumbWidth * 0.5) + 'px';

            this._updateSliderPositions();
        };

        nodeType.prototype._updateAllVisuals = function () {
            this.titleDisplay.textContent = this.properties.title;
            this.minInput.value = this.properties.min;
            this.maxInput.value = this.properties.max;
            this.wrapper.style.setProperty("--big-integer-color", this.properties.color);
            // Step buttons show current stepper value
            this.minusBtn.textContent = `-${this.properties.stepper}`;
            this.plusBtn.textContent = `+${this.properties.stepper}`;
            this._updateBigIntegerVisuals();
            this._updateSliderPositions();
            this._updateAriaAttributes();
        };

        nodeType.prototype._updateBigIntegerVisuals = function () {
            const props = this.properties;
            const range = props.max - props.min;
            const pct = (this.bigIntegerValueWidget.value - props.min) / (range || 1); // <-- changed
            const deg = -135 + pct * 270;
            this.bigIntegerIndicator.style.transform = `rotate(${deg}deg)`;
            this.bigIntegerValue.textContent = this.bigIntegerValueWidget.value; // <-- changed
            this.bigIntegerBody.style.setProperty('--big-integer-progress', pct * 100);
        };

        nodeType.prototype._updateSliderPositions = function () {
            const props = this.properties;
            const range = props.max - props.min;
            const pct = (this.bigIntegerValueWidget.value - props.min) / (range || 1); // <-- changed

            // Vertical
            const vTrackHeight = parseFloat(this.vTrack.style.height) || 100;
            const thumbHeight = parseFloat(this.vThumb.style.height) || 20;
            const vPos = (1 - pct) * (vTrackHeight - thumbHeight);
            this.vThumb.style.top = vPos + 'px';
            this.vValueSpan.textContent = this.bigIntegerValueWidget.value; // <-- changed

            // Horizontal
            const hTrackWidth = parseFloat(this.hTrack.style.width) || 100;
            const thumbWidth = parseFloat(this.hThumb.style.width) || 20;
            const hPos = pct * (hTrackWidth - thumbWidth);
            this.hThumb.style.left = hPos + 'px';
            this.hValueSpan.textContent = this.bigIntegerValueWidget.value; // <-- changed
        };

        nodeType.prototype._applyTheme = function (theme) {
            this.wrapper.classList.remove(...THEMES.map(t => `theme-${t}`));
            this.wrapper.classList.add(`theme-${theme}`);
            // Themes also drive the node background color
            const themeColor = THEME_DEFAULTS[theme]?.color;
            if (themeColor) this.bgcolor = themeColor;
        };

        nodeType.prototype._applyShape = function (shape) {
            this.wrapper.classList.remove(...SHAPES.map(s => `shape-${s}`));
            this.wrapper.classList.add(`shape-${shape}`);
            this._updateLayout();
        };

        nodeType.prototype._buildModal = function (overlay) {
            const modal = document.createElement("div");
            modal.className = "magik-big-integer-modal";

            const title = document.createElement("div");
            title.className = "magik-big-integer-modal-title";
            title.textContent = "Big Integer Settings";
            modal.appendChild(title);

            const createRow = (labelText, input) => {
                const row = document.createElement("div");
                row.className = "magik-big-integer-modal-row";
                const label = document.createElement("label");
                label.textContent = labelText;
                row.appendChild(label);
                row.appendChild(input);
                return row;
            };

            // Inputs
            const titleInput = document.createElement("input");
            titleInput.type = "text";

            const stepperInput = document.createElement("input");
            stepperInput.type = "number";
            stepperInput.step = "1";
            stepperInput.min = "1";

            const sliderWidthInput = document.createElement("input");
            sliderWidthInput.type = "number";
            sliderWidthInput.step = "1";
            sliderWidthInput.min = "0";

            const colorInput = document.createElement("input");
            colorInput.type = "color";

            // Theme icon grid
            const themeRow = document.createElement("div");
            themeRow.className = "magik-big-integer-modal-row";
            const themeLabel = document.createElement("label");
            themeLabel.textContent = "Theme:";
            themeRow.appendChild(themeLabel);

            const iconGrid = document.createElement("div");
            iconGrid.className = "theme-icon-grid";

            const themeIcons = [];
            THEMES.forEach(theme => {
                const icon = document.createElement("div");
                icon.className = "theme-icon";
                icon.dataset.theme = theme;
                icon.title = theme.charAt(0).toUpperCase() + theme.slice(1);
                const defaultColor = THEME_DEFAULTS[theme]?.color || "#888";
                icon.style.background = `radial-gradient(circle at 30% 30%, ${defaultColor}, #333)`;
                iconGrid.appendChild(icon);
                themeIcons.push(icon);
            });

            themeRow.appendChild(iconGrid);
            modal.appendChild(themeRow);

            // Shape select
            const shapeSelect = document.createElement("select");
            SHAPES.forEach(shape => {
                const option = document.createElement("option");
                option.value = shape;
                option.textContent = shape.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                shapeSelect.appendChild(option);
            });

            modal.appendChild(createRow("Title:", titleInput));
            modal.appendChild(createRow("Step:", stepperInput));
            modal.appendChild(createRow("Slider Width (px, 0=auto):", sliderWidthInput));
            modal.appendChild(createRow("Color:", colorInput));
            modal.appendChild(createRow("Shape:", shapeSelect));

            const buttons = document.createElement("div");
            buttons.className = "magik-big-integer-modal-buttons";
            const saveBtn = document.createElement("button");
            saveBtn.className = "magik-big-integer-modal-button save";
            saveBtn.textContent = "Save";
            const cancelBtn = document.createElement("button");
            cancelBtn.className = "magik-big-integer-modal-button";
            cancelBtn.textContent = "Cancel";

            buttons.appendChild(cancelBtn);
            buttons.appendChild(saveBtn);
            modal.appendChild(buttons);
            overlay.appendChild(modal);

            let tempTheme = this.themeWidget.value;
            let savedTheme = this.themeWidget.value;

            const updateSelectedIcon = (theme) => {
                themeIcons.forEach(icon => {
                    icon.classList.toggle('selected', icon.dataset.theme === theme);
                });
            };

            const applyThemeDefaults = (theme) => {
                const defaults = THEME_DEFAULTS[theme];
                if (defaults) {
                    colorInput.value = defaults.color;
                    titleInput.value = defaults.title;
                }
            };

            themeIcons.forEach(icon => {
                icon.addEventListener('click', () => {
                    const theme = icon.dataset.theme;
                    tempTheme = theme;
                    this._applyTheme(theme);
                    updateSelectedIcon(theme);
                    applyThemeDefaults(theme);
                });

                icon.addEventListener('mouseenter', () => {
                    this._applyTheme(icon.dataset.theme);
                });

                icon.addEventListener('mouseleave', () => {
                    this._applyTheme(tempTheme);
                });
            });

            const hide = () => overlay.style.display = "none";

            const show = () => {
                titleInput.value = this.properties.title;
                stepperInput.value = this.properties.stepper;
                sliderWidthInput.value = this.properties.slider_width;
                colorInput.value = this.properties.color;
                shapeSelect.value = this.shapeWidget.value;

                tempTheme = this.themeWidget.value;
                savedTheme = this.themeWidget.value;
                updateSelectedIcon(tempTheme);
                this._applyTheme(tempTheme);
            };

            cancelBtn.addEventListener("click", () => {
                this._applyTheme(savedTheme);
                hide();
            });

            overlay.addEventListener("click", (e) => {
                if (e.target === overlay) {
                    this._applyTheme(savedTheme);
                    hide();
                }
            });

            saveBtn.addEventListener("click", () => {
                let stepperVal = parseInt(stepperInput.value, 10);
                const min = this.properties.min;
                const max = this.properties.max;
                if (isNaN(stepperVal) || stepperVal < 1) stepperVal = 1;
                const range = max - min;
                if (stepperVal > range && range > 0) {
                    console.warn(`Step ${stepperVal} exceeds range ${range}, capping to ${range}`);
                    stepperVal = range;
                }
                stepperInput.value = stepperVal;

                let sliderWidthVal = parseInt(sliderWidthInput.value, 10);
                if (isNaN(sliderWidthVal) || sliderWidthVal < 0) sliderWidthVal = 0;
                sliderWidthInput.value = sliderWidthVal;

                this.properties.title = titleInput.value;
                this.properties.stepper = stepperVal;
                this.properties.slider_width = sliderWidthVal;
                this.properties.color = colorInput.value;

                this.shapeWidget.value = shapeSelect.value;
                this.shapeWidget.callback?.(shapeSelect.value);

                if (tempTheme !== this.themeWidget.value) {
                    this.themeWidget.value = tempTheme;
                    this.themeWidget.callback?.(tempTheme);
                } else {
                    this._applyTheme(tempTheme);
                }

                this._updateAllVisuals();
                hide();
            });

            return { show, hide };
        };

        // Cleanup
        const onRemoved = nodeType.prototype.onRemoved;
        nodeType.prototype.onRemoved = function () {
            if (this._resizeObserver) {
                this._resizeObserver.disconnect();
                delete this._resizeObserver;
            }
            if (this.modalOverlay && this.modalOverlay.parentNode) {
                this.modalOverlay.parentNode.removeChild(this.modalOverlay);
            }
            onRemoved?.apply(this, arguments);
        };

        const onConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function (info) {
            onConfigure?.apply(this, arguments);
            this._syncAllVisuals?.();
            if (this.themeWidget) this._applyTheme(this.themeWidget.value);
            if (this.shapeWidget) this._applyShape(this.shapeWidget.value);
        };

        nodeType.prototype._syncAllVisuals = function () {
            this._updateAllVisuals();
            this._updateLayout();
        };
    }
};

app.registerExtension(MagikBigIntegerExtension);
