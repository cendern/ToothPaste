import React from "react";
import {
    PowerIcon,
    PlayPauseIcon,
    ChevronDoubleUpIcon,
    ChevronDoubleDownIcon,
    ForwardIcon,
    BackwardIcon,
    CursorArrowRaysIcon,
    ArrowUpOnSquareStackIcon,
    CursorArrowRippleIcon,
    EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { MediaToggleButton, IconToggleButton } from "../shared/buttons";
import { keyboardHandler } from "../../services/inputHandlers/keyboardHandler";
import { createMouseJigglePacket } from "../../services/packetService/packetFunctions";

// Shortcut definitions
export const SHORTCUTS_MENU = [
    { label: "Ctrl+A", keys: ["Control", "a"] },
    { label: "Ctrl+C", keys: ["Control", "c"] },
    { label: "Ctrl+V", keys: ["Control", "v"] },
    { label: "Ctrl+X", keys: ["Control", "x"] },
    { label: "Delete", keys: ["Delete"] },
    { label: "Ctrl+Z", keys: ["Control", "z"] },
    { label: "Ctrl+Y", keys: ["Control", "y"] },
    { label: "Ctrl+S", keys: ["Control", "s"] },
    { label: "Alt+Tab", keys: ["Alt", "Tab"] },
    { label: "Esc", keys: ["Escape"] },
    { label: "Ctrl+Alt+Del", keys: ["Control", "Alt", "Delete"] },
    { label: "Ctrl+Shift+Esc", keys: ["Control", "Shift", "Escape"] },
    { label: "Win+V", keys: ["Meta", "v"] },
    { label: "Win+Shift+S", keys: ["Meta", "Shift", "s"] },
    { label: "Enter", keys: ["Enter"] },
];

// Key composition buttons for building custom key combos
export const KEY_COMPOSER_BUTTONS = [
    // Modifiers
    { label: "Ctrl", key: "Control", type: "modifier" },
    { label: "Shift", key: "Shift", type: "modifier" },
    { label: "Alt", key: "Alt", type: "modifier" },
    { label: "Win", key: "Meta", type: "modifier" },
    // Navigation
    { label: "↑", key: "ArrowUp", type: "navigation" },
    { label: "↓", key: "ArrowDown", type: "navigation" },
    { label: "←", key: "ArrowLeft", type: "navigation" },
    { label: "→", key: "ArrowRight", type: "navigation" },
    // Common keys
    { label: "Home", key: "Home", type: "common" },
    { label: "End", key: "End", type: "common" },
    { label: "PgUp", key: "PageUp", type: "common" },
    { label: "PgDn", key: "PageDown", type: "common" },
    { label: "Del", key: "Delete", type: "common" },
    { label: "Esc", key: "Escape", type: "common" },
    { label: "Tab", key: "Tab", type: "common" },
    { label: "Enter", key: "Enter", type: "common" },
];

/**
 * Key composition component that allows users to build custom key combinations
 * by selecting modifier and navigation keys, then sending them
 */
export function KeyComposer({ onSendKeyboardShortcut }) {
    const [selectedKeys, setSelectedKeys] = React.useState([]);

    const toggleKey = (key) => {
        setSelectedKeys(prev => {
            if (prev.includes(key)) {
                return prev.filter(k => k !== key);
            } else {
                return [...prev, key];
            }
        });
    };

    const clearKeys = () => {
        setSelectedKeys([]);
    };

    const sendCombination = () => {
        if (selectedKeys.length > 0) {
            onSendKeyboardShortcut(selectedKeys);
            clearKeys();
        }
    };

    const getDisplayLabel = (key) => {
        const button = KEY_COMPOSER_BUTTONS.find(b => b.key === key);
        return button?.label || key;
    };

    const compositionDisplay = selectedKeys.length > 0 
        ? selectedKeys.map(getDisplayLabel).join("+")
        : "No keys selected";

    return (
        <div className="flex flex-col gap-2 bg-background border border-ash rounded-lg p-3">
            {/* Key Composer Buttons */}
            <div className="flex flex-wrap gap-1">
                {KEY_COMPOSER_BUTTONS.map((button) => (
                    <button
                        key={button.key}
                        onClick={() => toggleKey(button.key)}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                            selectedKeys.includes(button.key)
                                ? "bg-primary text-white"
                                : "bg-ink text-text border border-ash hover:bg-white hover:text-ink"
                        }`}
                    >
                        {button.label}
                    </button>
                ))}
            </div>

            {/* Composition Display and Send */}
            <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-ink text-text rounded border border-ash font-mono text-sm overflow-x-auto whitespace-nowrap">
                    {compositionDisplay}
                </div>
                <button
                    onClick={sendCombination}
                    disabled={selectedKeys.length === 0}
                    className={`px-3 py-2 rounded font-medium text-sm whitespace-nowrap transition-colors ${
                        selectedKeys.length > 0
                            ? "bg-primary text-white hover:bg-blue-700 cursor-pointer"
                            : "bg-ash text-text cursor-not-allowed opacity-50"
                    }`}
                >
                    Send
                </button>
                <button
                    onClick={clearKeys}
                    className="px-3 py-2 bg-secondary text-white rounded font-medium text-sm hover:bg-red-700 transition-colors"
                >
                    Clear
                </button>
            </div>
        </div>
    );
}

export function LeftButtonColumn({ status, sendEncrypted }) {
    return (
        <div className="flex flex-col space-y-2">
            <div>
                <MediaToggleButton
                    title="Play / Pause media"
                    onClick={() => {
                        keyboardHandler.sendControlCode(0x00cd, sendEncrypted);
                    }}
                    Icon={PlayPauseIcon}
                    expandDirection="right"
                    connectionStatus={status}
                />
            </div>
            <div>
                <MediaToggleButton
                    title="Volume Up"
                    onClick={() => {
                        keyboardHandler.sendControlCode(0x00e9, sendEncrypted);
                    }}
                    Icon={ChevronDoubleUpIcon}
                    expandDirection="right"
                    connectionStatus={status}
                />
            </div>
            <div>
                <MediaToggleButton
                    title="Volume Down"
                    onClick={() => {
                        keyboardHandler.sendControlCode(0x00ea, sendEncrypted);
                    }}
                    Icon={ChevronDoubleDownIcon}
                    expandDirection="right"
                    connectionStatus={status}
                />
            </div>
            <div>
                <MediaToggleButton
                    title="Next"
                    onClick={() => {
                        keyboardHandler.sendControlCode(0x00b5, sendEncrypted);
                    }}
                    Icon={ForwardIcon}
                    expandDirection="right"
                    connectionStatus={status}
                />
            </div>
            <div>
                <MediaToggleButton
                    title="Previous"
                    onClick={() => {
                        keyboardHandler.sendControlCode(0x00b6, sendEncrypted);
                    }}
                    Icon={BackwardIcon}
                    expandDirection="right"
                    connectionStatus={status}
                />
            </div>
            <div>
                <MediaToggleButton
                    title="Press 'Power' button"
                    Icon={PowerIcon}
                    onClick={() => keyboardHandler.sendControlCode(0x0030, sendEncrypted)}
                    expandDirection="right"
                    connectionStatus={status}
                />
            </div>
        </div>
    );
}

export function RightButtonColumn({
    captureMouse,
    setCaptureMouse,
    commandPassthrough,
    setCommandPassthrough,
    jiggling,
    setJiggling,
    status,
    sendEncrypted,
    sendKeyboardShortcut,
}) {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    function CaptureMouseButton() {
        const handleToggle = () => setCaptureMouse((prev) => !prev);

        return (
            <IconToggleButton
                title="Enable / Disable mouse capture"
                toggled={captureMouse}
                onClick={handleToggle}
                Icon={CursorArrowRaysIcon}
                hoverText="Enable / Disable mouse capture"
                connectionStatus={status}
            />
        );
    }

    function CommandPassthroughButton() {
        const handleToggle = () => setCommandPassthrough((prev) => !prev);
        return (
            <IconToggleButton
                title="Capture Shortcuts"
                toggled={commandPassthrough}
                onClick={handleToggle}
                Icon={ArrowUpOnSquareStackIcon}
                hoverText="Capture Shortcuts (e.g. Ctrl+V)"
                connectionStatus={status}
            />
        );
    }

    function MouseJiggleButton() {
        const handleToggle = () => {
            const mouseJigglePacket = createMouseJigglePacket(!jiggling);
            sendEncrypted(mouseJigglePacket);
            setJiggling((prev) => !prev);
        };

        return (
            <IconToggleButton
                title="Start / Stop Mouse Jiggling"
                toggled={jiggling}
                onClick={handleToggle}
                Icon={CursorArrowRippleIcon}
                hoverText="Start / Stop Mouse Jiggling"
                connectionStatus={status}
            />
        );
    }

    function ShortcutsMenuButton() {
        return (
            <div className="relative">
                <IconToggleButton
                    title="Shortcuts Menu"
                    toggled={isMenuOpen}
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    Icon={EllipsisVerticalIcon}
                    hoverText="Shortcuts"
                    connectionStatus={status}
                />
                {isMenuOpen && (
                    <div
                        className="absolute right-0 top-12 rounded-lg z-50 w-48 max-h-80 overflow-y-auto p-2 border-2 border-ash"
                        style={{ scrollbarColor: "#555 transparent" }}
                    >
                        <div className="flex flex-col gap-2">
                            {SHORTCUTS_MENU.map((shortcut, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        sendKeyboardShortcut(shortcut.keys);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full font-header px-4 py-2 text-left text-sm font-medium bg-ink text-text rounded-lg border border-ash hover:bg-white hover:text-ink transition-colors"
                                >
                                    {shortcut.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-2">
            <div>
                <CaptureMouseButton />
            </div>
            <div>
                <CommandPassthroughButton />
            </div>
            <div>
                <MouseJiggleButton />
            </div>
            <div>
                <ShortcutsMenuButton />
            </div>
        </div>
    );
}
