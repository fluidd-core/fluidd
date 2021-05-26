import type * as monaco from 'monaco-editor'
type Monaco = typeof monaco;

/** String identifier like 'cpp' or 'java'. */
export type LanguageId = string;

export type LanguageInfo = {
  tokensProvider: monaco.languages.EncodedTokensProvider | null;
  configuration: monaco.languages.LanguageConfiguration | null;
};

/**
 * This function needs to be called before monaco.editor.create().
 *
 * @param languages the set of languages Monaco must know about up front.
 * @param fetchLanguageInfo fetches full language configuration on demand.
 * @param monaco instance of Monaco on which to register languages information.
 */
export function registerLanguages (
  languages: monaco.languages.ILanguageExtensionPoint[],
  fetchLanguageInfo: (language: LanguageId) => Promise<LanguageInfo>,
  monaco: Monaco
) {
  // We have to register all of the languages with Monaco synchronously before
  // we can configure them.
  for (const extensionPoint of languages) {
    // Recall that the id is a short name like 'cpp' or 'java'.
    const { id: languageId } = extensionPoint
    monaco.languages.register(extensionPoint)

    // Lazy-load the tokens provider and configuration data.
    monaco.languages.onLanguage(languageId, async () => {
      const { tokensProvider, configuration } = await fetchLanguageInfo(languageId)

      if (tokensProvider != null) {
        monaco.languages.setTokensProvider(languageId, tokensProvider)
      }

      if (configuration != null) {
        monaco.languages.setLanguageConfiguration(languageId, configuration)
      }
    })
  }
}
