import { LanguageId, DictionaryId, LocalId, LanguageSetting } from '../Settings/CSpellSettingsDef';

export interface SelectorSetting extends ScopeLevelSettings {
    /**
     * @description The selector a css like selector string
     * @example `meta.definition variable, meta.definition entity.name.function` will match against variable definitions and function names.
     */
    selector: string;
}

export interface ScopeLevelSettings {
    // Enable / disable spell checking for this scope
    enabled?: boolean;

    // True to enable compound word checking. This may lead to missed spelling errors (false negatives).
    allowCompoundWords?: boolean;

    // Forces the spell checker to assume a give language id. Used mainly as an Override.
    languageId?: LanguageId;

    // current active spelling language
    language?: LocalId;
}

/**
 * As this feature evolves, I want to add the following capabilities
 */
export interface FutureScopeLevelSettings {
    // The case of words can be ignored when comparing against the dictionary (true by default)
    ignoreCase?: boolean;       // Always true at the moment.

    // Accented characters are considered to match their base character (false by default)
    ignoreAccents?: boolean;    // Not currently supported

    // camelCase
    // snake_case
    // PascalCase
    // none
    textToWordsMode?: string | WordPatternMatch;

    // use settings from the repository, this allows for shared settings between scope selectors
    import?: string | string[];
}

export interface RootSettings {
    // Optional identifier
    id?: string;

    // Optional name of configuration
    name?: string;

    // Optional description of configuration
    description?: string;

    // Optional comment
    comment?: string;
}

export interface Setting {
    // Optional identifier
    id?: string;

    // Optional name of configuration
    name?: string;

    // Optional description of configuration
    description?: string;

    // Enabled
    enabled?: boolean;

    // True to enable compound word checking.
    allowCompoundWords?: boolean;

    // Optional list of dictionaries to use.
    dictionaries?: DictionaryId[];

    // current active spelling language
    language?: LocalId;

    // list of words to be always considered correct
    words?: string[];

    // list of words to be ignored
    ignoreWords?: string[];

    // list of words to always be considered incorrect.
    flagWords?: string[];

    // languageIds for the files to spell check.
    enabledLanguageIds?: LanguageId[];

    // The minimum length of a word before checking it against a dictionary.
    minWordLength?: number;

    // Number of suggestions to make
    numSuggestions?: number;

    // Additional settings for individual languages.
    languageSettings?: LanguageSetting[];

    // Forces the spell checker to assume a give language id. Used mainly as an Override.
    languageId?: LanguageId;
}

export interface WordPatternMatch {
    match: RegExpString;
    // Defines which capture group is considered the word by default it is the entire match.
    capture?: number;
}

export type RegExpString = string | RegExp;
