export const getExt = (filename: string) => {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i).toLowerCase() : "";
};

export const matchesAllowed = (allowed: string[], mimeType: string, filename: string) => {
  const ext = getExt(filename);
  const mt = (mimeType || "").toLowerCase();

  for (const ruleRaw of allowed) {
    const rule = ruleRaw.toLowerCase().trim();
    if (!rule) continue;

    // extension rule: ".pdf"
    if (rule.startsWith(".")) {
      if (ext === rule) return true;
      continue;
    }

    // wildcard mime: "image/*"
    if (rule.endsWith("/*")) {
      const prefix = rule.slice(0, rule.length - 1); // keep trailing "/"
      if (mt.startsWith(prefix)) return true;
      continue;
    }

    // exact mime: "application/pdf"
    if (mt === rule) return true;
  }

  return false;
};
