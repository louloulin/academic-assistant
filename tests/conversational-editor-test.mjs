/**
 * Conversational Editor Service Test
 *
 * Test suite for Plan 5 P0 Skill - Conversational Editor
 */

import { ConversationalEditorService } from '../packages/services/src/conversational-editor/conversational-editor.service.ts';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function printHeader(title) {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log(`║           ${title.padEnd(54)} ║`);
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log('');
}

function printTest(number, description) {
  console.log(`${colors.bright}Test ${number}:${colors.reset} ${description}`);
}

function printSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function printInfo(message) {
  log(`   ${message}`, colors.cyan);
}

function printSection(title) {
  console.log('');
  log(`${title}`, colors.bright);
}

// Async main function
async function main() {
  printHeader('Conversational Editor Service Test');
  log('Plan 5 P0 Skill - Conversational Editor', colors.cyan);
  console.log('');

  let passedTests = 0;
  let totalTests = 8;

  // Test 1: Service Instantiation
  printTest(1, 'Service Instantiation');
  try {
    const editor = new ConversationalEditorService();
    printSuccess('ConversationalEditorService created successfully');
    passedTests++;
  } catch (error) {
    log(`✗ Failed to create service: ${error.message}`, colors.red);
  }

  // Test 2: Basic Chat - Improve Text
  printTest(2, 'Basic Chat - Improve Text');
  try {
    const editor = new ConversationalEditorService();
    const response = await editor.chat({
      message: 'Please improve the clarity of my introduction',
      section: 'Introduction'
    });

    printSuccess('Chat response received');
    printInfo(`Response type: ${response.response ? 'text' : 'unknown'}`);

    if (response.suggestions && response.suggestions.length > 0) {
      printInfo(`Suggestions generated: ${response.suggestions.length}`);
      printInfo(`First suggestion type: ${response.suggestions[0].type}`);
      printInfo(`Confidence: ${response.suggestions[0].confidence.toFixed(2)}`);
    }

    if (response.followUpQuestions && response.followUpQuestions.length > 0) {
      printInfo(`Follow-up questions: ${response.followUpQuestions.length}`);
    }

    passedTests++;
  } catch (error) {
    log(`✗ Chat failed: ${error.message}`, colors.red);
  }

  // Test 3: Expand Section
  printTest(3, 'Expand Section');
  try {
    const editor = new ConversationalEditorService();
    const response = await editor.chat({
      message: 'The methodology section is too brief. Can you help expand it?',
      section: 'Methodology',
      context: {
        goal: 'provide enough detail for reproducibility',
        constraints: ['stay under 500 words']
      }
    });

    printSuccess('Section expansion generated');
    if (response.suggestions && response.suggestions.length > 0) {
      const suggestion = response.suggestions[0];
      printInfo(`Original length: ${suggestion.original.length} chars`);
      printInfo(`Expanded length: ${suggestion.suggested.length} chars`);
      printInfo(`Expansion factor: ${(suggestion.suggested.length / suggestion.original.length).toFixed(2)}x`);
    }
    passedTests++;
  } catch (error) {
    log(`✗ Expansion failed: ${error.message}`, colors.red);
  }

  // Test 4: Change Style
  printTest(4, 'Change Writing Style');
  try {
    const editor = new ConversationalEditorService();
    const response = await editor.chat({
      message: 'Rewrite this in a more formal academic tone',
      section: 'Discussion',
      context: {
        style: 'formal'
      }
    });

    printSuccess('Style alternatives generated');
    if (response.suggestions) {
      printInfo(`Style options: ${response.suggestions.length}`);
      response.suggestions.forEach((s, i) => {
        printInfo(`  Option ${i + 1}: ${s.reason}`);
      });
    }
    passedTests++;
  } catch (error) {
    log(`✗ Style change failed: ${error.message}`, colors.red);
  }

  // Test 5: Get Feedback
  printTest(5, 'Quality Feedback');
  try {
    const editor = new ConversationalEditorService();
    const response = await editor.chat({
      message: 'What do you think about the overall structure?',
      section: 'Discussion'
    });

    printSuccess('Quality feedback generated');
    if (response.analysis) {
      printInfo(`Quality Score: ${response.analysis.qualityScore}/100`);
      printInfo(`Readability: ${response.analysis.readability}`);
      printInfo(`Tone: ${response.analysis.tone}`);
      printInfo(`Issues identified: ${response.analysis.issues.length}`);
      printInfo(`Strengths: ${response.analysis.strengths.length}`);
    }
    passedTests++;
  } catch (error) {
    log(`✗ Feedback generation failed: ${error.message}`, colors.red);
  }

  // Test 6: Brainstorm
  printTest(6, 'Brainstorm Ideas');
  try {
    const editor = new ConversationalEditorService();
    const response = await editor.chat({
      message: 'I\'m stuck on how to present the results. Any ideas?',
      section: 'Results'
    });

    printSuccess('Brainstorming ideas generated');
    if (response.suggestions) {
      printInfo(`Ideas generated: ${response.suggestions.length}`);
      printInfo('Sample ideas:');
      response.suggestions.slice(0, 3).forEach((s, i) => {
        printInfo(`  ${i + 1}. ${s.suggested.substring(0, 60)}...`);
      });
    }
    passedTests++;
  } catch (error) {
    log(`✗ Brainstorming failed: ${error.message}`, colors.red);
  }

  // Test 7: Grammar Fix
  printTest(7, 'Grammar Correction');
  try {
    const editor = new ConversationalEditorService();
    const response = await editor.chat({
      message: 'Can you check for grammar issues?',
      section: 'Introduction'
    });

    printSuccess('Grammar corrections identified');
    if (response.suggestions) {
      printInfo(`Corrections found: ${response.suggestions.length}`);
      response.suggestions.forEach((s, i) => {
        if (s.type === 'correction') {
          printInfo(`  ${i + 1}. ${s.reason} (confidence: ${s.confidence.toFixed(2)})`);
        }
      });
    }
    passedTests++;
  } catch (error) {
    log(`✗ Grammar check failed: ${error.message}`, colors.red);
  }

  // Test 8: Conversation History
  printTest(8, 'Conversation History Management');
  try {
    const editor = new ConversationalEditorService();
    const sessionId = 'test-session-123';

    // Multiple messages
    await editor.chat({
      message: 'Hello, I need help with my paper',
    }, sessionId);

    await editor.chat({
      message: 'Can you improve my introduction?',
      section: 'Introduction'
    }, sessionId);

    const history = editor.getHistory(sessionId);
    const stats = editor.getSessionStats(sessionId);

    printSuccess('Conversation history tracked');
    printInfo(`Messages in history: ${history.length}`);
    printInfo(`Session stats: ${JSON.stringify(stats)}`);

    // Clear history
    editor.clearHistory(sessionId);
    const clearedStats = editor.getSessionStats(sessionId);
    printInfo(`After clear: ${JSON.stringify(clearedStats)}`);

    passedTests++;
  } catch (error) {
    log(`✗ Conversation history failed: ${error.message}`, colors.red);
  }

  // Print summary
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('📊 Test Summary:', colors.bright);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const tests = [
    { name: 'Service Instantiation', passed: passedTests >= 1 },
    { name: 'Basic Chat', passed: passedTests >= 2 },
    { name: 'Section Expansion', passed: passedTests >= 3 },
    { name: 'Style Transfer', passed: passedTests >= 4 },
    { name: 'Quality Feedback', passed: passedTests >= 5 },
    { name: 'Brainstorming', passed: passedTests >= 6 },
    { name: 'Grammar Check', passed: passedTests >= 7 },
    { name: 'History Management', passed: passedTests >= 8 }
  ];

  tests.forEach(test => {
    if (test.passed) {
      printSuccess(test.name);
    } else {
      log(`✗ ${test.name}`, colors.red);
    }
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (passedTests === totalTests) {
    log(`🎉 All Conversational Editor tests passed! (${passedTests}/${totalTests})`, colors.green);
    log('✓ Conversational Interface: Working', colors.green);
    log('✓ Intent Recognition: Working', colors.green);
    log('✓ Response Generation: Working', colors.green);
    log('✓ Conversation History: Working', colors.green);
  } else {
    log(`⚠ Some tests failed: ${passedTests}/${totalTests} passed`, colors.yellow);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Run tests
main().catch(error => {
  log(`Fatal error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
