---
name: version-control
description: Paper version control system using Git integration for tracking changes, managing drafts, and collaborating on academic writing
allowed-tools:
  - WebSearch
  - Read
  - Write
  - Bash
  - MCPTool
context: fork
---

# Version Control Skill

Advanced version control system for academic papers using Git integration. Track changes, manage multiple drafts, collaborate with co-authors, and never lose important revisions.

## When to Use

Use this skill when the user asks to:
- Track changes in a paper across revisions
- Compare different versions of a manuscript
- Manage multiple paper drafts
- Revert to previous versions
- Create branches for different paper versions
- Collaborate with co-authors
- Review change history
- Generate change summaries

## Capabilities

### 1. Version Tracking
- Automatic versioning on each save
- Semantic versioning (major.minor.patch)
- Timestamp tracking
- Author attribution
- Change commit messages
- Branch management

### 2. Diff Visualization
- Side-by-side comparison
- Inline diff view
- Color-coded changes (additions/deletions)
- Section-specific diffs
- Word-level changes
- Export to HTML/PDF

### 3. Change History
- Complete commit history
- Timeline view
- Filter by author/date/section
- Search in history
- Annotation view (blame)
- Change statistics

### 4. Branch Management
- Create branches for experiments
- Merge changes between versions
- Resolve conflicts
- Compare branches
- Switch between versions
- Track multiple submissions

### 5. Rollback & Recovery
- Revert to any previous version
- Partial rollbacks (section-level)
- Undo/redo operations
- Recovery from accidental deletions
- Restore deleted content
- Cherry-pick specific changes

### 6. Collaboration
- Multi-author support
- Author-specific commits
- Conflict resolution
- Peer review integration
- Comment threading
- Suggested edits

## Input Format

```typescript
{
  action: 'init' | 'commit' | 'diff' | 'log' | 'branch' | 'merge' | 'revert' | 'checkout';
  paperPath?: string;              // Path to paper file
  message?: string;                // Commit message
  version?: string;                // Version to checkout/revert
  branchName?: string;             // Branch name
  targetBranch?: string;           // Target for merge
  compareFrom?: string;            // Version/branch to compare from
  compareTo?: string;              // Version/branch to compare to
  section?: string;                // Specific section to diff
  format?: 'text' | 'html' | 'pdf'; // Output format
  limit?: number;                  // Limit history entries
}
```

## Output Format

```typescript
{
  action: string;
  status: 'success' | 'error';
  message: string;

  // For commit
  version?: {
    major: number;
    minor: number;
    patch: number;
    semantic: string;              // e.g., "v2.1.3"
    commitHash: string;
    timestamp: string;
    author: string;
  };

  // For diff
  diff?: {
    from: string;
    to: string;
    changes: Change[];
    additions: number;
    deletions: number;
    modifications: number;
    summary: string;
  };

  // For log
  history?: Array<{
    version: string;
    commitHash: string;
    message: string;
    author: string;
    timestamp: string;
    changes: number;
  }>;

  // For branch
  branch?: {
    name: string;
    createdAt: string;
    baseVersion: string;
    commitsAhead: number;
  };
}
```

## Technical Implementation

### 1. Real Git Integration

This skill uses **real Git commands** for version control:

