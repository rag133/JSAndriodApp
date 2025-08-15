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
export var HabitTargetComparison;
(function (HabitTargetComparison) {
    HabitTargetComparison["GREATER_THAN"] = "greater_than";
    HabitTargetComparison["GREATER_THAN_OR_EQUAL"] = "greater_than_or_equal";
    HabitTargetComparison["LESS_THAN"] = "less_than";
    HabitTargetComparison["LESS_THAN_OR_EQUAL"] = "less_than_or_equal";
    HabitTargetComparison["EQUAL"] = "equal";
    // Additional comparison types for advanced logic
    HabitTargetComparison["AT_LEAST"] = "at_least";
    HabitTargetComparison["EXACTLY"] = "exactly";
    HabitTargetComparison["ANY_VALUE"] = "any_value"; // Special case for any non-zero value
})(HabitTargetComparison || (HabitTargetComparison = {}));
export var HabitStatus;
(function (HabitStatus) {
    HabitStatus["YET_TO_START"] = "Yet to Start";
    HabitStatus["IN_PROGRESS"] = "In Progress";
    HabitStatus["COMPLETED"] = "Completed";
    HabitStatus["ABANDONED"] = "Abandoned";
})(HabitStatus || (HabitStatus = {}));
export var HabitLogStatus;
(function (HabitLogStatus) {
    HabitLogStatus["DONE"] = "done";
    HabitLogStatus["PARTIAL"] = "partial";
    HabitLogStatus["NONE"] = "none";
})(HabitLogStatus || (HabitLogStatus = {}));
// --- Goal Types ---
export var GoalStatus;
(function (GoalStatus) {
    GoalStatus["NOT_STARTED"] = "Not Started";
    GoalStatus["IN_PROGRESS"] = "In Progress";
    GoalStatus["COMPLETED"] = "Completed";
    GoalStatus["ABANDONED"] = "Abandoned";
})(GoalStatus || (GoalStatus = {}));
// --- Milestone Types ---
export var MilestoneStatus;
(function (MilestoneStatus) {
    MilestoneStatus["NOT_STARTED"] = "Not Started";
    MilestoneStatus["IN_PROGRESS"] = "In Progress";
    MilestoneStatus["COMPLETED"] = "Completed";
    MilestoneStatus["ABANDONED"] = "Abandoned";
})(MilestoneStatus || (MilestoneStatus = {}));
// --- Quick Win Types ---
export var QuickWinStatus;
(function (QuickWinStatus) {
    QuickWinStatus["PENDING"] = "Pending";
    QuickWinStatus["COMPLETED"] = "Completed";
})(QuickWinStatus || (QuickWinStatus = {}));
