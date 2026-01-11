---
name: collaboration-hub
description: Facilitate collaborative academic writing with version control, comments, and real-time sync
allowed-tools:
  - WebSearch
  - Read
  - Write
  - Bash
  - MCPTool
  - Skill
context: fork
---

# Collaboration Hub Skill

## Overview

The Collaboration Hub skill enables real-time collaborative academic writing with version control, commenting, and synchronization features.

## Capabilities

### 1. Collaborative Editing
- Real-time document collaboration
- Conflict resolution for simultaneous edits
- Change tracking and highlighting
- Edit history and version comparison

### 2. Comment System
- Inline comments on specific text sections
- Threaded discussions
- Comment resolution workflow
- Notification system

### 3. Version Control
- Git integration for version management
- Branch-based collaboration
- Merge request workflow
- Diff visualization

### 4. Task Management
- Assign writing tasks to collaborators
- Track task progress
- Priority management
- Deadline tracking

### 5. Real-time Sync
- WebSocket-based synchronization
- Operational transformation (OT)
- Automatic conflict resolution
- Presence indicators

## Usage Examples

### Real-time Collaboration

```typescript
// Start collaborative session
const session = await hub.startSession({
  documentId: 'paper-123',
  collaborators: ['alice', 'bob', 'charlie'],
  mode: 'real-time'
});

// Apply edit
await hub.applyEdit({
  sessionId: session.id,
  userId: 'alice',
  operation: {
    type: 'insert',
    position: 150,
    text: 'Recent studies show that...'
  }
});
```

### Comment Management

```typescript
// Add comment
const comment = await hub.addComment({
  documentId: 'paper-123',
  userId: 'bob',
  text: 'This paragraph needs more citations',
  range: { start: 200, end: 350 }
});

// Reply to comment
await hub.replyToComment({
  commentId: comment.id,
  userId: 'alice',
  text: 'I will add references to support this'
});

// Resolve comment
await hub.resolveComment({
  commentId: comment.id,
  userId: 'bob'
});
```

### Version Management

```typescript
// Create branch
await hub.createBranch({
  documentId: 'paper-123',
  branchName: 'alternative-introduction',
  sourceBranch: 'main'
});

// Create merge request
const mr = await hub.createMergeRequest({
  documentId: 'paper-123',
  sourceBranch: 'alternative-introduction',
  targetBranch: 'main',
  title: 'Revise introduction with new literature'
});

// Review changes
const diff = await hub.getDiff({
  mergeRequestId: mr.id
});
```

### Task Assignment

```typescript
// Create task
const task = await hub.createTask({
  documentId: 'paper-123',
  title: 'Expand literature review',
  description: 'Add recent publications from 2024',
  assignee: 'charlie',
  priority: 'high',
  deadline: '2024-02-15'
});

// Update task status
await hub.updateTask({
  taskId: task.id,
  status: 'in-progress',
  progress: 60
});
```

## Output Format

### Session Response

```typescript
{
  sessionId: string,
  documentId: string,
  collaborators: string[],
  status: 'active' | 'archived',
  createdAt: Date,
  lastActivity: Date
}
```

### Comment Response

```typescript
{
  commentId: string,
  documentId: string,
  userId: string,
  text: string,
  range: { start: number, end: number },
  replies: CommentReply[],
  status: 'active' | 'resolved',
  createdAt: Date
}
```

### Version Response

```typescript
{
  versionId: string,
  branchName: string,
  commitHash: string,
  author: string,
  timestamp: Date,
  changes: Change[],
  stats: {
    insertions: number,
    deletions: number,
    files: number
  }
}
```

### Task Response

```typescript
{
  taskId: string,
  documentId: string,
  title: string,
  description: string,
  assignee: string,
  status: 'todo' | 'in-progress' | 'completed',
  priority: 'low' | 'medium' | 'high',
  deadline: Date,
  progress: number
}
```

## Configuration

### Session Settings

```typescript
{
  syncMode: 'real-time' | 'periodic',
  conflictResolution: 'last-write-wins' | 'operational-transform',
  autoSave: boolean,
  autoSaveInterval: number
}
```

### Notification Settings

```typescript
{
  email: boolean,
  webhooks: string[],
  events: ('comment' | 'edit' | 'task' | 'merge-request')[]
}
```

## Integration with Git

```bash
# Initialize collaboration repo
git init paper-collab.git

# Add remote
git remote add origin https://github.com/team/paper.git

# Create feature branch
git checkout -b feature/revised-intro

# Push changes
git push origin feature/revised-intro

# Create pull request
gh pr create --title "Revised introduction" --body "Updates based on recent feedback"
```

## Best Practices

1. **Branch Management**: Use descriptive branch names for features
2. **Commit Messages**: Follow conventional commits format
3. **Comment Etiquette**: Be constructive and specific
4. **Task Breakdown**: Divide large sections into smaller tasks
5. **Code Review**: Always review merge requests before merging

## Limitations

- Real-time sync requires WebSocket connection
- Large documents may have performance impact
- Conflict resolution may need manual intervention
- Git integration requires proper authentication

## Future Enhancements

- [ ] Video/Audio commenting
- [ ] AI-powered conflict resolution
- [ ] Integration with academic social networks
- [ ] Advanced analytics and reporting
- [ ] Mobile app support
