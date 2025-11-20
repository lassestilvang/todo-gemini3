"use client";

import { useEffect, useState } from "react";
import { getUserStats } from "@/lib/actions";
import { LevelUpModal } from "./LevelUpModal";

export function LevelUpWatcher() {
    const [level, setLevel] = useState<number | null>(null);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [newLevel, setNewLevel] = useState(1);

    useEffect(() => {
        const checkLevel = async () => {
            const stats = await getUserStats();
            if (!stats) return;

            if (level === null) {
                // First load, just set the level without showing modal
                setLevel(stats.level);
            } else if (stats.level > level) {
                // Level increased while watching
                setNewLevel(stats.level);
                setShowLevelUp(true);
                setLevel(stats.level);
            }
        };

        // Initial check
        checkLevel();

        // Poll for level changes
        const interval = setInterval(checkLevel, 2000); // Check every 2 seconds

        return () => clearInterval(interval);
    }, [level]);

    return (
        <LevelUpModal
            open={showLevelUp}
            onOpenChange={setShowLevelUp}
            level={newLevel}
        />
    );
}
