# react-native-readium-updated

[![NPM version](https://img.shields.io/npm/v/react-native-readium-updated.svg?color=success&label=npm%20package&logo=npm)](https://www.npmjs.com/package/react-native-readium-updated)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
![PRs welcome!](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)
![This project is released under the MIT license](https://img.shields.io/badge/license-MIT-blue.svg)

---



## Overview

A react-native wrapper for https://readium.org/. At a high level this package
allows you to do things like:

- Render an ebook view.
- Register for location changes (as the user pages through the book).
- Access publication metadata including table of contents, positions, and more via the `onPublicationReady` callback
- Control settings of the Reader. Things like:
  - Dark Mode, Light Mode, Sepia Mode
  - Font Size
  - Page Margins
  - More (see the `Settings` documentation in the [API section](#api))
- Etc. (read on for more details. :book:)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Supported Formats & DRM](#supported-formats--drm)
- [API](#api)
- [Contributing](#contributing)
- [Release](#release)
- [License](#license)

| Dark Mode                                                                                        | Light Mode                                                                                         |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| ![Dark Mode](https://github.com/SAV-7-X/react-native-readium-updated/blob/main/docs/demo-dark-mode.gif) | ![Light Mode](https://github.com/SAV-7-X/react-native-readium-updated/blob/main/docs/demo-light-mode.gif) |

## Installation

#### One-Command Install

```sh
npm i git+https://github.com/SAV-7-X/react-native-readium-updated.git
```

If you prefer Yarn:

```sh
yarn add git+https://github.com/SAV-7-X/react-native-readium-updated.git
```

This package is designed for a clean install: it brings in `react-native-nitro-modules`
transitively and runs the iOS setup automatically during install, so you do not need to
edit `ios/` or `android/` folders by hand for a standard setup.

It is also compatible with React Native's New Architecture stack, including JSI and Fabric,
through Nitro Modules. In practice that means the native view is exposed through generated
Nitro/Fabric bindings instead of a legacy manual bridge.

#### Requirements

- iOS deployment target: iOS 15.1 or newer
- Swift compiler: Swift 6.0
- Xcode: Xcode 16.4 or newer
- Android compileSdkVersion: 31 or newer
- JDK: 17 or newer
- Kotlin: 2.3.20 or newer

These are build-tool minimums, not manual install steps.

## Usage

### Basic Example

```tsx
import React, { useState } from 'react';
import { ReadiumView } from 'react-native-readium-updated';
import type { File } from 'react-native-readium-updated';

const MyComponent: React.FC = () => {
  const [file] = useState<File>({
    url: SOME_LOCAL_FILE_URL,
  });

  return <ReadiumView file={file} />;
};
```

### Using Publication Metadata

Access the table of contents, positions, and metadata when the publication is ready:

```tsx
import React, { useState } from 'react';
import { ReadiumView } from 'react-native-readium-updated';
import type { File, PublicationReadyEvent } from 'react-native-readium-updated';

const MyComponent: React.FC = () => {
  const [file] = useState<File>({
    url: SOME_LOCAL_FILE_URL,
  });

  const [toc, setToc] = useState([]);

  const handlePublicationReady = (event: PublicationReadyEvent) => {
    console.log('Title:', event.metadata.title);
    console.log('Author:', event.metadata.author);
    console.log('Table of Contents:', event.tableOfContents);
    console.log('Positions:', event.positions);

    setToc(event.tableOfContents);
  };

  return (
    <ReadiumView file={file} onPublicationReady={handlePublicationReady} />
  );
};
```

### Highlights & Note Taking

![Decorators](https://github.com/SAV-7-X/react-native-readium-updated/blob/main/docs/demo-decorators.gif)

The `selectionActions`, `decorations`, `onSelectionAction`, and `onDecorationActivated` props work together to build highlighting and note-taking features. Here's how the flow works:

1. **Define selection actions** to add custom items to the text selection context menu.
2. **Handle `onSelectionAction`** to capture what the user selected and which action they chose.
3. **Create a `Decoration`** from the selection's locator and add it to your `decorations` state.
4. **Handle `onDecorationActivated`** to let users tap existing highlights to edit or delete them.

```tsx
import React, { useState, useCallback } from 'react';
import { ReadiumView } from 'react-native-readium-updated';
import type {
  File,
  Decoration,
  DecorationGroup,
  SelectionAction,
  SelectionActionEvent,
  DecorationActivatedEvent,
} from 'react-native-readium-updated';

// Register a "Highlight" action in the text selection context menu
const selectionActions: SelectionAction[] = [
  { id: 'highlight', label: 'Highlight' },
];

const MyReader: React.FC<{ file: File }> = ({ file }) => {
  const [decorations, setDecorations] = useState<DecorationGroup[]>([
    { name: 'highlights', decorations: [] },
  ]);

  // User tapped "Highlight" in the selection menu
  const handleSelectionAction = useCallback((event: SelectionActionEvent) => {
    if (event.actionId === 'highlight') {
      const newHighlight: Decoration = {
        id: `highlight-${Date.now()}`,
        locator: event.locator,
        style: {
          type: 'highlight',
          tint: '#FFFF00',
        },
        extras: {
          note: '',
          selectedText: event.selectedText,
        },
      };

      setDecorations((prev) =>
        prev.map((g) =>
          g.name === 'highlights'
            ? { ...g, decorations: [...g.decorations, newHighlight] }
            : g
        )
      );
    }
  }, []);

  // User tapped on an existing highlight
  const handleDecorationActivated = useCallback(
    (event: DecorationActivatedEvent) => {
      const { decoration } = event;
      // Show an edit/delete dialog for this highlight
      console.log('Tapped highlight:', decoration.id);
      console.log('Note:', decoration.extras?.note);
    },
    []
  );

  return (
    <ReadiumView
      file={file}
      decorations={decorations}
      selectionActions={selectionActions}
      onSelectionAction={handleSelectionAction}
      onDecorationActivated={handleDecorationActivated}
    />
  );
};
```

Key concepts:

- **`DecorationGroup`**: A named group of decorations (e.g. `"highlights"`, `"underlines"`). Pass an array of groups to the `decorations` prop.
- **`Decoration`**: A single visual annotation. It references a location in the publication via a `Locator` and defines its appearance via a `DecorationStyle` (supported types: `"highlight"`, `"underline"`).
- **`extras`**: An optional `Record<string, string>` on each `Decoration` where you can store arbitrary metadata like notes, timestamps, or the original selected text.
- **`onSelectionChange`**: Fires as the user adjusts their text selection, useful for showing a live preview or tracking selection state.

[Take a look at the Example App](https://github.com/SAV-7-X/react-native-readium-updated/blob/main/apps/example-native/src/App.tsx) for a full implementation with color picking, note editing, and highlight management.

### Full-Text Search

EPUB publications support full-text search via the [ref methods](#ref-methods).
Results are **paginated lazily** — `search` resolves with the first
[`SearchPage`](https://github.com/SAV-7-X/react-native-readium-updated/blob/main/src/specs/ReadiumView.nitro.ts),
and you call `loadMoreSearchResults` to fetch each subsequent page while
`page.hasMore` is `true`:

```tsx
const ref = useRef<ReadiumViewRef>(null);

// Start a search and read the first page.
const first = await ref.current?.search('whale', { caseSensitive: false });
// first.results, first.hasMore, first.totalCount, first.isSupported

// Fetch the next page (e.g. when the user nears the end of the list).
if (first?.hasMore) {
  const next = await ref.current?.loadMoreSearchResults();
}

// Cancel and release the underlying iterator.
ref.current?.cancelSearch();
```

Do not call `loadMoreSearchResults` concurrently — a single Readium search
iterator must not be advanced in parallel. Await each page before requesting the
next.

#### `useSearch` hook

For the common case, the exported `useSearch(ref)` hook wraps these methods and
manages the accumulated results plus `isSearching` / `isLoadingMore` /
`isSupported` / `hasMore` state for you (and serialises page requests so you
can't advance the iterator concurrently):

```tsx
import { ReadiumView, useSearch } from 'react-native-readium-updated';

const ref = useRef<ReadiumViewRef>(null);
const { results, hasMore, isSearching, search, loadMore, clear } =
  useSearch(ref);

// search('whale')   loadMore()   clear()
```

See the [example app](https://github.com/SAV-7-X/react-native-readium-updated/blob/main/apps/common-app/src/components/SearchPanel.tsx)
for a full search UI with infinite scroll.

## Supported Formats & DRM

#### Format Support

| Format | Support            | Notes                                                          |
| ------ | ------------------ | -------------------------------------------------------------- |
| Epub 2 | :white_check_mark: |                                                                |
| Epub 3 | :white_check_mark: |                                                                |
| PDF    | :x:                | On the roadmap, feel free to submit a PR or ask for direction. |
| CBZ    | :x:                | On the roadmap, feel free to submit a PR or ask for direction. |

**Missing a format you need?** Reach out and see if it can be added to the roadmap.

#### DRM Support

DRM is not supported at this time. However, there is a clear path to [support it via LCP](https://www.edrlab.org/readium-lcp/) and the intention is to eventually implement it.

## API

#### View Props

| Name                    | Type                                                                                                                                                | Optional           | Description                                                                                                                                                                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `file`                  | [`File`](https://github.com/SAV-7-X/react-native-readium-updated/blob/main/src/interfaces/File.ts)                                                         | :x:                | A file object containing the path to the eBook file on disk. Use `File.initialLocation` to set the reader's position on mount.                                                                                                                                                      |
| `preferences`           | [`Partial<Preferences>`](https://github.com/readium/swift-toolkit/blob/main/docs/Guides/Navigator%20Preferences.md#appendix-preference-constraints) | :white_check_mark: | An object that allows you to control various aspects of the reader's UI (epub only)                                                                                                                                                                                                 |
| `decorations`           | [`DecorationGroup[]`](https://github.com/SAV-7-X/react-native-readium-updated/blob/main/src/interfaces/Decoration.ts)                                      | :white_check_mark: | An array of decoration groups to render in the publication (e.g. highlights, underlines).                                                                                                                                                                                           |
| `selectionActions`      | [`SelectionAction[]`](https://github.com/SAV-7-X/react-native-readium-updated/blob/main/src/interfaces/SelectionAction.ts)                                 | :white_check_mark: | Custom actions to show in the context menu when the user selects text.                                                                                                                                                                                                              |
| `style`                 | `ViewStyle`                                                                                                                                         | :white_check_mark: | A traditional style object.                                                                                                                                                                                                                                                         |
| `onLocationChange`      | `(locator: Locator) => void`                                                                                                                        | :white_check_mark: | A callback that fires whenever the location is changed (e.g. the user transitions to a new page).                                                                                                                                                                                   |
| `onPublicationReady`    | `(event: PublicationReadyEvent) => void`                                                                                                            | :white_check_mark: | A callback that fires once the publication is loaded and provides access to the table of contents, positions, and metadata. See the [`PublicationReadyEvent`](https://github.com/SAV-7-X/react-native-readium-updated/blob/main/src/interfaces/PublicationReady.ts) interface for details. |
| `onDecorationActivated` | `(event: DecorationActivatedEvent) => void`                                                                                                         | :white_check_mark: | A callback that fires when a user taps on a decoration (e.g. a highlight).                                                                                                                                                                                                          |
| `onSelectionChange`     | `(event: SelectionEvent) => void`                                                                                                                   | :white_check_mark: | A callback that fires when the user's text selection changes.                                                                                                                                                                                                                       |
| `onSelectionAction`     | `(event: SelectionActionEvent) => void`                                                                                                             | :white_check_mark: | A callback that fires when the user taps a custom selection action from the context menu.                                                                                                                                                                                           |

#### Ref Methods

The `ReadiumView` component accepts a ref that exposes imperative navigation methods:

```tsx
import React, { useRef } from 'react';
import { ReadiumView } from 'react-native-readium-updated';
import type { ReadiumViewRef, Locator } from 'react-native-readium-updated';

const MyComponent: React.FC = () => {
  const ref = useRef<ReadiumViewRef>(null);

  const goToChapter = (locator: Locator) => {
    ref.current?.goTo(locator);
  };

  return (
    <>
      <ReadiumView ref={ref} file={file} />
      <Button title="Next" onPress={() => ref.current?.goForward()} />
      <Button title="Previous" onPress={() => ref.current?.goBackward()} />
    </>
  );
};
```

| Method                    | Description                                                                                                                                                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `goTo(locator)`           | Navigate to a specific location in the publication (e.g. a chapter or bookmark).                                                                                                                                                                |
| `goForward()`             | Navigate forward in the publication (e.g. next page).                                                                                                                                                                                           |
| `goBackward()`            | Navigate backward in the publication (e.g. previous page).                                                                                                                                                                                      |
| `search(query, options?)` | Start a full-text search; resolves with the first [`SearchPage`](https://github.com/SAV-7-X/react-native-readium-updated/blob/main/src/specs/ReadiumView.nitro.ts) of results. Most consumers should prefer the [`useSearch`](#full-text-search) hook. |
| `loadMoreSearchResults()` | Resolves with the next `SearchPage` for the in-flight search (empty terminal page when exhausted).                                                                                                                                              |
| `cancelSearch()`          | Cancel the in-flight search and release its iterator.                                                                                                                                                                                           |

#### :warning: Web vs Native File URLs

Please note that on `web` the `File.url` should be a web accessible URL path to
the `manifest.json` of the unpacked epub. In native contexts it needs to be a
local filepath to the epub file itself on disk. If you're not sure how to
serve epub books [take a look at this example](https://github.com/d-i-t-a/R2D2BC/blob/production/examples/server.ts)
which is based on the `dita-streamer-js` project (which is built on all the
readium [r2-\*-js](https://github.com/readium?q=js) libraries)

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the
repository and the development workflow.

## Release

The standard release command for this project is:

```
yarn version
```

This command will:

1. Generate/update the Changelog
1. Bump the package version
1. Tag & pushing the commit

e.g.

```
yarn version --new-version 1.2.17
yarn version --patch // 1.2.17 -> 1.2.18
```

## Sponsor The Library

If you'd like to sponsor a specific feature, fix, or the library in general, please reach out on an issue and we'll have a conversation!

## License

MIT
