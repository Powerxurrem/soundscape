export function getOrCreateDeviceId() {
  if (typeof window === "undefined") return "";
  const key = "soundscape_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
