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

Translations are hosted on Weblate. If you want to help translating our project, please click the widget below:

[![Translation status](https://hosted.weblate.org/widget/fluidd/horizontal-auto.svg)](https://hosted.weblate.org/engage/fluidd/ "Translation status")

## Tooling

### vue-i18n-extract

Fluidd ships with [vue-i18n-extract](https://github.com/kazupon/vue-i18n-extensions) as a dev dependency, and has an npm script
pre-defined.

```bash
npm run i18n-extract
```

Running the above will output a list of missing translations, and un-used keys
should there be any.

### VSCode and i18n Ally

If you prefer, you can use VSCode and the [i18n Ally](https://marketplace.visualstudio.com/items?itemName=antfu.i18n-ally) extension to help translating offline.

If you're setup with VSCode, then this extension comes highly recommended.

Once you have a translation in hand, you can either PR the code changes directly or create an issue with the translations attached.
