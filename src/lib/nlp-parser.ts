import { addDays, addWeeks, addMonths, startOfTomorrow, startOfToday, nextMonday, nextFriday, nextSaturday, nextSunday } from "date-fns";

export interface ParsedTask {
    title: string;
    priority?: "none" | "low" | "medium" | "high";
    dueDate?: Date;
    energyLevel?: "high" | "medium" | "low";
    context?: "computer" | "phone" | "errands" | "meeting" | "home" | "anywhere";
}

export function parseNaturalLanguage(input: string): ParsedTask {
    let cleanTitle = input;
    let priority: "none" | "low" | "medium" | "high" = "none";
    let dueDate: Date | undefined;
    let energyLevel: "high" | "medium" | "low" | undefined;
    let context: "computer" | "phone" | "errands" | "meeting" | "home" | "anywhere" | undefined;

    // Priority patterns: !high, !h, !medium, !m, !low, !l
    const priorityMatch = input.match(/!\s*(high|h|medium|m|low|l)\b/i);
    if (priorityMatch) {
        const p = priorityMatch[1].toLowerCase();
        if (p === "high" || p === "h") priority = "high";
        else if (p === "medium" || p === "m") priority = "medium";
        else if (p === "low" || p === "l") priority = "low";
        cleanTitle = cleanTitle.replace(priorityMatch[0], "").trim();
    }

    // Energy level patterns: 🔋high, 🔌medium, 🪫low or @energy:high
    const energyMatch = input.match(/@energy:\s*(high|medium|low)\b/i);
    if (energyMatch) {
        energyLevel = energyMatch[1].toLowerCase() as "high" | "medium" | "low";
        cleanTitle = cleanTitle.replace(energyMatch[0], "").trim();
    }

    // Context patterns: @computer, @phone, @errands, @meeting, @home, @anywhere or emojis
    const contextMatch = input.match(/@(computer|phone|errands|meeting|home|anywhere)\b/i);
    if (contextMatch) {
        context = contextMatch[1].toLowerCase() as "computer" | "phone" | "errands" | "meeting" | "home" | "anywhere";
        cleanTitle = cleanTitle.replace(contextMatch[0], "").trim();
    }

    // Emoji context detection
    if (input.includes("💻")) {
        context = "computer";
        cleanTitle = cleanTitle.replace("💻", "").trim();
    } else if (input.includes("📱")) {
        context = "phone";
        cleanTitle = cleanTitle.replace("📱", "").trim();
    } else if (input.includes("🏃")) {
        context = "errands";
        cleanTitle = cleanTitle.replace("🏃", "").trim();
    } else if (input.includes("👥")) {
        context = "meeting";
        cleanTitle = cleanTitle.replace("👥", "").trim();
    } else if (input.includes("🏠")) {
        context = "home";
        cleanTitle = cleanTitle.replace("🏠", "").trim();
    }

    // Date patterns - relative
    const today = startOfToday();

    if (/\btoday\b/i.test(input)) {
        dueDate = today;
        cleanTitle = cleanTitle.replace(/\btoday\b/i, "").trim();
    } else if (/\btomorrow\b/i.test(input)) {
        dueDate = startOfTomorrow();
        cleanTitle = cleanTitle.replace(/\btomorrow\b/i, "").trim();
    } else if (/\bin\s+(\d+)\s+days?\b/i.test(input)) {
        const match = input.match(/\bin\s+(\d+)\s+days?\b/i);
        if (match) {
            dueDate = addDays(today, parseInt(match[1]));
            cleanTitle = cleanTitle.replace(match[0], "").trim();
        }
    } else if (/\bin\s+(\d+)\s+weeks?\b/i.test(input)) {
        const match = input.match(/\bin\s+(\d+)\s+weeks?\b/i);
        if (match) {
            dueDate = addWeeks(today, parseInt(match[1]));
            cleanTitle = cleanTitle.replace(match[0], "").trim();
        }
    } else if (/\bin\s+(\d+)\s+months?\b/i.test(input)) {
        const match = input.match(/\bin\s+(\d+)\s+months?\b/i);
        if (match) {
            dueDate = addMonths(today, parseInt(match[1]));
            cleanTitle = cleanTitle.replace(match[0], "").trim();
        }
    } else if (/\bnext\s+monday\b/i.test(input)) {
        dueDate = nextMonday(today);
        cleanTitle = cleanTitle.replace(/\bnext\s+monday\b/i, "").trim();
    } else if (/\bnext\s+friday\b/i.test(input)) {
        dueDate = nextFriday(today);
        cleanTitle = cleanTitle.replace(/\bnext\s+friday\b/i, "").trim();
    } else if (/\bnext\s+saturday\b/i.test(input)) {
        dueDate = nextSaturday(today);
        cleanTitle = cleanTitle.replace(/\bnext\s+saturday\b/i, "").trim();
    } else if (/\bnext\s+sunday\b/i.test(input)) {
        dueDate = nextSunday(today);
        cleanTitle = cleanTitle.replace(/\bnext\s+sunday\b/i, "").trim();
    }

    // Clean up extra spaces
    cleanTitle = cleanTitle.replace(/\s+/g, " ").trim();

    return {
        title: cleanTitle,
        priority: priority !== "none" ? priority : undefined,
        dueDate,
        energyLevel,
        context,
    };
}

// Examples:
// "Buy milk tomorrow !high @errands" => { title: "Buy milk", priority: "high", dueDate: tomorrow, context: "errands" }
// "Call John next Friday @phone" => { title: "Call John", dueDate: nextFriday, context: "phone" }
// "Finish report in 3 days !medium @computer" => { title: "Finish report", priority: "medium", dueDate: in3days, context: "computer" }