```typescript
class VersionControlService {
  private repoPath: string;

  /**
   * Initialize Git repository for a paper
   */
  async initRepository(paperPath: string): Promise<void> {
    this.repoPath = path.dirname(paperPath);

    // Check if already a git repo
    const gitDir = path.join(this.repoPath, '.git');
    if (fs.existsSync(gitDir)) {
      console.log('✓ Git repository already exists');
      return;
    }

    // Initialize git repo - real command!
    await this.execGit('init');

    // Create .gitignore
    await this.createGitignore();

    // Create initial commit
    await this.commit('Initial commit', paperPath);

    console.log('✓ Git repository initialized');
  }

  /**
   * Commit changes with message
   */
  async commit(message: string, paperPath?: string): Promise<CommitInfo> {
    // Stage the paper file
    if (paperPath) {
      await this.execGit('add', paperPath);
    }

    // Commit - real git command!
    const result = await this.execGit('commit', '-m', message);

    // Get commit info
    const hash = await this.getCurrentCommitHash();
    const version = await this.calculateVersion();

    return {
      version,
      commitHash: hash,
      timestamp: new Date().toISOString(),
      author: await this.getGitUser(),
      message
    };
  }

  /**
   * Get diff between versions
   */
  async getDiff(from: string, to: string = 'HEAD'): Promise<DiffResult> {
    // Real git diff command!
    const diffOutput = await this.execGit('diff', `${from}..${to}`);

    // Parse diff into structured format
    const changes = this.parseDiff(diffOutput);

    return {
      from,
      to,
      changes,
      additions: changes.filter(c => c.type === 'add').length,
      deletions: changes.filter(c => c.type === 'delete').length,
      modifications: changes.filter(c => c.type === 'modify').length,
      summary: this.generateDiffSummary(changes)
    };
  }

  /**
   * Execute git command - real implementation!
   */
  private async execGit(...args: string[]): Promise<string> {
    const command = `git ${args.join(' ')}`;

    return new Promise((resolve, reject) => {
      exec(command, { cwd: this.repoPath }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Git command failed: ${stderr}`));
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }
}
```

### 2. Semantic Versioning

```typescript
class SemanticVersioning {
  private major = 0;
  private minor = 0;
  private patch = 0;

  /**
   * Calculate version from commit history
   */
  async calculateVersion(): Promise<Version> {
    const commits = await this.getCommitHistory();
    const tags = await this.getTags();

    // Analyze commit messages to determine version bump
    for (const commit of commits) {
      if (commit.message.match(/major:|breaking:/i)) {
        this.major++;
        this.minor = 0;
        this.patch = 0;
      } else if (commit.message.match(/minor:|feature:/i)) {
        this.minor++;
        this.patch = 0;
      } else if (commit.message.match(/patch:|fix:/i)) {
        this.patch++;
      }
    }

    return {
      major: this.major,
      minor: this.minor,
      patch: this.patch,
      semantic: `v${this.major}.${this.minor}.${this.patch}`
    };
  }

  /**
   * Create version tag
   */
  async tagVersion(version: string): Promise<void> {
    await this.execGit('tag', '-a', version, '-m', `Version ${version}`);
  }
}
```

### 3. Diff Parsing & Visualization

```typescript
class DiffVisualizer {
  /**
   * Parse git diff output into structured changes
   */
  parseDiff(diffOutput: string): Change[] {
    const changes: Change[] = [];
    const lines = diffOutput.split('\n');
    let currentChange: Partial<Change> | null = null;

    for (const line of lines) {
      // Parse diff header
      if (line.startsWith('@@')) {
        if (currentChange) {
          changes.push(currentChange as Change);
        }
        currentChange = {
          type: 'modify',
          lineNumber: this.parseLineNumber(line),
          content: []
        };
      }
      // Parse additions
      else if (line.startsWith('+')) {
        if (currentChange) {
          currentChange.content?.push({ type: 'add', text: line.substring(1) });
        }
      }
      // Parse deletions
      else if (line.startsWith('-')) {
        if (currentChange) {
          currentChange.content?.push({ type: 'delete', text: line.substring(1) });
        }
      }
    }

    if (currentChange) {
      changes.push(currentChange as Change);
    }

    return changes;
  }

  /**
   * Generate HTML diff view
   */
  generateHTMLDiff(changes: Change[]): string {
    const html = [];

    html.push('<div class="diff-view">');
    html.push('<table class="diff-table">');

    for (const change of changes) {
      html.push(`<tr class="change-${change.type}">`);

      for (const line of change.content) {
        if (line.type === 'add') {
          html.push(`<td class="line-add">+${escapeHtml(line.text)}</td>`);
        } else if (line.type === 'delete') {
          html.push(`<td class="line-delete">-${escapeHtml(line.text)}</td>`);
        } else {
          html.push(`<td class="line-context"> ${escapeHtml(line.text)}</td>`);
        }
      }

      html.push('</tr>');
    }

    html.push('</table>');
    html.push('</div>');

    return html.join('\n');
  }
}
```

### 4. Change History & Timeline

```typescript
class ChangeHistory {
  /**
   * Get commit history with metadata
   */
  async getHistory(limit: number = 20): Promise<CommitEntry[]> {
    // Real git log command!
    const logOutput = await this.execGit(
      'log',
      `-${limit}`,
      '--pretty=format:%H|%an|%ae|%ai|%s',
      '--stat'
    );

    const entries: CommitEntry[] = [];
    const commits = logOutput.split('\n\n');

    for (const commit of commits) {
      const lines = commit.split('\n');
      const [hash, author, email, date, message] = lines[0].split('|');

      // Parse stats from subsequent lines
      const stats = this.parseStats(lines.slice(1));

      entries.push({
        commitHash: hash,
        author: `${author} <${email}>`,
        timestamp: date,
        message,
        changes: stats.additions + stats.deletions,
        additions: stats.additions,
        deletions: stats.deletions
      });
    }

    return entries;
  }

