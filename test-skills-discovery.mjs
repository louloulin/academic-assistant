#!/usr/bin/env bun
/**
 * 测试 CLI V3 的动态 Skills 发现功能
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 简单的 YAML 解析器
function parseYAMLFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]+?)\n---/);
  if (!match) return null;

  const yamlContent = match[1];
  const metadata = {};

  const lines = yamlContent.split('\n');
  let currentKey = null;
  let inArray = false;

  for (const line of lines) {
    if (line.includes(':')) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();

      if (value.startsWith('[')) {
        metadata[key.trim()] = [];
        inArray = true;
        currentKey = key.trim();
      } else {
        metadata[key.trim()] = value.replace(/^["']|["']$/g, '');
        inArray = false;
        currentKey = key.trim();
      }
    } else if (inArray && line.trim().startsWith('-')) {
      const item = line.replace(/^-\\s*/, '').trim().replace(/^["']|["']$/g, '');
      metadata[currentKey].push(item);
    }
  }

  return metadata;
}

// 动态发现 Skills
async function discoverSkills() {
  console.log('\n🔍 开始动态发现 Skills...\n');

  const skillsDir = path.join(__dirname, '.claude', 'skills');
  const skills = [];

  try {
    const skillFolders = await fs.readdir(skillsDir);

    console.log(`📁 找到 ${skillFolders.length} 个 Skills 文件夹\n`);

    for (const folder of skillFolders) {
      const skillFile = path.join(skillsDir, folder, 'SKILL.md');

      try {
        const content = await fs.readFile(skillFile, 'utf-8');
        const metadata = parseYAMLFrontmatter(content);

        if (metadata) {
          const skill = {
            id: folder,
            name: metadata.name || folder,
            description: metadata.description || '',
            allowedTools: metadata['allowed-tools'] || [],
            hasSkillTool: (metadata['allowed-tools'] || []).includes('Skill')
          };

          skills.push(skill);

          const toolIndicator = skill.hasSkillTool ? '🔗' : '  ';
          console.log(`${toolIndicator} ${skill.id.padEnd(30)} - ${skill.description.substring(0, 50)}...`);
        }
      } catch (error) {
        console.warn(`⚠️  无法加载 Skill: ${folder} - ${error.message}`);
      }
    }

    // 统计
    const withSkillTool = skills.filter(s => s.hasSkillTool).length;

    console.log('\n📊 统计:');
    console.log(`   总 Skills: ${skills.length}`);
    console.log(`   带 Skill 工具: ${withSkillTool} (${((withSkillTool/skills.length)*100).toFixed(1)}%)`);

    return skills;

  } catch (error) {
    console.error(`❌ 读取 Skills 目录失败: ${error.message}`);
    return [];
  }
}

// 运行测试
const skills = await discoverSkills();

console.log('\n✅ Skills 发现测试完成！');
