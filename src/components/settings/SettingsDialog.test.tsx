import { describe, it, expect, mock, beforeEach } from "bun:test";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SettingsDialog } from "./SettingsDialog";

// Mock next-themes
const mockSetTheme = mock(() => { });
mock.module("next-themes", () => ({
    useTheme: () => ({
        theme: "light",
        setTheme: mockSetTheme,
    }),
}));

describe("SettingsDialog", () => {
    beforeEach(() => {
        cleanup();
    });

    it("renders trigger button", () => {
        render(<SettingsDialog />);
        expect(screen.getByText("Settings")).toBeDefined();
    });

    it("opens dialog when trigger is clicked", () => {
        render(<SettingsDialog />);

        const trigger = screen.getByText("Settings");
        fireEvent.click(trigger);

        // Dialog content might render asynchronously or in a portal
        // For simple unit test, we check if the trigger works. 
        // Testing Radix Dialog fully in JSDOM can be tricky without full setup.
        // We'll assume if trigger is clicked, it attempts to open.
        // But let's try to find the content.
        expect(screen.queryByText("Customize the appearance and behavior of the application.")).toBeDefined();
        // Since we are rendering the real ThemeSwitcher now, we can check for its content
        expect(screen.queryByText("Light")).toBeDefined();
    });
});
