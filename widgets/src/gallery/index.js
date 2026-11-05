import { widgets } from './config.js';

function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
}

function parameterTable(parameters) {
    const table = element('table', undefined, 'gallery-reference-table');
    const head = element('thead');
    const headings = element('tr');
    for (const label of ['Parameter', 'Usage']) {
        const cell = element('th', label);
        cell.scope = 'col';
        headings.append(cell);
    }
    head.append(headings);
    const body = element('tbody');
    for (const [name, description] of parameters) {
        const row = element('tr');
        const key = element('th');
        key.scope = 'row';
        key.append(element('code', name));
        row.append(key, element('td', description));
        body.append(row);
    }
    table.append(head, body);
    return table;
}

function widgetInfo(widget) {
    const info = element('section', undefined, 'gallery-widget-info');
    const title = element('h2', `${widget.component} · Data & filters`);
    title.id = `${widget.id}-info-title`;
    info.setAttribute('aria-labelledby', title.id);
    info.append(title);
    for (const route of widget.routes) {
        const line = element('p', undefined, 'gallery-route');
        line.append(element('code', `GET /api/v0/${route}`));
        info.append(line);
    }
    info.append(element('h3', 'Supported filters'));
    info.append(widget.filters.length
        ? parameterTable(widget.filters)
        : element('p', 'This widget does not expose configurable data filters.'));
    if (widget.notes) info.append(element('p', widget.notes));
    if (widget.options?.length) {
        const options = element('details');
        options.append(element('summary', 'Display options'), parameterTable(widget.options));
        info.append(options);
    }
    const examples = element('details');
    examples.append(element('summary', 'Current preview props · edit gallery/config.js'));
    examples.append(element('pre', JSON.stringify(widget.props, null, 2)));
    for (const preview of widget.additionalPreviews || []) {
        examples.append(element('h3', preview.target), element('pre', JSON.stringify(preview.props, null, 2)));
    }
    info.append(examples);
    return info;
}

export function initializeGallery(dmwidgets) {
    dmwidgets.localDevelopment = true;
    const loaded = new Set();
    const definitions = new Map(widgets.map(widget => [widget.id, widget]));
    const tabs = $('.gallery-widget-list a[data-toggle="tab"]');
    const infoRegion = document.getElementById('gallery-widget-info-region');
    const infoBoxes = new Map();

    for (const widget of widgets) {
        const info = widgetInfo(widget);
        info.hidden = true;
        infoBoxes.set(widget.id, info);
        infoRegion.append(info);
    }

    function selectWidget(id) {
        for (const [widgetId, info] of infoBoxes) {
            info.hidden = widgetId !== id;
        }
        loadPreview(definitions.get(id));
    }

    async function loadPreview(widget) {
        if (!widget || loaded.has(widget.id)) return;
        loaded.add(widget.id);
        const target = document.getElementById(widget.id);
        try {
            const props = { ...widget.props };
            if (widget.lookup && !props[widget.lookup.prop]) {
                target.textContent = 'Loading preview…';
                const response = await fetch(dmwidgets.getManageURL(widget.lookup.route, widget.lookup.query));
                if (!response.ok) throw new Error('Could not load sample data');
                const { data } = await response.json();
                if (!data?.length) {
                    target.textContent = 'No sample records available in the local database. Set an ID in gallery/config.js.';
                    return;
                }
                props[widget.lookup.prop] = data[0]._id;
                target.textContent = '';
            }
            dmwidgets.loadComponent(target, widget.component, props);
            for (const preview of widget.additionalPreviews || []) {
                dmwidgets.loadComponent(document.getElementById(preview.target), widget.component, preview.props);
            }
        } catch (error) {
            loaded.delete(widget.id);
            target.textContent = 'Could not load this preview. Check the local backend and the values in gallery/config.js, then select this widget again.';
            console.error(`Could not load ${widget.component} preview`, error);
        }
    }

    tabs.on('shown.bs.tab', function () {
        // Bootstrap 4 does not clear active links nested inside category rows.
        tabs.not(this).removeClass('active').attr('aria-selected', 'false');
        const selected = $(this).attr('href');
        try { localStorage.setItem('lastTab', selected); } catch { /* Storage may be disabled. */ }
        selectWidget(selected.slice(1));
    });

    let lastTab;
    try { lastTab = localStorage.getItem('lastTab'); } catch { /* Use the default tab. */ }
    if (lastTab) {
        tabs.filter(function () { return $(this).attr('href') === lastTab; }).tab('show');
    }
    const activeTab = document.querySelector('.gallery-widget-list .nav-link.active');
    selectWidget(activeTab.getAttribute('href').slice(1));
}
