import { getSettings } from "@/lib/server/content";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const settings = await getSettings();
  return <HeaderClient settings={settings} />;
}
