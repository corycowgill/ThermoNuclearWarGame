// ========== TERMINAL UI ==========
// Typewriter-style text output for the command terminal

import AudioEngine from './audio.js';

const terminal = document.getElementById('terminal');

export function termPrint(text, bright = false) {
  const div = document.createElement('div');
  div.className = 'terminal-line' + (bright ? ' bright' : '');
  div.textContent = text;
  terminal.appendChild(div);
  terminal.scrollTop = terminal.scrollHeight;
}

export function typeText(el, text, speed = 50) {
  return new Promise(resolve => {
    let i = 0;
    el.textContent = '';
    const iv = setInterval(() => {
      if (i < text.length) {
        el.textContent += text[i];
        AudioEngine.type();
        i++;
      } else {
        clearInterval(iv);
        resolve();
      }
    }, speed);
  });
}

export function termType(text, speed = 30, bright = false) {
  return new Promise(resolve => {
    const div = document.createElement('div');
    div.className = 'terminal-line' + (bright ? ' bright' : '');
    terminal.appendChild(div);
    let i = 0;
    const iv = setInterval(() => {
      if (i < text.length) {
        div.textContent += text[i];
        if (i % 3 === 0) AudioEngine.type();
        i++;
        terminal.scrollTop = terminal.scrollHeight;
      } else {
        clearInterval(iv);
        resolve();
      }
    }, speed);
  });
}

export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
