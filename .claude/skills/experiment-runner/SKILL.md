---
name: experiment-runner
description: Execute research experiments in isolated sandboxed environments with support for Python, R, Julia, and other languages
allowed-tools:
  - WebSearch
  - Read
  - Write
  - Bash
  - MCPTool
context: fork
---

# Experiment Runner Skill

Execute research experiments in isolated sandboxed environments. Run Python, R, Julia, and other scientific computing code safely with resource limits, result visualization, and reproducibility tracking.

## When to Use

Use this skill when the user asks to:
- Run experiment code (Python, R, Julia, etc.)
- Execute data analysis scripts
- Test machine learning models
- Run statistical tests
- Visualize experimental results
- Benchmark algorithms
- Reproduce research experiments
- Run simulations

## Capabilities

### 1. Multi-Language Support
- Python (NumPy, Pandas, SciPy, Scikit-learn, PyTorch, TensorFlow)
- R (ggplot2, dplyr, tidyr, caret)
- Julia (DataFrames, Plots, DifferentialEquations)
- JavaScript/TypeScript (scientific libraries)
- Bash scripts for pipeline orchestration

### 2. Sandboxed Execution
- Docker container isolation
- Resource limits (CPU, memory, disk, network)
- Timeout controls
- File system isolation
- Network restrictions
- Process monitoring

### 3. Result Capture
- Standard output/error capture
- File output collection
- Plot/image extraction
- Data file generation
- Metrics logging
- Performance profiling

### 4. Visualization Support
- Matplotlib figures (Python)
- ggplot2 plots (R)
- Plots.jl (Julia)
- Interactive charts
- Heatmaps and 3D plots
- Statistical plots

### 5. Reproducibility
- Environment snapshot
- Dependency versioning
- Random seed control
- Parameter logging
- Execution history
- Result versioning

### 6. Error Handling
- Exception catching
- Debugging assistance
- Stack trace analysis
- Error recovery suggestions
- Partial result handling

## Input Format

```typescript
{
  code: string;                   // Code to execute
  language: 'python' | 'r' | 'julia' | 'javascript' | 'bash';
  timeout?: number;               // Timeout in seconds (default: 60)
  memoryLimit?: number;           // Memory limit in MB (default: 512)
  cpuLimit?: number;              // CPU limit (default: 1)
  captureOutput?: boolean;        // Capture stdout/stderr
  returnFiles?: string[];         // Files to return after execution
  installPackages?: string[];     // Packages to install
  environment?: Record<string, string>; // Environment variables
  workingDir?: string;            // Working directory
}
```

## Output Format

```typescript
{
  executionId: string;
  status: 'success' | 'error' | 'timeout' | 'memory-exceeded';

  output?: {
    stdout: string;
    stderr: string;
    exitCode: number;
  };

  results?: {
    files: Array<{
      path: string;
      content: string;           // Base64 for binary
      type: 'data' | 'plot' | 'log';
    }>;
    plots: Array<{
      format: 'png' | 'svg' | 'pdf';
      data: string;              // Base64
      caption?: string;
    }>;
    metrics: {
      executionTime: number;     // milliseconds
      peakMemory: number;        // MB
      cpuUsage: number;          // percentage
    };
  };

  error?: {
    type: string;
    message: string;
    stackTrace: string;
    suggestions: string[];
  };
}
```

## Technical Implementation

### 1. Docker Integration

```typescript
class ExperimentRunner {
  private docker: Dockerode;

  /**
   * Execute code in Docker container
   */
  async execute(options: ExecutionOptions): Promise<ExecutionResult> {
    // Create container with resource limits
    const container = await this.createContainer({
      image: this.getImage(options.language),
      memoryLimit: options.memoryLimit || 512,
      cpuLimit: options.cpuLimit || 1,
      timeout: options.timeout || 60
    });

    try {
      // Write code to container
      await container.writeFile('/workspace/experiment.py', options.code);

      // Install packages if needed
      if (options.installPackages) {
        await this.installPackages(container, options.language, options.installPackages);
      }

      // Start execution
      const startTime = Date.now();
      const execResult = await this.runCode(container, options);
      const executionTime = Date.now() - startTime;

      // Capture outputs
      const files = await this.captureFiles(container, options.returnFiles);
      const plots = await this.capturePlots(container, options.language);

      return {
        executionId: this.generateId(),
        status: 'success',
        output: execResult,
        results: {
          files,
          plots,
          metrics: {
            executionTime,
            peakMemory: execResult.memoryUsage,
            cpuUsage: execResult.cpuUsage
          }
        }
      };
    } finally {
      // Cleanup container
      await container.stop();
      await container.remove();
    }
  }

  /**
   * Create Docker container with limits
   */
  private async createContainer(config: ContainerConfig): Promise<Container> {
    const container = await this.docker.createContainer({
      Image: config.image,
      Tty: false,
      HostConfig: {
        Memory: config.memoryLimit * 1024 * 1024, // Convert MB to bytes
        CpuQuota: config.cpuLimit * 100000,
        NetworkMode: 'none', // No network access
        LogConfig: {
          Type: 'json-file',
          Config: {}
        }
      },
      Env: process.env
    });

    await container.start();
    return container;
  }
}
```

