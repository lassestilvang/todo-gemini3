import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { FocusMode } from "./FocusMode";

// Mock dependencies
mock.module("canvas-confetti", () => ({
    default: mock(() => Promise.resolve())
}));

mock.module("sonner", () => ({
    toast: {
        success: mock(),
        error: mock(),
        info: mock()
    }
}));

// Mock actions
const mockUpdateTask = mock(() => Promise.resolve());
mock.module("@/lib/actions", () => ({
    updateTask: mockUpdateTask
}));

describe("FocusMode", () => {
    const mockTask = {
        id: 1,
        title: "Test Task",
        description: "Test Description",
        priority: "high"
    };
    const mockOnClose = mock();

    beforeEach(() => {
        mockOnClose.mockClear();
        mockUpdateTask.mockClear();
    });

    afterEach(() => {
        cleanup();
    });

    it("should render task details", () => {
        render(<FocusMode task={mockTask} onClose={mockOnClose} />);
        expect(screen.getByText("Test Task")).toBeDefined();
        expect(screen.getByText("Test Description")).toBeDefined();
        expect(screen.getByText("Focus Mode")).toBeDefined();
        expect(screen.getByText("25:00")).toBeDefined();
    });

    it("should toggle timer on play/pause click", async () => {
        render(<FocusMode task={mockTask} onClose={mockOnClose} />);

        const startBtn = screen.getByLabelText("Start Timer");
        fireEvent.click(startBtn);

        expect(screen.getByText("Stay focused. You got this!")).toBeDefined();
        expect(screen.getByLabelText("Pause Timer")).toBeDefined();

        const pauseBtn = screen.getByLabelText("Pause Timer");
        fireEvent.click(pauseBtn);
        expect(screen.getByText("Ready to start?")).toBeDefined();
    });

    it("should reset timer", () => {
        render(<FocusMode task={mockTask} onClose={mockOnClose} />);

        // Start timer
        fireEvent.click(screen.getByLabelText("Start Timer"));

        // Reset
        fireEvent.click(screen.getByLabelText("Reset Timer"));
        expect(screen.getByText("25:00")).toBeDefined();
        expect(screen.getByText("Ready to start?")).toBeDefined();
    });

    it("should complete task", async () => {
        // Mock setTimeout
        const originalSetTimeout = global.setTimeout;
        const mockSetTimeout = Object.assign(
            mock((cb: () => void) => {
                cb();
                return 0 as number;
            }),
            { __promisify__: mock() }
        );
        global.setTimeout = mockSetTimeout as unknown as typeof setTimeout;

        render(<FocusMode task={mockTask} onClose={mockOnClose} />);

        await act(async () => {
            fireEvent.click(screen.getByLabelText("Complete Task"));
        });

        expect(mockUpdateTask).toHaveBeenCalledWith(1, { isCompleted: true });
        expect(mockOnClose).toHaveBeenCalled();

        global.setTimeout = originalSetTimeout;
    });

    it("should close on minimize click", () => {
        render(<FocusMode task={mockTask} onClose={mockOnClose} />);
        fireEvent.click(screen.getByLabelText("Minimize Focus Mode"));
        expect(mockOnClose).toHaveBeenCalled();
    });
});
