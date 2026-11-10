const assert = require('node:assert/strict')
const {test} = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const {createRequire} = require('node:module')

// Render fixtures only. No server startup, database access or HTTP calls.
const widgetRequire = createRequire(path.resolve(__dirname,'../../widgets/package.json'))
const {transformSync} = widgetRequire('esbuild')
const React = widgetRequire('react')
const {renderToStaticMarkup} = widgetRequire('react-dom/server')
const modules = new Map()
let queryData
function loadWidget(file) {
    if (modules.has(file)) return modules.get(file).exports
    const module={exports:{}}
    modules.set(file,module)
    vm.runInNewContext(transformSync(fs.readFileSync(file,'utf8'),{loader:'jsx',format:'cjs'}).code,{
        module,exports:module.exports,document:{documentElement:{lang:'it'},cookie:''},
        require(name) {
            if (name.endsWith('.css')) return {}
            if (name === 'react-query') return {useQuery:() => ({data:queryData})}
            if (name === 'axios') return {get:() => assert.fail('Unexpected HTTP request')}
            if (name.startsWith('.')) return loadWidget(path.resolve(path.dirname(file),name+'.js'))
            return widgetRequire(name)
        },
    },{filename:file})
    return module.exports
}
const {MarkdownExcerpt}=loadWidget(path.resolve(__dirname,'../../widgets/src/components/MarkdownExcerpt.js'))
const {HomeEventList}=loadWidget(path.resolve(__dirname,'../../widgets/src/components/HomeEventList.js'))
const {EventDescription}=loadWidget(path.resolve(__dirname,'../../widgets/src/components/EventContent.js'))
const render=(text,maxWords) => renderToStaticMarkup(React.createElement(MarkdownExcerpt,{maxWords},text))

test('programme headings and lists form a compact preview without raw Markdown markers',() => {
    const text='### Programma indicativo dell’incontro\n\n#### 10:00–10:30\n\n- Welcome and HPSC overview (Luca)\n- Wave equation and inversion\n- Accelerating Cures\n- FLASH radiotherapy technology'
    const html=render(text)
    for (const expected of ['Programma indicativo','10:00–10:30','Welcome and HPSC','Wave equation','FLASH radiotherapy']) assert.ok(html.includes(expected),expected)
    for (const absent of ['<h1','<h2','<h3','<h4','<ul','<li','###']) assert.ok(!html.includes(absent),absent)
})

test('truncation keeps complete LaTeX nodes and does not expose unfinished delimiters',() => {
    const math='u\\in {\\rm GBD}(\\Omega)'
    const html=render(`deformation $${math}$ a measure $\\mu_u$ tail after`,4)
    assert.equal((html.match(/class="katex"/g) || []).length,1)
    assert.ok(html.includes('encoding="application/x-tex">'+math))
    assert.ok(html.includes('…') && !html.includes('tail after'))
    assert.ok(!html.includes('katex-error'))
})

test('inline formatting and links survive truncation, and hidden remainder is omitted',() => {
    const html=render('First **second** [third](https://example.org) fourth fifth',3)
    assert.ok(html.includes('<strong>second</strong>'))
    assert.ok(html.includes('href="https://example.org">third</a>'))
    assert.ok(html.includes('…') && !html.includes('fourth') && !html.includes('fifth'))
    assert.ok(!render('Exactly three words',3).includes('…'))
})

test('display equations and code stay intact while images and definitions do not fill the excerpt',() => {
    let html=render('Before\n\n$$\na + b = c\n$$\n\nAfter',3)
    assert.ok(html.includes('encoding="application/x-tex">a + b = c'))
    assert.ok(!html.includes('katex-display') && !html.includes('katex-error'))
    html=render('Before `code with spaces` after more',2)
    assert.ok(html.includes('<code>code with spaces</code>') && !html.includes('after'))
    html=render('Text ![Flyer](https://example.org/flyer.png)\n\n[unused]: https://example.org')
    assert.ok(html.includes('Text') && !html.includes('<img') && !html.includes('flyer.png'))
})

test('only event excerpts are shortened; full descriptions retain headings and lists',() => {
    const text='### Programme\n\n- Welcome\n- Discussion'
    const full=renderToStaticMarkup(React.createElement(EventDescription,{},text))
    assert.ok(full.includes('<h3>Programme</h3>') && full.includes('<li>Welcome</li>'))
    const excerpt=renderToStaticMarkup(React.createElement(EventDescription,{excerpt:true},text))
    assert.ok(excerpt.includes('Programme') && !excerpt.includes('<h3') && !excerpt.includes('<ul'))
})

test('HomeEventList renders compact descriptions and still honors show_excerpt',() => {
    queryData=[{_id:'conference',type:'conference',title:'Example event',startDate:'2026-11-10',endDate:'2026-11-11',
        description:'### Programme\n\n#### Morning\n\n- Welcome\n- Discussion'}]
    let html=renderToStaticMarkup(React.createElement(HomeEventList,{default_entries:1}))
    assert.ok(html.includes('Example event') && html.includes('dm-markdown-excerpt'))
    assert.ok(!html.includes('####') && !html.includes('<h3>Programme'))
    html=renderToStaticMarkup(React.createElement(HomeEventList,{default_entries:1,show_excerpt:false}))
    assert.ok(html.includes('Example event') && !html.includes('dm-markdown-excerpt'))
})
