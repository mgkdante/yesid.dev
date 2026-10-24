export interface WorkflowJobBlockOptions {
  readonly expectedNext?: string;
}

export interface WorkflowStepBlockOptions {
  readonly beforeStep?: string;
  readonly throughJobEnd?: boolean;
}

export function workflowJobBlock(
  workflow: string,
  name: string,
  options: WorkflowJobBlockOptions = {},
): string | null {
  const jobsOffset = workflow.indexOf("\njobs:\n");
  if (jobsOffset < 0) return null;
  const start = workflow.indexOf(`\n  ${name}:\n`, jobsOffset);
  if (start < 0) return null;
  const bodyStart = start + 1;
  const next = /\n  ([A-Za-z0-9_-]+):\n/u.exec(workflow.slice(bodyStart));
  const actualNext = next?.[1];
  if (options.expectedNext && actualNext !== options.expectedNext) {
    throw new Error(
      `expected workflow job ${options.expectedNext} after ${name}, found ${actualNext ?? "EOF"}`,
    );
  }
  const end = next ? bodyStart + next.index : workflow.length;
  return workflow.slice(bodyStart, end).trimEnd();
}

export function workflowStepBlock(
  job: string,
  name: string,
  options: WorkflowStepBlockOptions = {},
): string | null {
  const marker = `      - name: ${name}\n`;
  const start = job.indexOf(marker);
  if (start < 0) return null;

  let end: number;
  if (options.beforeStep) {
    const next = job.indexOf(
      `      - name: ${options.beforeStep}\n`,
      start + marker.length,
    );
    end = next < 0 ? job.length : next;
  } else if (options.throughJobEnd) {
    end = job.length;
  } else {
    const next = job.indexOf("\n      - ", start + marker.length);
    end = next < 0 ? job.length : next;
  }
  return job.slice(start, end).trimEnd();
}
