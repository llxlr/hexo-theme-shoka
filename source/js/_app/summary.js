// 打字机效果
function typeTextMachineStyle(text, targetSelector, options) {
    var defaults = {
        delay: 50,
        startDelay: 2000,
        onComplete: null,
        clearBefore: true,
        eraseBefore: true,
        eraseDelay: 30
    };

    var settings = options || {};
    var delay = settings.delay !== undefined ? settings.delay : defaults.delay;
    var startDelay = settings.startDelay !== undefined ? settings.startDelay : defaults.startDelay;
    var onComplete = settings.onComplete !== undefined ? settings.onComplete : defaults.onComplete;
    var clearBefore = settings.clearBefore !== undefined ? settings.clearBefore : defaults.clearBefore;
    var eraseBefore = settings.eraseBefore !== undefined ? settings.eraseBefore : defaults.eraseBefore;
    var eraseDelay = settings.eraseDelay !== undefined ? settings.eraseDelay : defaults.eraseDelay;

    var el = document.querySelector(targetSelector);
    if (!el || typeof text !== "string") return;

    setTimeout(function() {
        var startTyping = function() {
            var index = 0;
            function renderChar() {
                if (index <= text.length) {
                    el.textContent = text.slice(0, index++);
                    setTimeout(renderChar, delay);
                } else {
                    if (onComplete) {
                        onComplete(el);
                    }
                }
            }
            renderChar();
        };

        if (clearBefore) {
            if (eraseBefore && el.textContent.length > 0) {
                var currentText = el.textContent;
                var eraseIndex = currentText.length;

                function eraseChar() {
                    if (eraseIndex > 0) {
                        el.textContent = currentText.slice(0, --eraseIndex);
                        setTimeout(eraseChar, eraseDelay);
                    } else {
                        startTyping();
                    }
                }

                eraseChar();
            } else {
                el.textContent = "";
                startTyping();
            }
        } else {
            startTyping();
        }
    }, startDelay);
}

// 平滑弹出效果
function typeText(text, targetSelector, options) {
    var defaults = {
        delay: 50,
        startDelay: 2000,
        onComplete: null,
        clearBefore: true
    };

    var settings = options || {};
    var delay = settings.delay !== undefined ? settings.delay : defaults.delay;
    var startDelay = settings.startDelay !== undefined ? settings.startDelay : defaults.startDelay;
    var onComplete = settings.onComplete !== undefined ? settings.onComplete : defaults.onComplete;
    var clearBefore = settings.clearBefore !== undefined ? settings.clearBefore : defaults.clearBefore;

    var targetEl = document.querySelector(targetSelector);
    if (!targetEl || typeof text !== "string") return;

    var index = 0;
    var frameId = null;

    function renderChar() {
        if (index < text.length) {
            var span = document.createElement("span");
            span.textContent = text[index++];
            span.className = "char";
            targetEl.appendChild(span);
            frameId = requestAnimationFrame(function() {
                setTimeout(renderChar, delay);
            });
        } else {
            cancelAnimationFrame(frameId);
            if (onComplete) {
                onComplete(targetEl);
            }
        }
    }

    setTimeout(function() {
        if (clearBefore) targetEl.textContent = "";
        renderChar();
    }, startDelay);
}

function renderAISummary() {
    var summaryEl = document.querySelector(".ai-summary .ai-explanation");
    if (!summaryEl) return;

    var summaryText = summaryEl.getAttribute("data-summary");
    if (summaryText) {
        typeTextMachineStyle(summaryText, ".ai-summary .ai-explanation");
    }
}