### 2. Language-Specific Executors

```typescript
/**
 * Python Executor
 */
class PythonExecutor {
  async execute(container: Container, code: string): Promise<ExecResult> {
    // Prepend matplotlib setup for headless rendering
    const wrappedCode = `
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import sys
from io import StringIO

# Capture output
old_stdout = sys.stdout
sys.stdout = StringIO()

try:
${this.indent(code)}
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()

# Get output
output = sys.stdout.getvalue()
sys.stdout = old_stdout
print(output, end='')
`;

    const exec = await container.exec({
      Cmd: ['python3', '-c', wrappedCode],
      AttachStdout: true,
      AttachStderr: true
    });

    const stream = await exec.start({ Detach: false });
    return await this.captureOutput(stream);
  }

  /**
   * Install Python packages
   */
  async installPackages(container: Container, packages: string[]): Promise<void> {
    const cmd = ['pip', 'install', '--quiet', ...packages];
    await container.exec({ Cmd: cmd });
  }
}

/**
 * R Executor
 */
class RExecutor {
  async execute(container: Container, code: string): Promise<ExecResult> {
    const wrappedCode = `
# Setup for headless plotting
options(device=pdf())
sink(tempfile())

try {
${code}
} catch (e) {
  cat("Error:", conditionMessage(e), "\\n")
}
`;

    const exec = await container.exec({
      Cmd: ['Rscript', '-e', wrappedCode],
      AttachStdout: true,
      AttachStderr: true
    });

    const stream = await exec.start({ Detach: false });
    return await this.captureOutput(stream);
  }
}
```

### 3. Plot Capture

```typescript
class PlotCapture {
  /**
   * Capture plots from container
   */
  async capturePlots(container: Container, language: string): Promise<Plot[]> {
    const plots: Plot[] = [];

    if (language === 'python') {
      // Capture matplotlib plots
      const pythonFiles = await container.listFiles('/workspace');
      const pngFiles = pythonFiles.filter(f => f.endsWith('.png'));

      for (const file of pngFiles) {
        const data = await container.readFile(file);
        plots.push({
          format: 'png',
          data: data.toString('base64'),
          caption: file
        });
      }
    }

    if (language === 'r') {
      // Capture R plots
      const pdfFiles = await container.listFiles('/workspace');
      for (const file of pdfFiles) {
        const data = await container.readFile(file);
        plots.push({
          format: 'pdf',
          data: data.toString('base64'),
          caption: file
        });
      }
    }

    return plots;
  }
}
```

### 4. Resource Monitoring

```typescript
class ResourceMonitor {
  /**
   * Monitor container resource usage
   */
  async monitor(container: Container): Promise<ResourceUsage> {
    const stats = await container.stats({ stream: false });

    return {
      cpuUsage: this.calculateCPU(stats),
      memoryUsage: this.calculateMemory(stats),
      networkIO: this.calculateNetwork(stats),
      diskIO: this.calculateDisk(stats)
    };
  }

  private calculateCPU(stats: any): number {
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage -
                    stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage -
                       stats.precpu_stats.system_cpu_usage;
    return (cpuDelta / systemDelta) * 100;
  }

  private calculateMemory(stats: any): number {
    return stats.memory_stats.usage / (1024 * 1024); // Convert to MB
  }
}
```

## Usage Examples

### Example 1: Python Data Analysis
```typescript
const result = await runner.execute({
  code: `
import numpy as np
import pandas as pd

data = np.random.randn(1000)
df = pd.DataFrame({'values': data})

print(df.describe())
`,
  language: 'python',
  timeout: 30
});

console.log(result.output.stdout);
// Output: count, mean, std, min, 25%, 50%, 75%, max
```

### Example 2: Statistical Test in R
```typescript
const result = await runner.execute({
  code: `
data <- c(2.5, 3.5, 2.9, 3.1, 2.7)
t.test(data, mu = 2.5)
`,
  language: 'r',
  captureOutput: true
});

console.log(result.output.stdout);
// T-test results
```

### Example 3: Machine Learning with PyTorch
```typescript
const result = await runner.execute({
  code: `
