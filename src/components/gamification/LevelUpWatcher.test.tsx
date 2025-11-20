import { render, screen, act, waitFor } from "@testing-library/react";
import { LevelUpWatcher } from "./LevelUpWatcher";
import { getUserStats } from "@/lib/actions";

// Mock the actions
jest.mock("@/lib/actions", () => ({
    getUserStats: jest.fn(),
}));

// Mock the modal to avoid rendering complex UI and canvas-confetti
jest.mock("./LevelUpModal", () => ({
    LevelUpModal: ({ open, level }: { open: boolean; level: number }) => (
        open ? <div data-testid="level-up-modal">Level Up! {level}</div> : null
    ),
}));

describe("LevelUpWatcher", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("should not show modal on initial load", async () => {
        (getUserStats as jest.Mock).mockResolvedValue({ level: 5 });

        await act(async () => {
            render(<LevelUpWatcher />);
        });

        // Should fetch initial stats
        expect(getUserStats).toHaveBeenCalled();

        // Should not show modal initially
        expect(screen.queryByTestId("level-up-modal")).toBeNull();
    });

    it("should show modal when level increases", async () => {
        // Initial level 5
        (getUserStats as jest.Mock)
            .mockResolvedValueOnce({ level: 5 })
            .mockResolvedValue({ level: 6 }); // Subsequent calls return level 6

        await act(async () => {
            render(<LevelUpWatcher />);
        });

        // Initial state: no modal
        expect(screen.queryByTestId("level-up-modal")).toBeNull();

        // Fast-forward time to trigger polling
        await act(async () => {
            jest.advanceTimersByTime(2000);
        });

        // Should show modal with new level
        await waitFor(() => {
            expect(screen.getByTestId("level-up-modal")).toHaveTextContent("Level Up! 6");
        });
    });

    it("should not show modal if level stays the same", async () => {
        (getUserStats as jest.Mock).mockResolvedValue({ level: 5 });

        await act(async () => {
            render(<LevelUpWatcher />);
        });

        // Fast-forward time
        await act(async () => {
            jest.advanceTimersByTime(2000);
        });

        expect(screen.queryByTestId("level-up-modal")).toBeNull();
    });
});
