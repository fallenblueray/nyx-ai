#!/usr/bin/env node
/**
 * Theme Fix Script - Batch fix hardcoded colors in TemplateSelector.tsx
 * Replaces text-white/* and bg-white/* with CSS variable equivalents
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/TemplateSelector.tsx');

if (!fs.existsSync(filePath)) {
  console.error('❌ File not found:', filePath);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Map of hardcoded colors to CSS variables
const replacements = [
  // Search input
  { from: 'text-white/40"', to: 'text-[var(--text-muted)]"' },
  { from: 'bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30', to: 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)]' },
  { from: 'text-white/40 hover:text-white', to: 'text-[var(--text-muted)] hover:text-[var(--text-primary)]' },
  
  // Dialog title
  { from: 'text-white"', to: 'text-[var(--text-primary)]"' },
  
  // Section headers
  { from: 'text-white/70 mb-2', to: 'text-[var(--text-secondary)] mb-2' },
  { from: 'text-white/70 mb-3', to: 'text-[var(--text-secondary)] mb-3' },
  { from: 'text-white/70 flex', to: 'text-[var(--text-secondary)] flex' },
  
  // Trending buttons
  { from: 'bg-white/5 border border-white/10 text-white/70', to: 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)]' },
  { from: 'hover:text-white', to: 'hover:text-[var(--text-primary)]' },
  { from: 'text-white/40 py-8', to: 'text-[var(--text-muted)] py-8' },
  
  // Saved templates section
  { from: 'text-white/50 hover:text-white"', to: 'text-[var(--text-muted)] hover:text-[var(--text-primary)]"' },
  { from: 'bg-white/5 border border-white/10 hover:border-purple-500/30', to: 'bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--accent-border)]' },
  { from: 'text-sm font-medium text-white', to: 'text-sm font-medium text-[var(--text-primary)]' },
  { from: 'text-xs text-white/40', to: 'text-xs text-[var(--text-muted)]' },
  { from: 'text-xs px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white', to: 'text-xs px-2 py-1 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--surface)]' },
  { from: 'text-white/30 hover:text-red-400', to: 'text-[var(--text-muted)] hover:text-red-400' },
  
  // Save dialog
  { from: 'border-dashed border-white/20 text-white/40 hover:text-white/60 hover:border-white/30', to: 'border-dashed border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-subtle)]' },
  { from: 'text-sm text-white/60', to: 'text-sm text-[var(--text-secondary)]' },
  { from: 'bg-white/5 border border-white/10', to: 'bg-[var(--surface-2)] border border-[var(--border)]' },
  { from: 'text-white"', to: 'text-[var(--text-primary)]"', global: true },
  { from: 'text-xs text-white/50', to: 'text-xs text-[var(--text-secondary)]' },
  { from: 'text-sm text-white/70', to: 'text-sm text-[var(--text-secondary)]' },
  { from: 'text-xs text-white/50', to: 'text-xs text-[var(--text-muted)]' },
  { from: 'border-white/20 text-white/70', to: 'border-[var(--border)] text-[var(--text-secondary)]' },
  { from: 'hover:bg-white/5', to: 'hover:bg-[var(--surface-3)]' },
];

let totalReplacements = 0;

replacements.forEach(({ from, to, global }, index) => {
  const regex = global ? new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const matches = content.match(regex);
  if (matches) {
    content = content.replace(regex, to);
    totalReplacements += matches.length;
    console.log(`✅ [${index + 1}] Replaced "${from.substring(0, 40)}..." (${matches.length} matches)`);
  }
});

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n🎉 Done! Total replacements: ${totalReplacements}`);
console.log('📄 File:', filePath);
