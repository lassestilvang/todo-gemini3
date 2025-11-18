"use client";

import { TaskItem } from "./TaskItem";

interface TaskListProps {
    tasks: {
        id: number;
        title: string;
        description: string | null;
        priority: "none" | "low" | "medium" | "high" | null;
        dueDate: Date | null;
        isCompleted: boolean | null;
        estimateMinutes: number | null;
    }[];
    title?: string;
}

export function TaskList({ tasks, title }: TaskListProps) {
    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <p>No tasks found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
            <div className="space-y-2">
                {tasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                ))}
            </div>
        </div>
    );
}
