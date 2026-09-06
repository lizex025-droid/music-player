const fs = require('fs');
const path = require('path');

const out = path.join('dist', 'index.html');
let s = fs.readFileSync(out, 'utf8');

function rep(oldText, newText, label) {
  if (!s.includes(oldText)) throw new Error(`Multi-select patch point not found: ${label}`);
  s = s.replace(oldText, newText);
}

if (!s.includes('/* MULTI_SELECT_V1 */')) {
  rep(`</style>`, `/* MULTI_SELECT_V1 */
#btn-select.active { background: var(--accent); color: var(--play-btn-fg, #fff); }
.multi-select-circle {
  display: none; width: 25px; height: 25px; border-radius: 50%;
  border: 2px solid var(--text3); flex-shrink: 0;
  align-items: center; justify-content: center;
  transition: background .16s ease, border-color .16s ease, transform .16s ease;
}
.multi-select-circle svg { opacity: 0; transform: scale(.6); transition: opacity .14s ease, transform .14s ease; }
.multi-select-circle.selected {
  background: var(--accent); border-color: var(--accent); color: var(--play-btn-fg, #fff);
}
.multi-select-circle.selected svg { opacity: 1; transform: scale(1); }
.selection-mode .multi-select-circle { display: flex; }
.selection-mode .track-drag, .selection-mode .track-menu-btn { display: none !important; }
.selection-mode .track-item { cursor: pointer; }
.selection-mode .track-item:active { background: var(--surface2); }
#bulk-selection-bar {
  position: fixed; left: 12px; right: 12px;
  bottom: calc(var(--mini-h) + var(--safe-bottom) + 10px);
  z-index: 59; background: var(--surface); border: 1px solid var(--divider);
  border-radius: 16px; padding: 9px 10px;
  display: flex; align-items: center; gap: 7px;
  box-shadow: 0 8px 30px rgba(0,0,0,.35);
}
#bulk-selection-bar.hidden { display: none !important; }
.bulk-count { min-width: 58px; font-size: 13px; font-weight: 700; color: var(--accent); padding-left: 3px; }
.bulk-action {
  min-height: 38px; padding: 7px 10px; border-radius: 10px;
  background: var(--surface2); display: inline-flex; align-items: center; justify-content: center;
  gap: 6px; font-size: 12px; font-weight: 650; flex: 1;
}
.bulk-action:active { opacity: .72; }
.bulk-action.danger { color: var(--danger); }
.bulk-action:disabled { opacity: .35; pointer-events: none; }
@media (max-width: 430px) {
  #bulk-selection-bar { left: 8px; right: 8px; gap: 5px; padding: 8px; }
  .bulk-action { padding: 7px 8px; font-size: 11px; }
  .bulk-action span { display: none; }
  .bulk-count { min-width: 54px; font-size: 12px; }
}
</style>`, 'css');

  rep(`<div class="lib-header-actions">
        <button id="btn-add-more" title="Add music">`, `<div class="lib-header-actions">
        <button id="btn-select" title="Select songs" aria-label="Select songs">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>
        </button>
        <button id="btn-add-more" title="Add music">`, 'select button');

  rep(`<!-- ===== MINI PLAYER ===== -->`, `<div id="bulk-selection-bar" class="hidden" aria-live="polite">
  <div class="bulk-count" id="selection-count">0 selected</div>
  <button class="bulk-action" id="bulk-select-all" title="Select all visible songs">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8 12 2.5 2.5L16 9"/></svg><span>All</span>
  </button>
  <button class="bulk-action" id="bulk-queue" title="Add selected songs to queue">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg><span>Queue</span>
  </button>
  <button class="bulk-action" id="bulk-playlist" title="Add selected songs to playlist">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="15" y2="6"/><line x1="4" y1="12" x2="15" y2="12"/><line x1="4" y1="18" x2="11" y2="18"/><line x1="19" y1="14" x2="19" y2="20"/><line x1="16" y1="17" x2="22" y2="17"/></svg><span>Playlist</span>
  </button>
  <button class="bulk-action danger" id="bulk-remove" title="Remove selected songs">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg><span>Remove</span>
  </button>
</div>

<!-- ===== MINI PLAYER ===== -->`, 'bulk bar');

  rep(`  let videoVisible = true;
`, `  let videoVisible = true;
  let selectionMode = false;
  const selectedTrackIds = new Set();
`, 'selection state');

  rep(`    $('btn-add-more').onclick = () => showAddMenu();
    $('btn-clear-lib').onclick = handleClearLibrary;
    $('btn-settings').onclick = showSettings;
`, `    $('btn-add-more').onclick = () => showAddMenu();
    $('btn-clear-lib').onclick = handleClearLibrary;
    $('btn-settings').onclick = showSettings;
    $('btn-select').onclick = toggleSelectionMode;
    $('bulk-select-all').onclick = toggleSelectAllVisible;
    $('bulk-queue').onclick = bulkAddToQueue;
    $('bulk-playlist').onclick = bulkAddToPlaylist;
    $('bulk-remove').onclick = bulkRemoveSelected;
`, 'selection bindings');

  rep(`        document.querySelectorAll('.lib-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
`, `        if (selectionMode) exitSelectionMode();
        document.querySelectorAll('.lib-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
`, 'exit on tab');

  rep(`      el.onclick = (e) => {
        if (e.target.closest('.track-menu-btn') || e.target.closest('.track-drag')) return;
        playFromLibrary(id);
      };`, `      el.onclick = (e) => {
        if (selectionMode) {
          e.preventDefault();
          toggleTrackSelection(id);
          return;
        }
        if (e.target.closest('.track-menu-btn') || e.target.closest('.track-drag')) return;
        playFromLibrary(id);
      };`, 'track select click');

  rep(`  function trackItemHTML(t, currentTrack, showDrag = false) {
    const isPlaying = currentTrack && currentTrack.id === t.id;
`, `  function trackItemHTML(t, currentTrack, showDrag = false) {
    const isPlaying = currentTrack && currentTrack.id === t.id;
    const isSelected = selectedTrackIds.has(t.id);
`, 'selected state in row');

  rep(`    return \`<div class="track-item\${isPlaying ? ' playing' : ''}" data-id="\${t.id}">
      \${showDrag ?`, `    return \`<div class="track-item\${isPlaying ? ' playing' : ''}\${isSelected ? ' selected' : ''}" data-id="\${t.id}">
      <div class="multi-select-circle\${isSelected ? ' selected' : ''}" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
      \${showDrag ?`, 'selection circle');

  rep(`  // === CONTEXT MENU ===
`, `  function updateSelectionUI() {
    libraryView.classList.toggle('selection-mode', selectionMode);
    const selectBtn = $('btn-select');
    selectBtn.classList.toggle('active', selectionMode);
    selectBtn.title = selectionMode ? 'Done selecting' : 'Select songs';
    selectBtn.setAttribute('aria-label', selectBtn.title);
    selectBtn.innerHTML = selectionMode
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>';

    const bar = $('bulk-selection-bar');
    bar.classList.toggle('hidden', !selectionMode);
    const count = selectedTrackIds.size;
    $('selection-count').textContent = count + (count === 1 ? ' selected' : ' selected');
    ['bulk-queue','bulk-playlist','bulk-remove'].forEach(id => { $(id).disabled = count === 0; });

    const visibleIds = Array.from(libContent.querySelectorAll('.track-item')).map(el => parseInt(el.dataset.id)).filter(Number.isFinite);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedTrackIds.has(id));
    $('bulk-select-all').classList.toggle('ctrl-active', allVisibleSelected);
  }

  function toggleSelectionMode() {
    selectionMode = !selectionMode;
    if (!selectionMode) selectedTrackIds.clear();
    updateSelectionUI();
    renderLibrary();
  }

  function exitSelectionMode() {
    selectionMode = false;
    selectedTrackIds.clear();
    updateSelectionUI();
  }

  function toggleTrackSelection(id) {
    if (selectedTrackIds.has(id)) selectedTrackIds.delete(id);
    else selectedTrackIds.add(id);
    renderLibrary();
    updateSelectionUI();
  }

  function toggleSelectAllVisible() {
    const ids = Array.from(libContent.querySelectorAll('.track-item')).map(el => parseInt(el.dataset.id)).filter(Number.isFinite);
    if (!ids.length) return;
    const allSelected = ids.every(id => selectedTrackIds.has(id));
    ids.forEach(id => allSelected ? selectedTrackIds.delete(id) : selectedTrackIds.add(id));
    renderLibrary();
    updateSelectionUI();
  }

  function selectedIdsInLibraryOrder() {
    return Library.getAll().map(t => t.id).filter(id => selectedTrackIds.has(id));
  }

  function bulkAddToQueue() {
    const ids = selectedIdsInLibraryOrder();
    if (!ids.length) return;
    ids.forEach(id => Queue.addToQueue(id));
    showToast(\`Added \${ids.length} songs to queue\`);
    exitSelectionMode();
    renderLibrary();
  }

  function bulkAddToPlaylist() {
    const ids = selectedIdsInLibraryOrder();
    if (!ids.length) return;
    const allPl = Playlist.getAll();
    const items = [
      { label: 'New Playlist...', icon: 'folder', action: async () => {
        const name = await showPrompt('New Playlist', 'Playlist name', '');
        if (!name) return;
        const pl = await Playlist.create(name);
        let added = 0;
        for (const id of ids) if (await Playlist.addTrack(pl.id, id)) added++;
        showToast(\`Added \${added} songs to "\${name}"\`);
        exitSelectionMode(); renderLibrary();
      }},
      ...allPl.map(pl => ({ label: pl.name, icon: 'playlist', action: async () => {
        let added = 0;
        for (const id of ids) if (await Playlist.addTrack(pl.id, id)) added++;
        showToast(\`Added \${added} songs to "\${pl.name}"\`);
        exitSelectionMode(); renderLibrary();
      }}))
    ];
    showContextMenuRaw(\`Add \${ids.length} songs to Playlist\`, '', items);
  }

  async function bulkRemoveSelected() {
    const ids = selectedIdsInLibraryOrder();
    if (!ids.length) return;

    if (currentTab === 'playlists' && currentPlaylistId) {
      if (!confirm(\`Remove \${ids.length} selected song\${ids.length === 1 ? '' : 's'} from this playlist?\`)) return;
      for (const id of ids) await Playlist.removeTrack(currentPlaylistId, id);
      showToast(\`Removed \${ids.length} from playlist\`);
    } else {
      if (!confirm(\`Remove \${ids.length} selected song\${ids.length === 1 ? '' : 's'} from your library?\`)) return;
      for (const id of ids) {
        await Playlist.removeTrackFromAll(id);
        await Library.removeTrack(id);
      }
      showToast(\`Removed \${ids.length} songs\`);
    }
    exitSelectionMode();
    renderLibrary();
  }

  // === CONTEXT MENU ===
`, 'selection functions');

  rep(`    // Load art for visible tracks
    loadVisibleArt();
  }
`, `    // Load art for visible tracks
    loadVisibleArt();
    if (selectionMode) updateSelectionUI();
  }
`, 'selection ui refresh');
}

fs.writeFileSync(out, s);
console.log('Built dist/index.html with multi-select songs');
