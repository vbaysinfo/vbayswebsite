/** Directions link: uses the admin-provided Google Maps URL, else the address. */
export function directionsUrl(mapsUrl: string, address: string) {
  if (mapsUrl) return mapsUrl;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

/** Keyless Google Maps embed for an address or place. */
export function mapEmbedUrl(address: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}
