// This is all pretty horrible. Need to automate.
const converter = require('monaco-vscode-textmate-theme-converter')
const fs = require('fs')

// Load the theme.
const file = fs.readFileSync('../src/monaco/theme/base.theme.vscode.ayu.mirage.json', 'utf8')
const baseTheme = JSON.parse(file)

// Convert it.
const theme = converter.convertTheme(baseTheme)

// Our themes should have some base colors applied to match Fluidd.
theme.inherit = true
theme.colors['editor.background'] = '#28282b'
theme.colors['editor.lineHighlightBackground'] = '#3a3a3e'
theme.colors['minimap.background'] = '#28282b'

// ..and write it to the file system.
fs.writeFile('../src/monaco/theme/editor.theme.json', JSON.stringify(theme), (err) => {
  if (err) {
    throw err
  }
})
