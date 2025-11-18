import {
    ListTodo,
    Briefcase,
    Home,
    User,
    Star,
    Settings,
    ShoppingCart,
    Plane,
    Dumbbell,
    Book,
    Music,
    Video,
    Code,
    Coffee,
    Sun,
    Moon,
    Hash,
    Tag,
    Flag,
    Bookmark,
    AlertCircle,
    CheckCircle,
    Clock,
    Zap,
    Heart
} from "lucide-react";

export const LIST_ICONS = [
    { name: "list", icon: ListTodo },
    { name: "briefcase", icon: Briefcase },
    { name: "home", icon: Home },
    { name: "user", icon: User },
    { name: "star", icon: Star },
    { name: "settings", icon: Settings },
    { name: "shopping-cart", icon: ShoppingCart },
    { name: "plane", icon: Plane },
    { name: "dumbbell", icon: Dumbbell },
    { name: "book", icon: Book },
    { name: "music", icon: Music },
    { name: "video", icon: Video },
    { name: "code", icon: Code },
    { name: "coffee", icon: Coffee },
    { name: "sun", icon: Sun },
    { name: "moon", icon: Moon },
];

export const LABEL_ICONS = [
    { name: "hash", icon: Hash },
    { name: "tag", icon: Tag },
    { name: "flag", icon: Flag },
    { name: "bookmark", icon: Bookmark },
    { name: "alert", icon: AlertCircle },
    { name: "check", icon: CheckCircle },
    { name: "clock", icon: Clock },
    { name: "zap", icon: Zap },
    { name: "heart", icon: Heart },
    { name: "star", icon: Star },
];

export function getListIcon(name: string | null) {
    if (!name) return ListTodo;
    return LIST_ICONS.find((i) => i.name === name)?.icon || ListTodo;
}

export function getLabelIcon(name: string | null) {
    if (!name) return Hash;
    return LABEL_ICONS.find((i) => i.name === name)?.icon || Hash;
}