  /**
   * Generate timeline visualization
   */
  generateTimeline(history: CommitEntry[]): string {
    const timeline = ['<div class="timeline">'];

    for (const entry of history) {
      timeline.push(`
        <div class="timeline-entry">
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <div class="timeline-date">${entry.timestamp}</div>
            <div class="timeline-author">${entry.author}</div>
            <div class="timeline-message">${entry.message}</div>
            <div class="timeline-stats">
              +${entry.additions} -${entry.deletions}
            </div>
          </div>
        </div>
      `);
    }

    timeline.push('</div>');
    return timeline.join('\n');
  }
}
```

### 5. Branch Management

```typescript
class BranchManager {
  /**
   * Create new branch
   */
  async createBranch(name: string, baseVersion: string = 'HEAD'): Promise<Branch> {
    // Real git branch command!
    await this.execGit('branch', name, baseVersion);

    return {
      name,
      createdAt: new Date().toISOString(),
      baseVersion,
      commitsAhead: 0
    };
  }

  /**
   * List all branches
   */
  async listBranches(): Promise<Branch[]> {
    const output = await this.execGit('branch', '-a');
    const branches: Branch[] = [];

    for (const line of output.split('\n')) {
      const name = line.trim().replace('*', '').trim();
      branches.push({
        name,
        createdAt: await this.getBranchCreationDate(name),
        baseVersion: 'HEAD',
        commitsAhead: await this.getCommitsAhead(name)
      });
    }

    return branches;
  }

  /**
   * Merge branches
   */
  async merge(source: string, target: string): Promise<MergeResult> {
    // Checkout target
    await this.execGit('checkout', target);

    // Merge source - real git merge!
    try {
      await this.execGit('merge', source);
      return {
        success: true,
        message: `Successfully merged ${source} into ${target}`,
        conflicts: []
      };
    } catch (error) {
      // Handle merge conflicts
      const conflicts = await this.detectConflicts();
      return {
        success: false,
        message: `Merge conflicts detected`,
        conflicts
      };
    }
  }
}
```

## Usage Examples

### Example 1: Initialize Version Control
```typescript
const vc = new VersionControlService();

// Initialize git repo for paper
await vc.initRepository('./papers/main-paper.tex');
// Output: ✓ Git repository initialized
//         Commit: v0.1.0 (abc1234)
```

### Example 2: Track Changes
```typescript
// Make changes and commit
const result = await vc.commit({
  paperPath: './papers/main-paper.tex',
  message: 'minor: Added methodology section'
});

console.log(`Version: ${result.version.semantic}`); // v0.2.0
console.log(`Commit: ${result.commitHash}`);
```

### Example 3: Compare Versions
```typescript
// Get diff between versions
const diff = await vc.diff({
  compareFrom: 'v0.1.0',
  compareTo: 'v0.2.0'
});

console.log(`Additions: ${diff.additions}`);
console.log(`Deletions: ${diff.deletions}`);
console.log(`Summary: ${diff.summary}`);

// Generate HTML view
const html = await vc.generateHTMLDiff(diff);
fs.writeFileSync('./diff.html', html);
```

### Example 4: View History
```typescript
// Get change history
const history = await vc.log({ limit: 10 });

history.forEach(entry => {
  console.log(`${entry.version} - ${entry.message}`);
  console.log(`  Author: ${entry.author}`);
  console.log(`  Date: ${entry.timestamp}`);
  console.log(`  Changes: +${entry.additions} -${entry.deletions}`);
});
```

### Example 5: Create Branch for Experiment
```typescript
// Create experimental branch
await vc.createBranch({
  branchName: 'experiment-alternative-method',
  baseVersion: 'v0.2.0'
});

