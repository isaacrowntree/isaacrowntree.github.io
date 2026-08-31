/*
  app.js — isaacrowntree.github.io
  Side rail active-section tracking + Command palette (⌘K / Ctrl+K)
*/

(function () {
  'use strict';

  // navigator.platform is deprecated; userAgentData is the modern route.
  const isMac = /mac|iphone|ipod|ipad/i.test(
    navigator.userAgentData?.platform || navigator.platform || navigator.userAgent
  );

  // CSS `scroll-behavior: auto` under prefers-reduced-motion cannot override an
  // explicit scrollIntoView({behavior:'smooth'}), so gate it here too.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollBehavior = reduceMotion ? 'auto' : 'smooth';

  // Inline icons — same set as _includes/icon.html, so the palette needs no icon font.
  const ICONS = {
    'compass': '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
    'briefcase': '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    'rocket': '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    'code-branch': '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    'code-merge': '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>',
    'layer-group': '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    'heart': '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    'envelope': '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    'at': '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>',
    'file-arrow-down': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="18"/><polyline points="9 15 12 18 15 15"/>',
  };
  const FILLED_ICONS = {
    'github': '<path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.13-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.66.41.36.78 1.05.78 2.13 0 1.54-.02 2.78-.02 3.16 0 .3.21.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/>',
    'x': '<path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.59-6.64 7.59H.47l8.6-9.83L0 1.15h7.59l5.25 6.93 6.06-6.93Zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41Z"/>',
    'linkedin': '<path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05a3.75 3.75 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13Zm1.78 13.02H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z"/>',
    'instagram': '<path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07c-1.28.06-2.15.26-2.91.56-.79.31-1.46.72-2.13 1.39A5.88 5.88 0 0 0 .63 4.14c-.3.76-.5 1.63-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.28.26 2.15.56 2.91.31.79.72 1.46 1.39 2.13a5.88 5.88 0 0 0 2.13 1.39c.76.3 1.63.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.28-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.13-1.39 5.88 5.88 0 0 0 1.39-2.13c.3-.76.5-1.63.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.28-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.39-2.13A5.88 5.88 0 0 0 19.86.63c-.76-.3-1.63-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z"/>',
    'quote-left': '<path d="M10.2 5.4v5.4c0 3.9-2.4 6.6-6 7.8l-1-2c2.2-.9 3.5-2.3 3.7-4.1H3.6a1.8 1.8 0 0 1-1.8-1.8V5.4a1.8 1.8 0 0 1 1.8-1.8h4.8a1.8 1.8 0 0 1 1.8 1.8Zm12 0v5.4c0 3.9-2.4 6.6-6 7.8l-1-2c2.2-.9 3.5-2.3 3.7-4.1h-3.3a1.8 1.8 0 0 1-1.8-1.8V5.4a1.8 1.8 0 0 1 1.8-1.8h4.8a1.8 1.8 0 0 1 1.8 1.8Z"/>',
  };
  const svgIcon = (name) => {
    if (FILLED_ICONS[name]) {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false">' + FILLED_ICONS[name] + '</svg>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
  };

  // -------------------------------------------------------- Side rail dots
  const rail = document.querySelector('.rail');
  if (rail) {
    const dots = rail.querySelectorAll('.rail__dot');
    const targetMap = new Map();
    dots.forEach((dot) => {
      const targetId = dot.dataset.target;
      const target = targetId ? document.getElementById(targetId) : null;
      if (target) targetMap.set(target, dot);
    });

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const id = dot.dataset.target;
        const target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
      });
    });

    if (targetMap.size) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const dot = targetMap.get(entry.target);
            if (!dot) return;
            if (entry.isIntersecting) {
              dots.forEach((d) => d.classList.remove('is-active'));
              dot.classList.add('is-active');
            }
          });
        },
        { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
      );
      targetMap.forEach((_, target) => io.observe(target));
    }
  }

  // ---------------------------------------------------------- Command palette
  const overlay = document.getElementById('cmdk');
  if (!overlay) return;

  const input = overlay.querySelector('.cmdk__input');
  const list = overlay.querySelector('.cmdk__list');

  // Set platform-specific kbd hints everywhere they appear (topbar, hero, footer)
  document.querySelectorAll('[data-kbd-mod]').forEach((el) => {
    el.textContent = isMac ? '⌘' : 'Ctrl';
  });

  // Palette items — sections + actions
  const items = [
    { id: 'tldr', keywords: 'summary about intro bio head of tech campermate sydney', group: 'Jump to', label: 'Overview', icon: 'compass', type: 'jump' },
    { id: 'experience', keywords: 'roles career history campermate redbubble ray white tafe zack design senior developer', group: 'Jump to', label: 'Experience', icon: 'briefcase', type: 'jump' },
    { id: 'work', keywords: 'projects case studies replatform sessionhq ai travel platform cloudflare workers react native nextjs', group: 'Jump to', label: 'Selected work', icon: 'rocket', type: 'jump' },
    { id: 'oss', keywords: 'github repos libraries linework rampset bike part planner typescript mit', group: 'Jump to', label: 'Open source', icon: 'code-branch', type: 'jump' },
    { id: 'contributions', keywords: 'pull requests prs upstream expo react native paper sequin ableton mcp', group: 'Jump to', label: 'Contributions', icon: 'code-merge', type: 'jump' },
    { id: 'skills', keywords: 'tech stack languages typescript react native nextjs cloudflare workers supabase postgres aws terraform', group: 'Jump to', label: 'Skills', icon: 'layer-group', type: 'jump' },
    { id: 'references', keywords: 'testimonials quotes referees recommendations', group: 'Jump to', label: 'References', icon: 'quote-left', type: 'jump' },
    { id: 'beyond', keywords: 'hobbies dance photography video trombone motorcycle personal', group: 'Jump to', label: 'Beyond code', icon: 'heart', type: 'jump' },
    { id: 'contact', keywords: 'email hire get in touch reach out', group: 'Jump to', label: 'Contact', icon: 'envelope', type: 'jump' },

    { id: 'email', group: 'Actions', label: 'Copy email address', icon: 'at', meta: 'isaac@rowntree.me', type: 'copy', value: 'isaac@rowntree.me' },
    { id: 'print', group: 'Actions', label: 'Download as PDF', icon: 'file-arrow-down', meta: 'Cmd+P', type: 'print' },
    { id: 'github', group: 'Actions', label: 'Open GitHub', icon: 'github', type: 'link', value: 'https://github.com/isaacrowntree' },
    { id: 'twitter', group: 'Actions', label: 'Open Twitter / X', icon: 'x-twitter', type: 'link', value: 'https://twitter.com/tikwanleep' },
    { id: 'zackdesign', group: 'Actions', label: 'Visit Zack Design', icon: 'rocket', meta: 'zackdesign.biz', type: 'link', value: 'https://zackdesign.biz' },
    { id: 'linkedin', group: 'Actions', label: 'Open LinkedIn', icon: 'linkedin', type: 'link', value: 'https://www.linkedin.com/in/zemonstas/' },
    { id: 'instagram', group: 'Actions', label: 'Follow @zemonstas on Instagram', icon: 'instagram', meta: 'photography', type: 'link', value: 'https://www.instagram.com/zemonstas' },
  ];

  // Pages other than the one-page resume have none of these sections.
  const available = items.filter((i) => i.type !== 'jump' || document.getElementById(i.id));

  let selectedIndex = 0;
  let filtered = available.slice();
  let lastFocused = null;

  const render = () => {
    list.innerHTML = '';
    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'cmdk__empty';
      empty.textContent = 'No matches.';
      list.appendChild(empty);
      return;
    }

    // Group items by .group
    const groups = {};
    filtered.forEach((item) => {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    });

    let globalIndex = 0;
    Object.keys(groups).forEach((groupName) => {
      const label = document.createElement('div');
      label.className = 'cmdk__group-label';
      label.textContent = groupName;
      list.appendChild(label);

      groups[groupName].forEach((item) => {
        const el = document.createElement('div');
        el.className = 'cmdk__item' + (globalIndex === selectedIndex ? ' is-selected' : '');
        el.dataset.index = globalIndex;
        el.id = 'cmdk-opt-' + globalIndex;
        el.setAttribute('role', 'option');
        el.setAttribute('aria-selected', globalIndex === selectedIndex ? 'true' : 'false');
        el.innerHTML = `
          <span class="icon">${svgIcon(item.icon)}</span>
          <span class="cmdk__item-label">${item.label}</span>
          ${item.meta ? `<span class="cmdk__item-meta">${item.meta}</span>` : ''}
        `;

        el.addEventListener('mouseenter', () => {
          selectedIndex = parseInt(el.dataset.index, 10);
          updateSelection();
        });
        el.addEventListener('click', () => {
          selectedIndex = parseInt(el.dataset.index, 10);
          activate();
        });
        list.appendChild(el);
        globalIndex++;
      });
    });
  };

  const updateSelection = () => {
    list.querySelectorAll('.cmdk__item').forEach((el) => {
      const on = parseInt(el.dataset.index, 10) === selectedIndex;
      el.classList.toggle('is-selected', on);
      el.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    const selEl = list.querySelector('.cmdk__item.is-selected');
    if (selEl) {
      selEl.scrollIntoView({ block: 'nearest' });
      input.setAttribute('aria-activedescendant', selEl.id);
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  };

  const activate = () => {
    const item = filtered[selectedIndex];
    if (!item) return;
    closePalette();
    if (item.type === 'jump') {
      const target = document.getElementById(item.id);
      if (target) target.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    } else if (item.type === 'copy' && item.value) {
      navigator.clipboard?.writeText(item.value).then(() => toast(`Copied: ${item.value}`));
    } else if (item.type === 'link' && item.value) {
      window.open(item.value, '_blank', 'noopener');
    } else if (item.type === 'print') {
      // Small delay so overlay closes before the print dialog
      setTimeout(() => window.print(), 60);
    }
  };

  const filterItems = (q) => {
    q = q.trim().toLowerCase();
    if (!q) {
      filtered = available.slice();
    } else {
      filtered = available.filter((item) => {
        const hay = `${item.label} ${item.group} ${item.meta || ''} ${item.id} ${item.keywords || ''}`.toLowerCase();
        return hay.includes(q);
      });
    }
    selectedIndex = 0;
    render();
  };

  const openPalette = () => {
    lastFocused = document.activeElement;
    overlay.hidden = false;
    overlay.classList.add('is-open');
    input.value = '';
    filterItems('');
    setTimeout(() => input.focus(), 50);
    document.body.style.overflow = 'hidden';
  };

  const closePalette = () => {
    overlay.classList.remove('is-open');
    overlay.hidden = true;
    document.body.style.overflow = '';
    input.removeAttribute('aria-activedescendant');
    // Return focus to whatever opened the palette
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    lastFocused = null;
  };

  // Keyboard: ⌘K / Ctrl+K to open, ESC to close, arrows to navigate, Enter to activate
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (overlay.classList.contains('is-open')) {
        closePalette();
      } else {
        openPalette();
      }
      return;
    }

    if (!overlay.classList.contains('is-open')) {
      // Global "/" to open (unless typing)
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        openPalette();
      }
      return;
    }

    if (e.key === 'Tab') {
      // The palette is modal — keep focus on the input rather than letting it
      // wander into the inert page behind the overlay.
      e.preventDefault();
      input.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1);
      updateSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      updateSelection();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      activate();
    }
  });

  input.addEventListener('input', (e) => filterItems(e.target.value));

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePalette();
  });

  // Buttons that explicitly open the palette
  document.querySelectorAll('[data-open-cmdk]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openPalette();
    });
  });

  // Print / PDF buttons
  document.querySelectorAll('[data-print]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.print();
    });
  });

  // ---------------------------------------------------------- Toast
  let toastEl = null;
  let toastTimer = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'cmdk-toast';
      toastEl.style.cssText =
        'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);padding:0.65rem 1.25rem;background:rgba(10,10,26,0.95);border:1px solid rgba(245,243,255,0.14);border-radius:999px;color:#F5F3FF;font-family:JetBrains Mono,monospace;font-size:0.78rem;letter-spacing:0.02em;z-index:1100;opacity:0;transition:opacity 0.2s ease;backdrop-filter:blur(10px);';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    requestAnimationFrame(() => (toastEl.style.opacity = '1'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastEl.style.opacity = '0'), 1800);
  }

  // Render initial palette state
  render();
})();

