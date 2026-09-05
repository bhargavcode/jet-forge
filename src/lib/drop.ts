export function nodeIdFromOver(overId: string | number, data?: { targetId?: string; nodeId?: string } | null) {
  if (data?.targetId) return String(data.targetId);
  if (data?.nodeId) return String(data.nodeId);
  const id = String(overId);
  if (id.startsWith("layer-drop-")) return id.slice("layer-drop-".length);
  if (id.startsWith("layer-")) return id.slice("layer-".length);
  if (id.startsWith("node-slot-")) return id.slice("node-slot-".length);
  if (id.startsWith("node-")) return id.slice("node-".length);
  return id;
}
