function createAccordion(root) {
    const items = Array.from(root.querySelectorAll(".faq-item"));

    if (!items.length) {
        return;
    }

    function openItem(item) {
        const button = item.querySelector(".faq-question");
        const panel = item.querySelector(".faq-answer");

        if (!button || !panel) {
            return;
        }

        item.classList.add("active");
        button.setAttribute("aria-expanded", "true");
        panel.hidden = false;
        panel.style.height = `${panel.scrollHeight}px`;

        const handleTransitionEnd = (event) => {
            if (event.propertyName !== "height") {
                return;
            }

            if (item.classList.contains("active")) {
                panel.style.height = "auto";
            }

            panel.removeEventListener("transitionend", handleTransitionEnd);
        };

        panel.addEventListener("transitionend", handleTransitionEnd);
    }

    function closeItem(item) {
        const button = item.querySelector(".faq-question");
        const panel = item.querySelector(".faq-answer");

        if (!button || !panel) {
            return;
        }

        panel.style.height = `${panel.scrollHeight}px`;
        panel.offsetHeight;

        item.classList.remove("active");
        button.setAttribute("aria-expanded", "false");
        panel.style.height = "0px";

        const handleTransitionEnd = (event) => {
            if (event.propertyName !== "height") {
                return;
            }

            if (!item.classList.contains("active")) {
                panel.hidden = true;
            }

            panel.removeEventListener("transitionend", handleTransitionEnd);
        };

        panel.addEventListener("transitionend", handleTransitionEnd);
    }

    function closeOthers(currentItem) {
        items.forEach((item) => {
            if (item !== currentItem) {
                closeItem(item);
            }
        });
    }

    items.forEach((item) => {
        const button = item.querySelector(".faq-question");
        const panel = item.querySelector(".faq-answer");

        if (!button || !panel) {
            return;
        }

        item.classList.remove("active");
        button.setAttribute("aria-expanded", "false");
        panel.hidden = true;
        panel.style.height = "0px";

        button.addEventListener("click", () => {
            const isExpanded = item.classList.contains("active");

            if (isExpanded) {
                closeItem(item);
                return;
            }

            closeOthers(item);
            openItem(item);
        });
    });
}

function createLanguageSwitcher() {
    const storageKey = "atelier-asakusa-locale";
    const root = document.documentElement;
    const buttons = Array.from(document.querySelectorAll("[data-lang-switch]"));
    const translatableNodes = Array.from(document.querySelectorAll("[data-lang-en][data-lang-jp]"));

    if (!buttons.length || !translatableNodes.length) {
        return;
    }

    const supportedLocales = (root.dataset.supportedLocales || "en").split(",");
    const defaultLocale = root.dataset.defaultLocale || "en";

    function normalizeLocale(locale) {
        return supportedLocales.includes(locale) ? locale : defaultLocale;
    }

    function updateButtonState(activeLocale) {
        buttons.forEach((button) => {
            const isActive = button.dataset.langSwitch === activeLocale;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });
    }

    function setNodeText(node, nextText) {
        if (node.dataset.langTarget === "text") {
            node.textContent = nextText;
            return;
        }

        const hasElementChildren = Array.from(node.childNodes).some(
            (child) => child.nodeType === Node.ELEMENT_NODE
        );

        if (!hasElementChildren) {
            node.textContent = nextText;
            return;
        }

        const textNode = Array.from(node.childNodes).find(
            (child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim().length > 0
        );

        if (textNode) {
            textNode.textContent = nextText;
        }
    }

    function updateText(locale) {
        translatableNodes.forEach((node) => {
            const nextText = node.dataset[`lang${locale === "ja" ? "Jp" : "En"}`];

            if (typeof nextText !== "string") {
                return;
            }

            setNodeText(node, nextText);

            if (node.dataset[`ariaLabel${locale === "ja" ? "Jp" : "En"}`]) {
                node.setAttribute(
                    "aria-label",
                    node.dataset[`ariaLabel${locale === "ja" ? "Jp" : "En"}`]
                );
            }

            if (node.dataset[`lang${locale === "ja" ? "Jp" : "En"}Placeholder`]) {
                node.setAttribute(
                    "placeholder",
                    node.dataset[`lang${locale === "ja" ? "Jp" : "En"}Placeholder`]
                );
            }
        });
    }

    function applyLocale(locale) {
        const nextLocale = normalizeLocale(locale);
        root.lang = nextLocale;
        updateText(nextLocale);
        updateButtonState(nextLocale);
        window.localStorage.setItem(storageKey, nextLocale);
    }

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            applyLocale(button.dataset.langSwitch || defaultLocale);
        });
    });

    applyLocale(normalizeLocale(window.localStorage.getItem(storageKey) || defaultLocale));
}

function createDemoBackend() {
    function getMissingFields(data, requiredFields) {
        return requiredFields.filter((field) => {
            const value = data[field];

            if (typeof value === "string") {
                return value.trim() === "";
            }

            return value === undefined || value === null;
        });
    }

    function createReservation(data) {
        const requiredFields = ["name", "email", "date", "guests", "plan"];
        const missingFields = getMissingFields(data, requiredFields);

        if (missingFields.length > 0) {
            return {
                success: false,
                message: `Missing required fields: ${missingFields.join(", ")}`,
            };
        }

        return {
            success: true,
            message: "Reservation received",
            data: {
                name: data.name,
                email: data.email,
                date: data.date,
                guests: data.guests,
                plan: data.plan,
                message: data.message || "",
                receivedAt: new Date().toISOString(),
            },
        };
    }

    function sendContactMessage(data) {
        const requiredFields = ["name", "email", "message"];
        const missingFields = getMissingFields(data, requiredFields);

        if (missingFields.length > 0) {
            return {
                success: false,
                message: `Missing required fields: ${missingFields.join(", ")}`,
            };
        }

        return {
            success: true,
            message: "Contact message received",
            data: {
                name: data.name,
                email: data.email,
                message: data.message,
                receivedAt: new Date().toISOString(),
            },
        };
    }

    return {
        createReservation,
        sendContactMessage,
    };
}

function attachDemoFormHandlers() {
    const demoBackend = createDemoBackend();

    window.AtelierAsakusaDemoApi = demoBackend;
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-accordion]").forEach(createAccordion);
    createLanguageSwitcher();
    attachDemoFormHandlers();
});
