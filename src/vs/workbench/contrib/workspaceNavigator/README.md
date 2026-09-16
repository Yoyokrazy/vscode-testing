# Workspace Navigator

Workspace Navigator is an experimental file-discovery surface in Explorer. It
combines workspace search results, open editors, recent file history, and pinned
resources. Files open through the standard editor service; previewing a file does
not save, revert, or replace an editor.

## Enable and open

1. Enable `workspaceNavigator.enabled` in Settings.
2. Run **Open in Workspace Navigator** from the Command Palette, or expand the
   **Workspace navigator** section of Explorer.
3. Enter words from a file name or path. Every word must match, ignoring case.
4. Use **All Files**, **Open Editors**, or **Pinned Files** to choose a source.

The Explorer file context menu offers **Open in Workspace Navigator**. This opens
the view, filters to that resource's path, and requests a preview. Search's title
menu also offers **Quick Open with Workspace Navigator**.

## Quick Open

Run **Quick Open with Workspace Navigator**, or type `nav ` in Quick Open while
the experiment is enabled. Enable `workspaceNavigator.useInQuickOpen` to use the
same discovery surface for the default **Go to File** picker as well.

Navigator's picker uses file paths rather than editor-symbol or line-number
syntax. Disable `workspaceNavigator.useInQuickOpen` to restore the standard Go to
File provider. Symbol and command providers remain available through their own
prefixes.

## Results and preview

Pins rank before open editors, followed by recently opened files and workspace
files. Each row includes its path and activity state, including an unsaved-changes
indicator. **Preview** shows a bounded text excerpt. Binary files receive a
placeholder; unavailable providers and unreadable resources do not prevent
opening other results.

Workspace discovery uses Search's filesystem providers, workspace roots, and
configured exclusion rules. The discovery pass requests at most 20,000 workspace
files. `workspaceNavigator.maxResults` controls the displayed result count
(default 200, maximum 1,000). A limit notice indicates a partial result set.
Recent files and pins can refer to files outside the current workspace.

The pin set, source filter, and preview visibility are saved between sessions.
**Refresh** requests fresh discovery and clears the preview cache. File changes,
editor activity, and changes to exclusion settings also update the view.

## Implementation

The shared `IWorkspaceNavigatorService` owns discovery, ranking, preferences, and
preview requests. Both the Explorer view and Quick Open consume it. Discovery
policy normalization is also reused by the legacy extension file-search adapter;
`findFiles2` continues to use its explicit options.

The feature adds no filesystem mutations, dependencies, or telemetry events.
