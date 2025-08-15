export var LogType;
(function (LogType) {
    LogType["TEXT"] = "text";
    LogType["CHECKLIST"] = "checklist";
    LogType["RATING"] = "rating";
})(LogType || (LogType = {}));
export const logTypeDetails = {
    [LogType.TEXT]: { name: 'Text', icon: 'Edit3Icon' },
    [LogType.CHECKLIST]: { name: 'Checklist', icon: 'CheckSquareIcon' },
    [LogType.RATING]: { name: 'Rating', icon: 'StarIcon' },
};
