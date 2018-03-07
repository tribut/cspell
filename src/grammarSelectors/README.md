# Grammar Selectors

This is a jumble of thoughts around how to use grammar scope to do spell checking.

## ideas

- More than 1 grammar can be applied to the same text.
- which means a single piece of text can have multiple scopes.
- Scope is a space separate list of scope tags.
- Multiple scopes are separated by a comma.
- css like selectors are used to determine which cspell settings to apply.
- settings are applies general to specific. More specific settings override general settings.
- settings are merged in a css like way.
- selectors can be defined hierarchically

## Definition

- Scope is a space separate list of scope tags.
