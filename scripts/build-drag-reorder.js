const fs = require('fs');
const path = require('path');

let s = fs.readFileSync('index.html', 'utf8');

function rep(oldText, newText, label) {
  if (!s.includes(oldText)) throw new Error(`Patch point not found: ${label}`);
  s = s.replace(oldText, newText);
}

if (!s.includes('/* DRAG_REORDER_V1 */')) {
  rep(`.queue-item .q-drag {
  width: 32px; height: 44px; display: flex; align-items: center; justify-content: center;
  color: var(--text3); cursor: grab; flex-shrink: 0;
}
`, `.queue-item .q-drag {
  width: 32px; height: 44px; display: flex; align-items: center; justify-content: center;
  color: var(--text3); cursor: grab; flex-shrink: 0;
  touch-action: none; user-select: none; -webkit-user-select: none;
}
.queue-item .q-drag:active { cursor: grabbing; }
/* DRAG_REORDER_V1 */
.track-drag {
  width: 30px; height: 44px; display: flex; align-items: center; justify-content: center;
  color: var(--text3); cursor: grab; flex-shrink: 0;
  touch-action: none; user-select: none; -webkit-user-select: none;
}
.track-drag:active { cursor: grabbing; }
.queue-item.dragging, .track-item.dragging {
  opacity: .72; background: var(--surface2); position: relative; z-index: 20;
  box-shadow: 0 8px 24px rgba(0,0,0,.28);
}
`, 'drag css');

  rep(`  async function loadFromDB() {
    tracks = await DB.getAllTracks();
    tracks.sort((a, b) => a.title.localeCompare(b.title));
  }
`, `  async function loadFromDB() {
    tracks = await DB.getAllTracks();
    const savedOrder = await DB.getPref('libraryOrder');
    if (Array.isArray(savedOrder) && savedOrder.length) {
      const pos = new Map(savedOrder.map((id, i) => [id, i]));
      tracks.sort((a, b) => {
        const ai = pos.has(a.id) ? pos.get(a.id) : Number.MAX_SAFE_INTEGER;
        const bi = pos.has(b.id) ? pos.get(b.id) : Number.MAX_SAFE_INTEGER;
        return ai !== bi ? ai - bi : a.title.localeCompare(b.title);
      });
    } else {
      tracks.sort((a, b) => a.title.localeCompare(b.title));
    }
  }
`, 'library load order');

  rep(`    tracks.sort((a, b) => a.title.localeCompare(b.title));
    if (onUpdate) onUpdate();
    return { added, skipped, total: audioFiles.length };
`, `    await DB.savePref('libraryOrder', tracks.map(t => t.id));
    if (onUpdate) onUpdate();
    return { added, skipped, total: audioFiles.length };
`, 'import order save');

  rep(`  async function removeTrack(id) {
    await DB.removeTrack(id);
    tracks = tracks.filter(t => t.id !== id);
    if (onUpdate) onUpdate();
  }

  async function clearLibrary() {
    await DB.clearAll();
    tracks = [];
    if (onUpdate) onUpdate();
  }
`, `  async function removeTrack(id) {
    await DB.removeTrack(id);
    tracks = tracks.filter(t => t.id !== id);
    await DB.savePref('libraryOrder', tracks.map(t => t.id));
    if (onUpdate) onUpdate();
  }

  async function clearLibrary() {
    await DB.clearAll();
    tracks = [];
    await DB.savePref('libraryOrder', []);
    if (onUpdate) onUpdate();
  }
`, 'remove and clear order');

  rep(`  function addToMemory(track) {
    tracks.push(track);
    tracks.sort((a, b) => a.title.localeCompare(b.title));
    if (onUpdate) onUpdate();
  }

  function updateTrackInMemory(id, updates) {
`, `  function addToMemory(track) {
    tracks.push(track);
    DB.savePref('libraryOrder', tracks.map(t => t.id));
    if (onUpdate) onUpdate();
  }

  async function reorder(fromIndex, toIndex) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= tracks.length || toIndex >= tracks.length) return;
    const [moved] = tracks.splice(fromIndex, 1);
    tracks.splice(toIndex, 0, moved);
    await DB.savePref('libraryOrder', tracks.map(t => t.id));
    if (onUpdate) onUpdate();
  }

  function updateTrackInMemory(id, updates) {
`, 'library reorder method');

  rep(`  return { loadFromDB, importFiles, getAll, search, getByArtist, getByAlbum, removeTrack, clearLibrary, isYouTubeDuplicate, addToMemory, updateTrackInMemory, setOnUpdate };
`, `  return { loadFromDB, importFiles, getAll, search, getByArtist, getByAlbum, removeTrack, clearLibrary, isYouTubeDuplicate, addToMemory, reorder, updateTrackInMemory, setOnUpdate };
`, 'library export');

  rep(`  function getTracksForPlaylist(id) {
    const pl = getById(id);
`, `  async function reorderTrack(playlistId, fromIndex, toIndex) {
    const pl = getById(playlistId);
    if (!pl || fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= pl.trackIds.length || toIndex >= pl.trackIds.length) return;
    const [moved] = pl.trackIds.splice(fromIndex, 1);
    pl.trackIds.splice(toIndex, 0, moved);
    await DB.updatePlaylist(pl);
    if (onUpdate) onUpdate();
  }

  function getTracksForPlaylist(id) {
    const pl = getById(id);
`, 'playlist reorder method');

  rep(`  return { loadFromDB, getAll, getById, create, rename, remove, addTrack, removeTrack, removeTrackFromAll, getTracksForPlaylist, clearAll, setOnUpdate };
`, `  return { loadFromDB, getAll, getById, create, rename, remove, addTrack, removeTrack, removeTrackFromAll, reorderTrack, getTracksForPlaylist, clearAll, setOnUpdate };
`, 'playlist export');

  rep(`  function jumpTo(index) {
    if (index >= 0 && index < playOrder.length) {
`, `  function move(fromIndex, toIndex) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= playOrder.length || toIndex >= playOrder.length) return;
    const [moved] = playOrder.splice(fromIndex, 1);
    playOrder.splice(toIndex, 0, moved);
    if (fromIndex === currentIndex) currentIndex = toIndex;
    else if (fromIndex < currentIndex && toIndex >= currentIndex) currentIndex--;
    else if (fromIndex > currentIndex && toIndex <= currentIndex) currentIndex++;
    shuffleOn = false;
    originalOrder = [...playOrder];
    saveQueue();
  }

  function jumpTo(index) {
    if (index >= 0 && index < playOrder.length) {
`, 'queue move method');

  rep(`  return { setQueue, current, next, prev, jumpTo, toggleShuffle, cycleRepeat, getState, addToQueue, insertAfterCurrent, removeFromQueue, getPlayOrder, getCurrentIndex, restoreQueue, saveQueue };
`, `  return { setQueue, current, next, prev, jumpTo, toggleShuffle, cycleRepeat, getState, addToQueue, insertAfterCurrent, removeFromQueue, move, getPlayOrder, getCurrentIndex, restoreQueue, saveQueue };
`, 'queue export');

  rep(`    if (currentTab === 'songs') {
      html = tracks.map(t => trackItemHTML(t, currentTrack)).join('');
`, `    if (currentTab === 'songs') {
      html = tracks.map(t => trackItemHTML(t, currentTrack, !query)).join('');
`, 'songs drag handles');

  rep(`          html += plTracks.map(t => trackItemHTML(t, currentTrack)).join('');
`, `          html += plTracks.map(t => trackItemHTML(t, currentTrack, true)).join('');
`, 'playlist drag handles');

  rep(`        if (e.target.closest('.track-menu-btn')) return;
`, `        if (e.target.closest('.track-menu-btn') || e.target.closest('.track-drag')) return;
`, 'ignore drag click');

  rep(`    // Load art for visible tracks
    loadVisibleArt();
  }

  function trackItemHTML(t, currentTrack) {
`, `    if (currentTab === 'songs' && !query) {
      enableSortable(libContent, '.track-item', '.track-drag', async (from, to) => {
        await Library.reorder(from, to);
        showToast('Song order saved');
      });
    } else if (currentTab === 'playlists' && currentPlaylistId) {
      enableSortable(libContent, '.track-item', '.track-drag', async (from, to) => {
        await Playlist.reorderTrack(currentPlaylistId, from, to);
        showToast('Playlist order saved');
      });
    }

    // Load art for visible tracks
    loadVisibleArt();
  }

  function trackItemHTML(t, currentTrack, showDrag = false) {
`, 'sortable init and signature');

  rep(`    return \`<div class="track-item\${isPlaying ? ' playing' : ''}" data-id="\${t.id}">
      <div class="track-art-sm" data-art-id="\${t.id}">\${artHtml}</div>
`, `    return \`<div class="track-item\${isPlaying ? ' playing' : ''}" data-id="\${t.id}">
      \${showDrag ? \`<div class="track-drag" title="Drag to reorder" aria-label="Drag to reorder"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg></div>\` : ''}
      <div class="track-art-sm" data-art-id="\${t.id}">\${artHtml}</div>
`, 'drag handle html');

  rep(`    // Bind tap to play
    $('queue-list').querySelectorAll('.queue-item').forEach(el => {
      el.onclick = (e) => {
        if (e.target.closest('.q-remove') || e.target.closest('.q-drag')) return;
        const i = parseInt(el.dataset.index);
        const trackId = Queue.jumpTo(i);
        if (trackId != null) {
          const track = Library.getAll().find(t => t.id === trackId);
          if (track) Player.playTrack(track);
        }
        renderQueue();
      };
    });
  }

  // === CONTEXT MENU ===
`, `    // Bind tap to play
    $('queue-list').querySelectorAll('.queue-item').forEach(el => {
      el.onclick = (e) => {
        if (e.target.closest('.q-remove') || e.target.closest('.q-drag')) return;
        const i = parseInt(el.dataset.index);
        const trackId = Queue.jumpTo(i);
        if (trackId != null) {
          const track = Library.getAll().find(t => t.id === trackId);
          if (track) Player.playTrack(track);
        }
        renderQueue();
      };
    });

    enableSortable($('queue-list'), '.queue-item', '.q-drag', (from, to) => {
      Queue.move(from, to);
      updateShuffleRepeatUI();
      renderQueue();
      showToast('Queue order saved');
    });
  }

  function enableSortable(container, itemSelector, handleSelector, onMove) {
    if (!container) return;
    container.querySelectorAll(handleSelector).forEach(handle => {
      handle.onpointerdown = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const item = handle.closest(itemSelector);
        if (!item) return;
        e.preventDefault();
        e.stopPropagation();
        const startItems = Array.from(container.querySelectorAll(itemSelector));
        const fromIndex = startItems.indexOf(item);
        if (fromIndex < 0) return;
        item.classList.add('dragging');
        try { handle.setPointerCapture(e.pointerId); } catch (_) {}

        const onPointerMove = (ev) => {
          ev.preventDefault();
          const y = ev.clientY;
          const others = Array.from(container.querySelectorAll(itemSelector)).filter(el => el !== item);
          let before = null;
          for (const el of others) {
            const r = el.getBoundingClientRect();
            if (y < r.top + r.height / 2) { before = el; break; }
          }
          if (before) container.insertBefore(item, before);
          else container.appendChild(item);
          const cr = container.getBoundingClientRect();
          if (y < cr.top + 56) container.scrollTop -= 14;
          else if (y > cr.bottom - 56) container.scrollTop += 14;
        };

        const onPointerUp = () => {
          item.classList.remove('dragging');
          window.removeEventListener('pointermove', onPointerMove, true);
          window.removeEventListener('pointerup', onPointerUp, true);
          window.removeEventListener('pointercancel', onPointerUp, true);
          const finalItems = Array.from(container.querySelectorAll(itemSelector));
          const toIndex = finalItems.indexOf(item);
          if (toIndex >= 0 && toIndex !== fromIndex) onMove(fromIndex, toIndex);
        };

        window.addEventListener('pointermove', onPointerMove, { capture: true, passive: false });
        window.addEventListener('pointerup', onPointerUp, true);
        window.addEventListener('pointercancel', onPointerUp, true);
      };
    });
  }

  // === CONTEXT MENU ===
`, 'queue sortable and helper');
}

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync(path.join('dist', 'index.html'), s);
console.log('Built dist/index.html with drag-and-drop reordering');
