import * as chrome from 'vitest-chrome'
window.global ||= window;

// Add chrome object to global scope
Object.assign(global, chrome)