// ---------------------------------------------------------- GitHub stars
// Live star counts on OSS cards. Card titles match repo names exactly, so no
// markup changes needed. Badges render only when a repo has more than 1 star,
// and the two API responses are cached in localStorage for 6 hours.
(function () {
  const KEY = 'gh-stars-v1';
  const TTL = 6 * 60 * 60 * 1000;

  function render(stars) {
    document.querySelectorAll('.oss-card').forEach((card) => {
      const title = card.querySelector('.oss-card__title');
      const footer = card.querySelector('.oss-card__footer');
      if (!title || !footer || card.querySelector('.oss-card__stars')) return;
      const n = stars[title.textContent.trim()];
      if (!n || n <= 1) return;
      const badge = document.createElement('span');
      badge.className = 'stack-badge oss-card__stars';
      badge.textContent = `★ ${n}`;
      footer.insertBefore(badge, footer.firstChild);
    });
  }

  let cached = null;
  try {
    cached = JSON.parse(localStorage.getItem(KEY));
  } catch (e) {}
  if (cached && cached.stars && Date.now() - cached.t < TTL) {
    render(cached.stars);
    return;
  }

  Promise.all([
    fetch('https://api.github.com/users/isaacrowntree/repos?per_page=100').then((r) => (r.ok ? r.json() : [])),
    fetch('https://api.github.com/orgs/triptechtravel/repos?per_page=100').then((r) => (r.ok ? r.json() : [])),
  ])
    .then(([mine, org]) => {
      const stars = {};
      mine.concat(org).forEach((r) => {
        if (r && r.name) stars[r.name] = r.stargazers_count;
      });
      try {
        localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), stars }));
      } catch (e) {}
      render(stars);
    })
    .catch(() => {
      if (cached && cached.stars) render(cached.stars); // stale beats nothing
    });
})();
