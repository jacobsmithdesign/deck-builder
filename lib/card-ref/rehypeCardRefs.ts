import { visit } from "unist-util-visit";
import { parseCardReferences } from "./parseCardReferences";

type TextNode = { type: "text"; value: string };
type ElementNode = {
  type: "element";
  tagName: string;
  properties: Record<string, unknown>;
  children: UnistNode[];
};
type UnistNode = TextNode | ElementNode | { type: string; children?: UnistNode[]; value?: string };

/**
 * Rehype plugin that replaces [[Card Name]] in text nodes with inline
 * <span data-card-ref="rawName"> elements so ReactMarkdown can render them
 * as card links. Single square brackets are left as-is.
 */
export function rehypeCardRefs() {
  return (tree: UnistNode) => {
    const toReplace: { parent: { children: UnistNode[] }; index: number; node: TextNode }[] = [];

    visit(tree, "text", (node, index, parent) => {
      if (parent == null || index == null) return;
      const textNode = node as TextNode;
      if (!/\[\[[^\]]+\]\]/.test(textNode.value)) return;
      toReplace.push({ parent: parent as { children: UnistNode[] }, index, node: textNode });
    });

    for (const { parent, index, node } of toReplace.reverse()) {
      const segments = parseCardReferences(node.value);
      const newNodes: UnistNode[] = segments.map((seg) => {
        if (seg.type === "text") {
          return { type: "text" as const, value: seg.value };
        }
        return {
          type: "element" as const,
          tagName: "span",
          properties: { dataCardRef: seg.rawName },
          children: [{ type: "text" as const, value: `[[${seg.rawName}]]` }],
        };
      });
      parent.children.splice(index, 1, ...newNodes);
    }
  };
}
