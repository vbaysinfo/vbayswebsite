import type { GalleryItem, Project } from "./types";

/** Every photo for a project: cover, its gallery list, and GALLERY-tab rows linked by Project ID. */
export function projectImages(p: Project, gallery: GalleryItem[]): string[] {
  return [...new Set([p.coverImage, ...p.galleryImages, ...gallery.filter((g) => g.projectId === p.projectId).map((g) => g.imageUrl)].filter(Boolean))];
}
