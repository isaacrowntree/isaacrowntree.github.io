/*
  app.js — isaacrowntree.github.io
  Side rail active-section tracking + Command palette (⌘K / Ctrl+K)
*/

(function () {
  'use strict';

  const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform);

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
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  const footer = overlay.querySelector('.cmdk__footer');

  // Set platform-specific kbd hints
  if (footer) {
    footer.querySelectorAll('[data-kbd-mod]').forEach((el) => {
      el.textContent = isMac ? '⌘' : 'Ctrl';
    });
  }

  // Palette items — sections + actions
  const items = [
    { id: 'tldr', group: 'Jump to', label: 'Overview', icon: 'fa-compass', type: 'jump' },
    { id: 'experience', group: 'Jump to', label: 'Experience', icon: 'fa-briefcase', type: 'jump' },
    { id: 'work', group: 'Jump to', label: 'Selected work', icon: 'fa-rocket', type: 'jump' },
    { id: 'oss', group: 'Jump to', label: 'Open source', icon: 'fa-code-branch', type: 'jump' },
    { id: 'skills', group: 'Jump to', label: 'Skills', icon: 'fa-layer-group', type: 'jump' },
    { id: 'references', group: 'Jump to', label: 'References', icon: 'fa-quote-left', type: 'jump' },
    { id: 'beyond', group: 'Jump to', label: 'Beyond code', icon: 'fa-heart', type: 'jump' },
    { id: 'contact', group: 'Jump to', label: 'Contact', icon: 'fa-envelope', type: 'jump' },

    { id: 'email', group: 'Actions', label: 'Copy email address', icon: 'fa-at', meta: 'isaac@rowntree.me', type: 'copy', value: 'isaac@rowntree.me' },
    { id: 'print', group: 'Actions', label: 'Download as PDF', icon: 'fa-file-arrow-down', meta: 'Cmd+P', type: 'print' },
    { id: 'github', group: 'Actions', label: 'Open GitHub', icon: 'fa-github', type: 'link', value: 'https://github.com/isaacrowntree' },
    { id: 'twitter', group: 'Actions', label: 'Open Twitter / X', icon: 'fa-x-twitter', type: 'link', value: 'https://twitter.com/tikwanleep' },
    { id: 'zackdesign', group: 'Actions', label: 'Visit Zack Design', icon: 'fa-rocket', meta: 'zackdesign.biz', type: 'link', value: 'https://zackdesign.biz' },
    { id: 'linkedin', group: 'Actions', label: 'Open LinkedIn', icon: 'fa-linkedin', type: 'link', value: 'https://www.linkedin.com/in/zemonstas/' },
    { id: 'instagram', group: 'Actions', label: 'Follow @zemonstas on Instagram', icon: 'fa-instagram', meta: 'photography', type: 'link', value: 'https://www.instagram.com/zemonstas' },
  ];

  let selectedIndex = 0;
  let filtered = items.slice();

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
        el.innerHTML = `
          <span class="icon"><i class="fa-solid ${item.icon} fa-brands"></i></span>
          <span class="cmdk__item-label">${item.label}</span>
          ${item.meta ? `<span class="cmdk__item-meta">${item.meta}</span>` : ''}
        `;
        // Fix icon class prefix for brand icons
        const iconEl = el.querySelector('.icon i');
        if (['fa-github', 'fa-x-twitter', 'fa-linkedin', 'fa-instagram'].includes(item.icon)) {
          iconEl.className = `fa-brands ${item.icon}`;
        } else {
          iconEl.className = `fa-solid ${item.icon}`;
        }

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
      el.classList.toggle('is-selected', parseInt(el.dataset.index, 10) === selectedIndex);
    });
    const selEl = list.querySelector('.cmdk__item.is-selected');
    if (selEl) selEl.scrollIntoView({ block: 'nearest' });
  };

  const activate = () => {
    const item = filtered[selectedIndex];
    if (!item) return;
    closePalette();
    if (item.type === 'jump') {
      const target = document.getElementById(item.id);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      filtered = items.slice();
    } else {
      filtered = items.filter((item) => {
        const hay = `${item.label} ${item.group} ${item.meta || ''} ${item.id}`.toLowerCase();
        return hay.includes(q);
      });
    }
    selectedIndex = 0;
    render();
  };

  const openPalette = () => {
    overlay.classList.add('is-open');
    input.value = '';
    filterItems('');
    setTimeout(() => input.focus(), 50);
    document.body.style.overflow = 'hidden';
  };

  const closePalette = () => {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
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

    if (e.key === 'Escape') {
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

  // Copy-to-clipboard buttons
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const value = btn.dataset.copy;
      navigator.clipboard?.writeText(value).then(() => toast(`Copied: ${value}`));
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
