/** @format */

import { useEffect, useRef, useState } from "react";
import "./App.css";

const ITEMS = Array(100)
    .fill(0)
    .map((_, i) => ({
        value: i,
        label: `Item ${i + 1}`,
    }));

const DEF_CONFIG = {
    mousedown: false,
    dragIdx: -1,
    targetIdx: -1,
    initialPos: 0,
    itemHeight: 0,
    lastMoveTime: 0,
    gap: 16,

    // Add scrolling related properties
    scrollInterval: null,
    scrollSpeed: 100,
    scrollThreshold: 300, // pixels from top/bottom to trigger scroll
};

function App() {
    const [items, setItems] = useState(ITEMS);

    const refs = useRef([]);
    const dragInfo = useRef(DEF_CONFIG);

    useEffect(() => {
        const controller = new AbortController();

        function setItemTransition(el, enabled) {
            if (el) {
                el.style.transition = enabled
                    ? "transform 150ms ease-out"
                    : "none";
            }
        }


        function updatePreview(currentY) {
            const { dragIdx, itemHeight, gap } = dragInfo.current;
            if (dragIdx === -1) return;

            const draggedEl = refs.current[dragIdx];
            if (!draggedEl) return;

            // Throttle updates to prevent rapid changes
            const now = Date.now();
            if (now - dragInfo.current.lastMoveTime < 16) {
                // ~60fps
                return;
            }
            dragInfo.current.lastMoveTime = now;

            const deltaY = currentY - dragInfo.current.initialPos;
            setItemTransition(draggedEl, false);
            draggedEl.style.transform = `translateY(${deltaY}px)`;

            const draggedRect = draggedEl.getBoundingClientRect();
            const draggedCenter = draggedRect.top + draggedRect.height / 2;

            let targetIdx = dragIdx;
            refs.current.forEach((el, i) => {
                if (i !== dragIdx && el) {
                    const rect = el.getBoundingClientRect();
                    const center = rect.top + rect.height / 2;
                    let newTransform = "none";

                    if (draggedCenter > center && i > dragIdx) {
                        targetIdx = i;
                        newTransform = `translateY(-${itemHeight + gap}px)`;
                    } else if (draggedCenter < center && i < dragIdx) {
                        targetIdx = Math.min(targetIdx, i);
                        newTransform = `translateY(${itemHeight + gap}px)`;
                    }

                    if (el.style.transform !== newTransform) {
                        setItemTransition(el, true);
                        el.style.transform = newTransform;
                    }
                }
            });

            dragInfo.current.targetIdx = targetIdx;
        }

        function handleOnMouseMove(e) {
            if (!dragInfo.current.mousedown) return;
            updatePreview(e.clientY);
        }

        function handleOnMouseDown(e, idx) {
            const el = refs.current[idx];
            if (!el) return;

            refs.current.forEach((el, i) => {
                if (el) {
                    setItemTransition(el, true);

                    if (i === idx) {
                        el.classList.add("dragged-item");
                    }
                }
            });

            dragInfo.current = {
                ...DEF_CONFIG,
                mousedown: true,
                dragIdx: idx,
                targetIdx: idx,
                initialPos: e.clientY,
                itemHeight: el.getBoundingClientRect().height,
                lastMoveTime: Date.now(),
            };

            setItemTransition(el, false);
        }

        function reorderAndReset() {
            const { dragIdx, targetIdx, mousedown } = dragInfo.current;

            if (!mousedown || dragIdx === -1) return;

            // Enable transitions for all items
            refs.current.forEach((el, i) => {
                if (el) {
                    setItemTransition(el, false);
                    el.style.transform = "none";

                    if (i === dragIdx) {
                        el.classList.remove("dragged-item");
                    }
                }
            });

            // Reorder if position changed
            if (targetIdx !== dragIdx) {
                const newItems = [...items];
                const [removed] = newItems.splice(dragIdx, 1);
                newItems.splice(targetIdx, 0, removed);
                setItems(newItems);
            }

            // Reset drag info
            dragInfo.current = DEF_CONFIG;
        }

        refs.current.forEach((el, i) => {
            const handle = el?.querySelector(".handle");
            if (handle) {
                handle.addEventListener(
                    "mousedown",
                    (e) => handleOnMouseDown(e, i),
                    { signal: controller.signal }
                );
            }
        });

        document.addEventListener("mouseup", reorderAndReset, {
            signal: controller.signal,
        });
        document.addEventListener("mouseleave", reorderAndReset, {
            signal: controller.signal,
        });
        document.addEventListener("mousemove", handleOnMouseMove, {
            signal: controller.signal,
        });

        return () => controller.abort();
    }, [items]);

    return (
        <div className="items">
            {items.map((item, i) => {
                return (
                    <div
                        ref={(node) => {
                            refs.current[i] = node;
                        }}
                        draggable={false}
                        className="item"
                        key={item.value}
                    >
                        <div className="handle">
                            <Handle />
                        </div>
                        {item.label}
                    </div>
                );
            })}
        </div>
    );
}

function Handle() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-6"
        >
            <path
                fillRule="evenodd"
                d="M3 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 5.25Zm0 4.5A.75.75 0 0 1 3.75 9h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 9.75Zm0 4.5a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Zm0 4.5a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z"
                clipRule="evenodd"
            />
        </svg>
    );
}

export default App;
