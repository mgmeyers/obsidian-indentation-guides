import { Line } from "@codemirror/text";

export function getLineIndent(line: Line) {
  const match = line.text.match(/^((?:\t| {4})+)/);

  if (!match) return 0;

  return match[1].split(/(?:\t| {4})/).length - 1;
}
