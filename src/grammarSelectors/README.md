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

## Spell Checking
- As much as possible, work with text in a stream like fashion, line by line.
- Apply applicable grammars to each line of text and extract the scopes.
- Some transformations may need to be applied before the text can be checked against the dictionary
  - for example: `Don\'t walk` needs to become `Don't walk`
  - this should be done with some sort of deterministic substitution.
  - It can only be done after the grammar scopes are applied.
  - We need to keep track of the before and after ranges so errors can be correctly communicated.
  - after substitution, scope merging should be possible.

## Definition

- Scope is a space separate list of scope tags.
