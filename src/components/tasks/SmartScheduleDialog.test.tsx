import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { SmartScheduleDialog } from "./SmartScheduleDialog";
import * as smartScheduler from "@/lib/smart-scheduler";
import { toast } from "sonner";

// Mock dependencies
mock.module("@/lib/smart-scheduler", () => ({
    generateSmartSchedule: mock(),
    applyScheduleSuggestion: mock()
}));

mock.module("sonner", () => ({
    toast: {
        success: mock(),
        error: mock(),
        info: mock()
    }
}));

describe("SmartScheduleDialog", () => {
    const mockOnOpenChange = mock();
    const mockGenerateSmartSchedule = smartScheduler.generateSmartSchedule as unknown as jest.Mock;
    const mockApplyScheduleSuggestion = smartScheduler.applyScheduleSuggestion as unknown as jest.Mock;

    beforeEach(() => {
        mockOnOpenChange.mockClear();
        mockGenerateSmartSchedule.mockClear();
        mockApplyScheduleSuggestion.mockClear();
        // Reset toast mocks
        (toast.success as jest.Mock).mockClear();
        (toast.error as jest.Mock).mockClear();
        (toast.info as jest.Mock).mockClear();
    });

    afterEach(() => {
        cleanup();
    });

    it("should render start screen when opened", () => {
        render(<SmartScheduleDialog open={true} onOpenChange={mockOnOpenChange} />);
        expect(screen.getByText("AI Smart Scheduling")).toBeDefined();
        expect(screen.getByText("Generate Schedule")).toBeDefined();
    });

    it("should handle generation loading state", async () => {
        mockGenerateSmartSchedule.mockReturnValue(new Promise(() => { })); // Never resolves
        render(<SmartScheduleDialog open={true} onOpenChange={mockOnOpenChange} />);

        fireEvent.click(screen.getByText("Generate Schedule"));

        expect(screen.getByText("Analyzing tasks...")).toBeDefined();
        expect(screen.getByRole("button", { name: /Analyzing tasks/i })).toBeDisabled();
    });

    it("should display suggestions after generation", async () => {
        const suggestions = [
            {
                taskId: 1,
                taskTitle: "Task 1",
                suggestedDate: new Date("2023-10-27T10:00:00"),
                reason: "High priority",
                confidence: 0.9
            }
        ];
        mockGenerateSmartSchedule.mockResolvedValue(suggestions);

        render(<SmartScheduleDialog open={true} onOpenChange={mockOnOpenChange} />);

        fireEvent.click(screen.getByText("Generate Schedule"));

        await waitFor(() => {
            expect(screen.getByText("Task 1")).toBeDefined();
            expect(screen.getByText("High priority")).toBeDefined();
            expect(screen.getByText("90% match")).toBeDefined();
        });
    });

    it("should handle empty suggestions", async () => {
        mockGenerateSmartSchedule.mockResolvedValue([]);

        render(<SmartScheduleDialog open={true} onOpenChange={mockOnOpenChange} />);

        fireEvent.click(screen.getByText("Generate Schedule"));

        await waitFor(() => {
            expect(toast.info).toHaveBeenCalledWith("No unscheduled tasks found to schedule!");
            expect(mockOnOpenChange).toHaveBeenCalledWith(false);
        });
    });

    it("should handle generation error", async () => {
        mockGenerateSmartSchedule.mockRejectedValue(new Error("API Error"));

        render(<SmartScheduleDialog open={true} onOpenChange={mockOnOpenChange} />);

        fireEvent.click(screen.getByText("Generate Schedule"));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Failed to generate schedule. Please check your API key.");
        });
    });

    it("should apply suggestion", async () => {
        const suggestions = [
            {
                taskId: 1,
                taskTitle: "Task 1",
                suggestedDate: new Date("2023-10-27T10:00:00"),
                reason: "High priority",
                confidence: 0.9
            }
        ];
        mockGenerateSmartSchedule.mockResolvedValue(suggestions);
        mockApplyScheduleSuggestion.mockResolvedValue(undefined);

        render(<SmartScheduleDialog open={true} onOpenChange={mockOnOpenChange} />);

        // Generate first
        fireEvent.click(screen.getByText("Generate Schedule"));
        await waitFor(() => screen.getByText("Task 1"));

        // Apply
        fireEvent.click(screen.getByText("Accept"));

        await waitFor(() => {
            expect(mockApplyScheduleSuggestion).toHaveBeenCalledWith(1, suggestions[0].suggestedDate);
            expect(toast.success).toHaveBeenCalledWith("Task scheduled!");
            expect(mockOnOpenChange).toHaveBeenCalledWith(false); // Closes because list empty
        });
    });

    it("should reject suggestion", async () => {
        const suggestions = [
            {
                taskId: 1,
                taskTitle: "Task 1",
                suggestedDate: new Date("2023-10-27T10:00:00"),
                reason: "High priority",
                confidence: 0.9
            }
        ];
        mockGenerateSmartSchedule.mockResolvedValue(suggestions);

        render(<SmartScheduleDialog open={true} onOpenChange={mockOnOpenChange} />);

        // Generate first
        fireEvent.click(screen.getByText("Generate Schedule"));
        await waitFor(() => screen.getByText("Task 1"));

        // Reject (using closest button to X icon if possible, or just by role/class logic if needed, but here we can try finding by icon or just the reject button)
        // The reject button has variant="outline" and contains X icon.
        // Let's assume it's the first button in the row or find by icon if possible.
        // Simpler: The reject button is the one with X icon.
        // We can find it by role button and filtering or just assuming structure.
        // Let's try to find by class or hierarchy if aria-label is missing (which it is).
        // Ideally I should add aria-label to the component, but I'll try to select it.
        const buttons = screen.getAllByRole("button");
        const rejectBtn = buttons.find(b => b.className.includes("text-red-500"));

        if (rejectBtn) {
            fireEvent.click(rejectBtn);
        } else {
            throw new Error("Reject button not found");
        }

        await waitFor(() => {
            expect(mockApplyScheduleSuggestion).not.toHaveBeenCalled();
            expect(mockOnOpenChange).toHaveBeenCalledWith(false); // Closes because list empty
        });
    });
});
