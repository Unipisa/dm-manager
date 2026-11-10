import React from 'react'
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import { getDMURL, isEnglish, truncateTextByWords } from '../utils'

// Shared presentation for event lists and individual event pages.
export function EventHeading({ title, href, typeLabel }) {
    return <h3 className={`title entry-title${typeLabel ? ' dm-heading-with-badge' : ''}`}>
        {typeLabel && <span className="dm-event-list-type dm-widget-badge">{typeLabel}</span>}
        <span className="dm-heading-text">{href !== undefined ? <a href={href}>{title}</a> : title}</span>
    </h3>
}

export function EventMetadata({ items }) {
    return <p className="dm-event-meta">
        <small className="dm-event-meta-items">
            {items.filter(item => item.content).map(({ icon, content }) => (
                <React.Fragment key={icon}>
                    <span className="dm-event-meta-item">
                        <span className={icon} aria-hidden="true"></span>{' '}{content}
                    </span>{' '}
                </React.Fragment>
            ))}
        </small>
    </p>
}

// Return null when there is no location, so the metadata also hides its icon.
export function getEventRoom({ room, institution, en }) {
    if (!room?.name) return institution?.name || null
    if (!room.room) return room.name

    const url = getDMURL(`/${en ? 'map' : 'mappa'}?sel=${room.room}`)
    return <a href={url} target="_blank" rel="noopener noreferrer">{room.name}</a>
}

export function EventDescription({ children, excerpt = false }) {
    if (excerpt && !children) return null

    const content = <Markdown components={excerpt ? { img: () => null } : undefined} remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
        {excerpt ? truncateTextByWords(children, 35) : children}
    </Markdown>

    return excerpt ? <div className="dm-event-list-excerpt">{content}</div> : content
}

export function EventFlyer({ url, title }) {
    if (!url) return null

    return <p className="dm-event-flyer">
        <img src={url} alt={`${isEnglish() ? 'Flyer' : 'Locandina'}: ${title}`} />
    </p>
}
