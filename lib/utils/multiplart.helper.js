"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchesAllowed = exports.getExt = void 0;
const getExt = (filename) => {
    const i = filename.lastIndexOf(".");
    return i >= 0 ? filename.slice(i).toLowerCase() : "";
};
exports.getExt = getExt;
const matchesAllowed = (allowed, mimeType, filename) => {
    const ext = (0, exports.getExt)(filename);
    const mt = (mimeType || "").toLowerCase();
    for (const ruleRaw of allowed) {
        const rule = ruleRaw.toLowerCase().trim();
        if (!rule)
            continue;
        // extension rule: ".pdf"
        if (rule.startsWith(".")) {
            if (ext === rule)
                return true;
            continue;
        }
        // wildcard mime: "image/*"
        if (rule.endsWith("/*")) {
            const prefix = rule.slice(0, rule.length - 1); // keep trailing "/"
            if (mt.startsWith(prefix))
                return true;
            continue;
        }
        // exact mime: "application/pdf"
        if (mt === rule)
            return true;
    }
    return false;
};
exports.matchesAllowed = matchesAllowed;