import torch
import torch.nn as nn

model = nn.Sequential(
    nn.Linear(10, 5),
    nn.ReLU(),
    nn.Linear(5, 2)
)

x = torch.randn(1, 10)
output = model(x)
print('Output shape:', output.shape)
print('Output:', output.detach().numpy())
`,
  language: 'python',
  installPackages: ['torch'],
  timeout: 120,
  memoryLimit: 1024
});
```

### Example 4: Generate Plot
```typescript
const result = await runner.execute({
  code: `
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 2*np.pi, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y)
plt.title('Sine Wave')
plt.xlabel('x')
plt.ylabel('sin(x)')
plt.grid(True)
plt.savefig('/workspace/sine.png')
print('Plot saved')
`,
  language: 'python',
  returnFiles: ['sine.png']
});

console.log(`Generated ${result.results.plots.length} plots`);
// Returns base64-encoded PNG
```

### Example 5: Julia Differential Equations
```typescript
const result = await runner.execute({
  code: `
using DifferentialEquations
using Plots

α = 1.01
f(u, p, t) = -α * u
u0 = 1.0
tspan = (0.0, 1.0)

prob = ODEProblem(f, u0, tspan)
sol = solve(prob)

println("Solution at t=0.5: ", sol(0.5))
`,
  language: 'julia',
  installPackages: ['DifferentialEquations']
});
```

### Example 6: Data Visualization with R
```typescript
const result = await runner.execute({
  code: `
library(ggplot2)
data(mtcars)

ggplot(mtcars, aes(x=wt, y=mpg)) +
  geom_point() +
  geom_smooth(method='lm') +
  theme_minimal() +
  ggtitle('MPG vs Weight')

ggsave('/workspace/mtcars.png')
`,
  language: 'r',
  returnFiles: ['mtcars.png']
});
```

## Best Practices

1. **Set Appropriate Timeouts**: Prevent runaway experiments
2. **Limit Resources**: Avoid exhausting system resources
3. **Handle Errors**: Always check execution status
4. **Capture Outputs**: Save both stdout and stderr
5. **Return Files**: Explicitly specify files to return
6. **Install Dependencies**: List required packages
7. **Use Seed**: For reproducibility, set random seeds

## Security Considerations

1. **Container Isolation**: All code runs in isolated containers
2. **No Network Access**: By default, network is disabled
3. **Resource Limits**: CPU and memory are constrained
4. **Ephemeral**: Containers are destroyed after execution
5. **File System**: Limited access to host file system
6. **Timeout**: Automatic termination after timeout

## Supported Libraries

### Python
- NumPy, Pandas, SciPy
- Scikit-learn, TensorFlow, PyTorch
- Matplotlib, Seaborn, Plotly
- Statsmodels, Scipy

### R
- ggplot2, dplyr, tidyr
- caret, randomForest
- data.table, lubridate
- shiny, plotly

### Julia
- DataFrames, Plots
- DifferentialEquations
- Flux (machine learning)
- Gadfly, UnicodePlots

## Related Skills

- **data-analyzer**: Statistical analysis recommendations
- **pdf-analyzer**: Include experiment results in papers
- **conversational-editor**: Natural language experiment interface
- **workflow-manager**: Orchestrate multi-step experiments

## Advanced Features

### 1. Interactive Sessions
```typescript
const session = await runner.createSession({ language: 'python' });
await session.execute('x = 10');
await session.execute('y = x * 2');
const result = await session.execute('print(y)');
// Output: 20
```

### 2. Parallel Execution
```typescript
const results = await Promise.all([
  runner.execute({ code: '...', language: 'python' }),
  runner.execute({ code: '...', language: 'r' }),
  runner.execute({ code: '...', language: 'julia' })
]);
```

### 3. Result Comparison
```typescript
const comparison = runner.compareResults([
  result1,  // Control group
  result2   // Treatment group
]);
```

### 4. Progress Tracking
```typescript
runner.on('progress', (update) => {
  console.log(`${update.percent}% complete`);
});

await runner.execute({
  code: longRunningExperiment,
  language: 'python',
  timeout: 600
});
```

## Setup and Configuration

### Docker Installation
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group
sudo usermod -aG docker $USER

# Verify installation
docker run hello-world
```

### Custom Images
```typescript
// Build custom image with specific packages
const customImage = await runner.buildImage({
  name: 'my-experiment-env',
  packages: ['torch', 'tensorflow'],
  systemPackages: ['libcairo2-dev']
});
```

### Environment Variables
```typescript
await runner.execute({
  code: 'import os; print(os.getenv("MY_VAR"))',
  language: 'python',
  environment: {
    MY_VAR: 'custom-value'
  }
});
```