// Make experimental changes
await vc.commit({
  paperPath: './papers/main-paper.tex',
  message: 'feat: Added alternative methodology'
});

// Switch back to main
await vc.checkout({ version: 'main' });
```

### Example 6: Revert to Previous Version
```typescript
// Revert to specific version
await vc.revert({
  version: 'v0.1.5',
  paperPath: './papers/main-paper.tex'
});
console.log('Reverted to v0.1.5');
```

### Example 7: Generate Change Summary
```typescript
// Generate summary of recent changes
const summary = await vc.generateSummary({
  from: 'v0.1.0',
  to: 'HEAD',
  format: 'markdown'
});

console.log(summary);
/*
# Change Summary v0.1.0 → v0.2.0

## Major Changes
- Added methodology section (150 lines)
- Revised introduction (50 lines)

## Minor Changes
- Fixed typos in abstract (5 lines)
- Updated references (10 lines)

Total: 215 additions, 15 deletions
*/
```

## Best Practices

1. **Commit Often**: Make frequent, small commits with clear messages
2. **Semantic Messages**: Use "major:", "minor:", "patch:" prefixes
3. **Tag Releases**: Create git tags for submitted versions
4. **Branch Experiments**: Use branches for experimental changes
5. **Review Diffs**: Always review diffs before committing
6. **Write Good Messages**: Explain what and why, not how
7. **Backup Regularly**: Push to remote repository

## Workflow Examples

### Academic Writing Workflow
```bash
# 1. Initialize paper
vc init ./paper.tex

# 2. Create draft branch
vc branch draft-1

# 3. Make changes
vc commit "minor: Draft 1 complete"

# 4. Create review branch
vc branch review

# 5. Address reviewer comments
vc commit "patch: Fixed reviewer 1 comments"

# 6. Merge back
vc merge review main

# 7. Tag submission version
vc tag v1.0.0
```

### Multi-Author Collaboration
```bash
# Author 1: Create feature branch
vc branch feature-methodology

# Author 2: Create different feature branch
vc branch feature-experiments

# Both: Work independently, commit regularly

# Author 1: Merge their work
vc merge feature-methodology main

# Author 2: Merge their work (resolve conflicts)
vc merge feature-experiments main
```

## Integration with Other Tools

### Citation Manager Integration
```typescript
// Auto-commit when citations change
citationManager.on('citations-changed', async (citations) => {
  await vc.commit({
    message: `patch: Updated ${citations.length} citations`
  });
});
```

### Editor Integration
```typescript
// Auto-save with version control
editor.on('save', async (content) => {
  await fs.writeFile('./paper.tex', content);
  await vc.commit({
    message: `patch: Auto-save at ${new Date().toLocaleString()}`
  });
});
```

## Related Skills

- **conversational-editor**: Natural language interface for version control
- **writing-quality**: Track quality improvements across versions
- **citation-manager**: Version citations alongside paper
- **pdf-analyzer**: Compare PDF versions

## Advanced Features

### 1. Automatic Backup
```typescript
const autoBackup = new AutoBackup(vc);
autoBackup.every('5 minutes', async () => {
  await vc.commit('patch: Auto-backup');
});
```

### 2. Conflict Resolution Assistant
```typescript
const resolver = new ConflictResolver(vc);
const solutions = await resolver.suggestResolutions(conflicts);
```

### 3. Rollback Safety
```typescript
// Create backup before major changes
await vc.createCheckpoint('before-major-revision');

// Rollback if needed
await vc.rollbackToCheckpoint('before-major-revision');
```

### 4. Integration with LaTeX
```typescript
// Track sections separately
await vc.commit({
  message: 'minor: Revised introduction',
  section: 'introduction'
});
```

### 5. Peer Review Integration
```typescript
// Create branch for each reviewer
const reviewers = ['reviewer1', 'reviewer2'];
for (const reviewer of reviewers) {
  await vc.createBranch(`review-${reviewer}`);
}
```

## Setup and Configuration

### Git Configuration
```bash
# Set user info
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Set default branch name
git config init.defaultBranch main

# Set merge strategy
git config merge.diff3 true
```

### Service Configuration
```typescript
const vc = new VersionControlService({
  repoPath: './papers',
  autoCommit: true,
  semanticVersioning: true,
  createTags: true
});
```
