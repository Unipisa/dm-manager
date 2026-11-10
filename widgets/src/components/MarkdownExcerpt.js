import React from 'react';
import Markdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import { remarkExcerpt } from '../markdown-excerpt';

export function MarkdownExcerpt({ children, maxWords = 30 }) {
    if (!children) return null;
    return <div className="dm-markdown-excerpt">
        <Markdown remarkPlugins={[remarkMath, remarkGfm, [remarkExcerpt, { maxWords }]]} rehypePlugins={[rehypeKatex]}>
            {children}
        </Markdown>
    </div>;
}
