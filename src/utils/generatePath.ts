// import type { SearchResult } from "../searchDb";

export function generatePath({ source, slug, objectID, file, role }: any) {
  const basePath = role === "admin" ? "/admin/page" : "";

  switch (source) {
    case "about-us":
      return basePath + "/about-us/" + slug;
    case "transparency-seal":
      return basePath + "/transparency-seal";
    case "transparency_seal":
      return `${file && `https://docs.google.com/gview?url=${encodeURIComponent(file.url)}&embedded=true`}`;
    case "news_and_updates":
      return "/post?id=" + objectID;
    default:
      return "";
  }
}
