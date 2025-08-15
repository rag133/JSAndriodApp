// --- Habit Types ---
export var HabitType;
(function (HabitType) {
    HabitType["BINARY"] = "binary";
    HabitType["COUNT"] = "count";
    HabitType["DURATION"] = "duration";
    HabitType["CHECKLIST"] = "checklist";
})(HabitType || (HabitType = {}));
export var HabitFrequencyType;
(function (HabitFrequencyType) {
    HabitFrequencyType["DAILY"] = "daily";
    HabitFrequencyType["WEEKLY"] = "weekly";
    HabitFrequencyType["MONTHLY"] = "monthly";
    HabitFrequencyType["SPECIFIC_DAYS"] = "specific_days";
})(HabitFrequencyType || (HabitFrequencyType = {}));
// Unified comparison types that work for both web and mobile
export var HabitTargetComparison;
(function (HabitTargetComparison) {
    // Primary comparison types
    HabitTargetComparison["GREATER_THAN"] = "greater_than";
    HabitTargetComparison["GREATER_THAN_OR_EQUAL"] = "greater_than_or_equal";
    HabitTargetComparison["LESS_THAN"] = "less_than";
    HabitTargetComparison["LESS_THAN_OR_EQUAL"] = "less_than_or_equal";
    HabitTargetComparison["EQUAL"] = "equal";
    // Aliases for backward compatibility
    HabitTargetComparison["AT_LEAST"] = "at_least";
    HabitTargetComparison["EXACTLY"] = "exactly";
    HabitTargetComparison["ANY_VALUE"] = "any_value";
    // Legacy mobile app aliases
    HabitTargetComparison["at-least"] = "at_least";
    HabitTargetComparison["less-than"] = "less_than";
    HabitTargetComparison["exactly"] = "exactly";
    HabitTargetComparison["any-value"] = "any_value";
})(HabitTargetComparison || (HabitTargetComparison = {}));
// Unified habit status that works for both web and mobile
export var HabitStatus;
(function (HabitStatus) {
    // Primary status types (web app standard)
    HabitStatus["YET_TO_START"] = "Yet to Start";
    HabitStatus["IN_PROGRESS"] = "In Progress";
    HabitStatus["COMPLETED"] = "Completed";
    HabitStatus["ABANDONED"] = "Abandoned";
    // Mobile app status types (aliases for compatibility)
    HabitStatus["ACTIVE"] = "In Progress";
    HabitStatus["PAUSED"] = "Yet to Start";
    HabitStatus["ARCHIVED"] = "Abandoned";
})(HabitStatus || (HabitStatus = {}));
// Unified habit log status that works for both web and mobile
export var HabitLogStatus;
(function (HabitLogStatus) {
    // Primary status types (web app standard)
    HabitLogStatus["DONE"] = "done";
    HabitLogStatus["PARTIAL"] = "partial";
    HabitLogStatus["NONE"] = "none";
    // Legacy status aliases for backward compatibility
    HabitLogStatus["COMPLETED"] = "done";
    HabitLogStatus["SKIPPED"] = "none";
    HabitLogStatus["FAILED"] = "none";
})(HabitLogStatus || (HabitLogStatus = {}));
// --- Goal Types ---
export var GoalStatus;
(function (GoalStatus) {
    GoalStatus["NOT_STARTED"] = "Not Started";
    GoalStatus["IN_PROGRESS"] = "In Progress";
    GoalStatus["COMPLETED"] = "Completed";
    GoalStatus["ABANDONED"] = "Abandoned";
    // Mobile app compatibility aliases
    GoalStatus["ACTIVE"] = "In Progress";
    GoalStatus["PAUSED"] = "Not Started";
    GoalStatus["CANCELLED"] = "Abandoned";
})(GoalStatus || (GoalStatus = {}));
// --- Milestone Types ---
export var MilestoneStatus;
(function (MilestoneStatus) {
    MilestoneStatus["NOT_STARTED"] = "Not Started";
    MilestoneStatus["IN_PROGRESS"] = "In Progress";
    MilestoneStatus["COMPLETED"] = "Completed";
    MilestoneStatus["ABANDONED"] = "Abandoned";
    // Mobile app compatibility aliases
    MilestoneStatus["PLANNED"] = "Not Started";
    MilestoneStatus["CANCELLED"] = "Abandoned";
})(MilestoneStatus || (MilestoneStatus = {}));
// --- Quick Win Types ---
export var QuickWinStatus;
(function (QuickWinStatus) {
    QuickWinStatus["PENDING"] = "Pending";
    QuickWinStatus["COMPLETED"] = "Completed";
    // Mobile app compatibility aliases
    QuickWinStatus["PLANNED"] = "Pending";
    QuickWinStatus["CANCELLED"] = "Pending";
})(QuickWinStatus || (QuickWinStatus = {}));
