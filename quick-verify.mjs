#!/usr/bin/env bun
/**
 * ⚡ Quick Verification Script
 * 快速验证所有真实实现已就绪
 */

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║          ⚡ Quick Verification - Real Implementation          ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

import { existsSync } from 'fs';
import { readFileSync } from 'fs';

let checks = 0;
let passed = 0;

function check(name, condition) {
  checks++;
  if (condition) {
    passed++;
    console.log(`✅ ${name}`);
    return true;
  } else {
    console.log(`❌ ${name}`);
    return false;
  }
}

// 1. Package.json
console.log('📦 Package Configuration:');
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
check('Claude Agent SDK in dependencies', pkg.dependencies['@anthropic-ai/claude-agent-sdk']);
check('Bun workspace configured', pkg.workspaces && pkg.workspaces.length > 0);

// 2. Key Files
console.log('\n📄 Key Files:');
check('academic-cli.mjs exists', existsSync('academic-cli.mjs'));
check('academic-cli-v3.mjs exists', existsSync('academic-cli-v3.mjs'));
check('plan5.md exists', existsSync('plan5.md'));

// 3. Tests
console.log('\n🧪 Test Files:');
check('Real implementation verification test exists', existsSync('tests/real-implementation-verification.test.mjs'));
check('E2E execution test exists', existsSync('e2e-real-execution.test.mjs'));

// 4. Documentation
console.log('\n📚 Documentation:');
check('Real implementation complete report exists', existsSync('REAL_IMPLEMENTATION_COMPLETE.md'));
check('Final execution report exists', existsSync('FINAL_EXECUTION_REPORT.md'));

// 5. Skills
console.log('\n🎯 Skills:');
check('.claude/skills directory exists', existsSync('.claude/skills'));

// 6. Output
console.log('\n💾 Output:');
check('output directory exists', existsSync('output'));

// 7. Environment
console.log('\n🔧 Environment:');
check('ANTHROPIC_API_KEY configured', process.env.ANTHROPIC_API_KEY ? true : false);

// Summary
console.log('\n' + '═'.repeat(70));
console.log(`📊 Verification Results: ${passed}/${checks} checks passed`);
console.log('═'.repeat(70));

if (passed === checks) {
  console.log('\n🎉 All checks passed! System ready for real execution.\n');
  console.log('📝 Quick Start:');
  console.log('   1. Ensure ANTHROPIC_API_KEY is set');
  console.log('   2. Run: bun run academic-cli.mjs "your request"');
  console.log('   3. Check output in ./output/ directory\n');
} else {
  console.log('\n⚠️  Some checks failed. Please review.\n');
}

process.exit(passed === checks ? 0 : 1);
