import { defineConfig, transformWithEsbuild } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const rootDir = path.resolve(__dirname, 'src')
const distDir = path.resolve(__dirname, 'dist')
const productionEnv = JSON.stringify('production')

function getInlineCssScript(css) {
  return `(() => {
  if (!document.getElementById('dmwidgets-styles')) {
    const style = document.createElement('style');
    style.id = 'dmwidgets-styles';
    style.textContent = ${JSON.stringify(css)};
    document.head.appendChild(style);
  }
})();
`
}

async function minifyCss(css) {
  const { code } = await transformWithEsbuild(css, 'dmwidgets.css', {
    loader: 'css',
    minify: true,
    legalComments: 'none',
  })

  return code
}

async function minifyScriptFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const js = fs.readFileSync(filePath, 'utf8')
  const { code } = await transformWithEsbuild(js, filePath, {
    loader: 'js',
    minify: true,
    target: 'es2018',
    define: {
      'process.env.NODE_ENV': productionEnv,
    },
    legalComments: 'none',
  })

  fs.writeFileSync(filePath, code)
}

function inlineCssAndCopyStatic() {
  return {
    name: 'dmwidgets-build-assets',
    async generateBundle(_, bundle) {
      const cssFiles = Object.entries(bundle).filter(([, asset]) => asset.type === 'asset' && asset.fileName.endsWith('.css'))
      const jsChunk = Object.values(bundle).find((asset) => asset.type === 'chunk' && asset.fileName === 'dmwidgets.js')

      if (jsChunk && cssFiles.length > 0) {
        const css = await minifyCss(cssFiles.map(([, asset]) => asset.source).join('\n'))
        jsChunk.code = `${getInlineCssScript(css)}${jsChunk.code}`

        for (const [fileName] of cssFiles) {
          delete bundle[fileName]
        }
      }
    },
    async closeBundle() {
      const cssPath = path.join(distDir, 'style.css')
      const jsPath = path.join(distDir, 'dmwidgets.js')

      if (fs.existsSync(cssPath) && fs.existsSync(jsPath)) {
        const css = await minifyCss(fs.readFileSync(cssPath, 'utf8'))
        const js = fs.readFileSync(jsPath, 'utf8')

        fs.writeFileSync(jsPath, `${getInlineCssScript(css)}${js}`)
        fs.unlinkSync(cssPath)
      }

      fs.mkdirSync(path.join(distDir, 'static'), { recursive: true })
      fs.copyFileSync(path.resolve(__dirname, 'static/NoImage.png'), path.join(distDir, 'static/NoImage.png'))

      const galleryHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8')
        .replace('<script type="module">', '<script src="./dmwidgets.js"></script>\n    <script>')
        .replace("import { dmwidgets } from './index.js';\n", '')

      fs.writeFileSync(path.join(distDir, 'index.html'), galleryHtml)
      await minifyScriptFile(jsPath)
    },
  }
}

function treatJsAsJsx() {
  return {
    name: 'treat-js-files-as-jsx',
    enforce: 'pre',
    async transform(code, id) {
      if (!id.startsWith(rootDir) || !id.endsWith('.js')) return null

      return transformWithEsbuild(code, id, {
        loader: 'jsx',
        jsx: 'automatic',
      })
    },
  }
}

export default defineConfig({
  root: rootDir,
  define: {
    'process.env.NODE_ENV': productionEnv,
  },
  plugins: [
    treatJsAsJsx(),
    react(),
    inlineCssAndCopyStatic(),
  ],
  server: {
    port: 8001,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  build: {
    outDir: distDir,
    emptyOutDir: true,
    lib: {
      entry: path.join(rootDir, 'index.js'),
      name: 'dmwidgetsBundle',
      formats: ['iife'],
      fileName: () => 'dmwidgets.js',
    },
  },
})
