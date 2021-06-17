/**
 * This automates theme conversion from VSCode -> a textmate theme which is
 * usable by Fluidd's monaco implementation.
 *
 * The base dark theme is Ayu Mirage
 * The base light theme is VSCode's Light+
 *
 * Both the klipper-config and gcode extensions must be installed before
 * generating the base themes, otherwise the correct token colors won't be
 * generated.
 *
 * You can create the base theme by using VSCodes command pallette and using
 * the following command;
 * Developer: Generate Color Theme From Current Settings
 *
 * This is all otherwise pretty horrid, and we should think about automating
 * this further in the future.
 *
 * You can invoke this script using npm;
 * npm run theme.convert
 *
 * which will write the appropriate theme files in their intended location.
 */
const converter = require('monaco-vscode-textmate-theme-converter')
const fs = require('fs')

// Load the themes.
const dark = fs.readFileSync('../src/monaco/theme/base.theme.dark.json', 'utf8')
const baseDarkTheme = JSON.parse(dark)

const light = fs.readFileSync('../src/monaco/theme/base.theme.light.json', 'utf8')
const baseLightTheme = JSON.parse(light)

// Convert it.
const themeDark = converter.convertTheme(baseDarkTheme)
const themeLight = converter.convertTheme(baseLightTheme)

// Our themes should have some base colors applied to match Fluidd.
themeDark.inherit = true
themeDark.colors['editor.background'] = '#28282b'
themeDark.colors['editor.lineHighlightBackground'] = '#3a3a3e'
themeDark.colors['minimap.background'] = themeDark.colors['editor.background']
themeDark.rules.forEach(rule => {
  if (rule.foreground === '#5C6773') rule.foreground = '#7C8A99'
})

themeLight.inherit = false
themeLight.colors['minimap.background'] = themeLight.colors['editor.background']

// ..and write it to the file system.
fs.writeFile('../src/monaco/theme/editor.dark.theme.json', JSON.stringify(themeDark), (err) => {
  if (err) {
    throw err
  }
})

fs.writeFile('../src/monaco/theme/editor.light.theme.json', JSON.stringify(themeLight), (err) => {
  if (err) {
    throw err
  }
})
