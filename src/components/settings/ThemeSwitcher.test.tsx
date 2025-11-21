import { describe, it, expect, mock, beforeEach } from "bun:test";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ThemeSwitcher } from "./ThemeSwitcher";

// Mock next-themes
const mockSetTheme = mock(() => { });
mock.module("next-themes", () => ({
    useTheme: () => ({
        theme: "light",
        setTheme: mockSetTheme,
    }),
}));

describe("ThemeSwitcher", () => {
    beforeEach(() => {
        cleanup();
        mockSetTheme.mockClear();
    });

    it("renders all theme options", () => {
        render(<ThemeSwitcher />);

        expect(screen.getByText("Light")).toBeDefined();
        expect(screen.getByText("Dark")).toBeDefined();
        expect(screen.getByText("Glassmorphism")).toBeDefined();
        expect(screen.getByText("Neubrutalism")).toBeDefined();
        expect(screen.getByText("Minimalist")).toBeDefined();
    });

    it("calls setTheme when a theme is clicked", () => {
        render(<ThemeSwitcher />);

        const darkThemeCard = screen.getByText("Dark");
        fireEvent.click(darkThemeCard);
        expect(mockSetTheme).toHaveBeenCalledWith("dark");

        const glassThemeCard = screen.getByText("Glassmorphism");
        fireEvent.click(glassThemeCard);
        expect(mockSetTheme).toHaveBeenCalledWith("glassmorphism");
    });
});
