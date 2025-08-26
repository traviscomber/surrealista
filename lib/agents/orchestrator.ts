import { DocumentAgent } from "./document-agent"
import { FolderAgent } from "./folder-agent"
import { ValidationAgent } from "./validation-agent"
import { ExtractionAgent } from "./extraction-agent"

export interface AgentTask {
  id: string
  type: "organize" | "extract" | "validate" | "classify"
  priority: "high" | "medium" | "low"
  data: any
  status: "pending" | "processing" | "completed" | "failed"
  result?: any
  error?: string
}

export interface AgentResult {
  success: boolean
  data?: any
  error?: string
  confidence: number
  processingTime: number
}

export class DocumentOrchestrator {
  private agents: {
    document: DocumentAgent
    folder: FolderAgent
    validation: ValidationAgent
    extraction: ExtractionAgent
  }

  private taskQueue: AgentTask[] = []
  private activeProcesses: Map<string, Promise<AgentResult>> = new Map()

  constructor() {
    this.agents = {
      document: new DocumentAgent(),
      folder: new FolderAgent(),
      validation: new ValidationAgent(),
      extraction: new ExtractionAgent(),
    }
  }

  async processGoogleDriveFolder(folderId: string): Promise<AgentResult> {
    console.log(`[v0] Orchestrator: Starting processing of folder ${folderId}`)

    const tasks: AgentTask[] = [
      {
        id: `folder-${folderId}-analyze`,
        type: "organize",
        priority: "high",
        data: { folderId, action: "analyze" },
        status: "pending",
      },
      {
        id: `folder-${folderId}-validate`,
        type: "validate",
        priority: "high",
        data: { folderId, standard: "sur-realista-6-categories" },
        status: "pending",
      },
      {
        id: `folder-${folderId}-extract`,
        type: "extract",
        priority: "medium",
        data: { folderId, extractTypes: ["rol", "dates", "amounts"] },
        status: "pending",
      },
    ]

    // Add tasks to queue
    this.taskQueue.push(...tasks)

    // Process tasks in parallel with priority
    const results = await this.processTasks()

    return {
      success: results.every((r) => r.success),
      data: {
        folderAnalysis: results[0]?.data,
        validation: results[1]?.data,
        extraction: results[2]?.data,
      },
      confidence: results.reduce((acc, r) => acc + r.confidence, 0) / results.length,
      processingTime: results.reduce((acc, r) => acc + r.processingTime, 0),
    }
  }

  private async processTasks(): Promise<AgentResult[]> {
    const highPriorityTasks = this.taskQueue.filter((t) => t.priority === "high")
    const mediumPriorityTasks = this.taskQueue.filter((t) => t.priority === "medium")
    const lowPriorityTasks = this.taskQueue.filter((t) => t.priority === "low")

    const results: AgentResult[] = []

    // Process high priority tasks first
    for (const task of highPriorityTasks) {
      const result = await this.executeTask(task)
      results.push(result)
    }

    // Process medium and low priority in parallel
    const remainingTasks = [...mediumPriorityTasks, ...lowPriorityTasks]
    const remainingResults = await Promise.all(remainingTasks.map((task) => this.executeTask(task)))

    results.push(...remainingResults)
    return results
  }

  private async executeTask(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now()
    task.status = "processing"

    try {
      let result: AgentResult

      switch (task.type) {
        case "organize":
          result = await this.agents.folder.processFolder(task.data)
          break
        case "validate":
          result = await this.agents.validation.validateStructure(task.data)
          break
        case "extract":
          result = await this.agents.extraction.extractData(task.data)
          break
        case "classify":
          result = await this.agents.document.classifyDocument(task.data)
          break
        default:
          throw new Error(`Unknown task type: ${task.type}`)
      }

      task.status = "completed"
      task.result = result

      return {
        ...result,
        processingTime: Date.now() - startTime,
      }
    } catch (error) {
      task.status = "failed"
      task.error = error instanceof Error ? error.message : "Unknown error"

      return {
        success: false,
        error: task.error,
        confidence: 0,
        processingTime: Date.now() - startTime,
      }
    }
  }

  getTaskStatus(): { pending: number; processing: number; completed: number; failed: number } {
    return {
      pending: this.taskQueue.filter((t) => t.status === "pending").length,
      processing: this.taskQueue.filter((t) => t.status === "processing").length,
      completed: this.taskQueue.filter((t) => t.status === "completed").length,
      failed: this.taskQueue.filter((t) => t.status === "failed").length,
    }
  }
}
