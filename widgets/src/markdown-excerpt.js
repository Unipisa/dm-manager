// Parse Markdown first, then build a compact paragraph for event previews.
// Math/code nodes stay whole, so shortening a preview cannot break their syntax.
export function remarkExcerpt({ maxWords = 30 } = {}) {
    return tree => {
        function inline(node) {
            if (node.type === 'text') return [{ ...node, value: node.value.replace(/\s+/g, ' ') }];
            if (node.type === 'inlineMath' || node.type === 'inlineCode') return [node];
            if (node.type === 'math') return [{
                type: 'inlineMath', value: node.value,
                data: {
                    hName: 'code', hProperties: { className: ['language-math', 'math-inline'] },
                    hChildren: [{ type: 'text', value: node.value }],
                },
            }];
            if (node.type === 'code') return [{ type: 'inlineCode', value: node.value }];
            if (['image', 'imageReference', 'definition', 'footnoteDefinition', 'footnoteReference'].includes(node.type)) return [];
            const children = (node.children || []).flatMap(inline);
            if (['strong', 'emphasis', 'delete', 'link'].includes(node.type)) return [{ ...node, children }];
            // Headings, paragraphs, list items and table cells become regular inline text.
            return [...children, { type: 'text', value: ' ' }];
        }

        let remaining = maxWords;
        let truncated = false;
        function shorten(node) {
            if (node.children) return { ...node, children: node.children.map(shorten).filter(Boolean) };
            if (node.type === 'text') {
                const words = [...node.value.matchAll(/\s*\S+/g)];
                if (words.length <= remaining) {
                    remaining -= words.length;
                    return node;
                }
                const value = words.slice(0, remaining).map(word => word[0]).join('');
                remaining = 0;
                truncated = true;
                return value ? { ...node, value } : null;
            }
            if (remaining > 0) {
                remaining -= 1;
                return node;
            }
            truncated = true;
            return null;
        }

        const children = tree.children.flatMap(inline).map(shorten).filter(Boolean);
        if (truncated) children.push({ type: 'text', value: '…' });
        tree.children = [{ type: 'paragraph', children }];
    };
}
