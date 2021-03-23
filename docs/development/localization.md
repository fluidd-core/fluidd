---
layout: default
title: Localization
parent: Development
nav_order: 1
permalink: /development/localization
---

# Localization
{: .no_toc }

---

Fluidd uses [vue-i18n](https://kazupon.github.io/vue-i18n/) for its localization.

Locales can be found in the `src/locales` folder and are in YAML format.

## How to contribute

You can contribute in a couple of different ways;

1. Edit translations using an existing tool. For example, [BabelEdit](https://www.codeandweb.com/babeledit)

2. Edit translations using VSCode, and i18n Ally.

Once you have a translation in hand, you can either PR the code changes directly
or create an issue with the translations attached.

## Tooling

### vue-i18n-extract

Fluidd ships with [vue-i18n-extract](https://github.com/kazupon/vue-i18n-extensions) as a dev dependency, and has an npm script
pre-defined.

```bash
npm run i18n-extract
```

Running the above will output a list of missing translations, and un-used keys
should there be any.

### i18n Ally

[i18n Ally](https://marketplace.visualstudio.com/items?itemName=antfu.i18n-ally) is a VSCode extension, giving you inline detail about translations.
If you're setup with VSCode, then this extension comes highly recommended.
