import {END, MessagesAnnotation, START, StateGraph} from "@langchain/langgraph";
import {ChatOpenAI} from "@langchain/openai";
import {AIMessage, createAgent, HumanMessage, SystemMessage, tool} from "langchain";
import {BaseMessage} from "@langchain/core/messages";
import {z} from "zod";
import {LlmEngineModel} from "../models/llm_engine_model";
import {SubagentModel} from "../models/subagent_model";
import {SupervisorModel} from "../models/supervisor_model";
import {ToolModel} from "../models/tool_model";
import {SkillModel} from "../models/skill_model";
import {ThreadModel} from "../models/thread_model";
import {MessageRole} from "../models/message_model";
import {
  APIAgentRuntimeInitializeResponse,
  APIAgentRuntimeInvokeRequest,
  APIAgentRuntimeInvokeResponse,
  APIAgentRuntimeMessage,
} from "../types/api/agent_runtime_types";
import {SupervisorRepository} from "../repositories/supervisor.repository";
import {SubagentRepository} from "../repositories/subagent.repository";
import {APIMessageCreate} from "../types/api/message_types";
import {APIThreadConversationResponse} from "../types/api/thread_types";
import {ThreadRepository} from "../repositories/thread.repository";
import {MessageRepository} from "../repositories/message.repository";

type LangChainAgent = Awaited<ReturnType<typeof createAgent>>;

interface SubagentRuntime {
  summary: APIAgentRuntimeInitializeResponse;
  agent: LangChainAgent;
}

interface SupervisorGraphRuntime {
  invoke(input: {messages: BaseMessage[]}): Promise<{messages: BaseMessage[]}>;
}

export class AgentRuntimeService {

  static async initializeSupervisor(supervisorId: string): Promise<APIAgentRuntimeInitializeResponse | null> {
    const supervisor = await SupervisorRepository.findRuntimeById(supervisorId);

    if (!supervisor || !supervisor.llm_model) {
      return null;
    }

    return this.buildSupervisorRuntime(supervisor).summary;
  }

  static async initializeSubagent(subagentId: string): Promise<APIAgentRuntimeInitializeResponse | null> {
    const subagent = await SubagentRepository.findRuntimeById(subagentId);

    if (!subagent || !subagent.llm_model) {
      return null;
    }

    return this.buildSubagentRuntime(subagent).summary;
  }

  static async invokeThread(
    threadId: string,
    userId: string,
    payload: APIMessageCreate,
  ): Promise<APIThreadConversationResponse | null> {
    const thread = await ThreadRepository.findRuntimeByIdForUser(threadId, userId);

    if (!thread) {
      return null;
    }

    const persistedMessages = await MessageRepository.findAllByThread(thread.id);
    const history = persistedMessages.map((message) => this.toLangChainMessage(message.role, message.content));
    const userMessage = payload.content.trim();

    await MessageRepository.create(thread.id, MessageRole.USER, userMessage, payload.metadata);

    const result = thread.supervisor_id
      ? await this.invokeSupervisorWithHistory(thread.supervisor_id, [...history, new HumanMessage(userMessage)])
      : await this.invokeSubagentWithHistory(thread.subagent_id!, [...history, new HumanMessage(userMessage)]);

    if (!result) {
      return null;
    }

    await MessageRepository.create(thread.id, MessageRole.ASSISTANT, result.output);

    const conversation = await ThreadRepository.findByIdForUser(thread.id, userId);

    if (!conversation) {
      return null;
    }

    return {
      ...conversation,
      output: result.output,
    };
  }

  private static async invokeSupervisorWithHistory(
    supervisorId: string,
    messages: BaseMessage[],
  ): Promise<APIAgentRuntimeInvokeResponse | null> {
    const supervisor = await SupervisorRepository.findRuntimeById(supervisorId);

    if (!supervisor || !supervisor.llm_model) {
      return null;
    }

    const runtime = this.buildSupervisorRuntime(supervisor);
    const graphResult = await runtime.graph.invoke({messages});
    const apiMessages = this.toApiMessages(graphResult.messages);

    return {
      ...runtime.summary,
      messages: apiMessages,
      output: apiMessages[apiMessages.length - 1]?.content || '',
    };
  }

  private static async invokeSubagentWithHistory(
    subagentId: string,
    messages: BaseMessage[],
  ): Promise<APIAgentRuntimeInvokeResponse | null> {
    const subagent = await SubagentRepository.findRuntimeById(subagentId);

    if (!subagent || !subagent.llm_model) {
      return null;
    }

    const runtime = this.buildSubagentRuntime(subagent);
    const result = await runtime.agent.invoke({messages});
    const apiMessages = this.toApiMessages(result.messages);

    return {
      ...runtime.summary,
      messages: apiMessages,
      output: apiMessages[apiMessages.length - 1]?.content || '',
    };
  }

  private static buildSupervisorRuntime(supervisor: SupervisorModel): {
    summary: APIAgentRuntimeInitializeResponse;
    graph: SupervisorGraphRuntime;
  } {
    const enabledSubagents = (supervisor.subagents || []).filter((subagent) => subagent.enabled !== false);
    const subagentRuntimes = enabledSubagents.map((subagent) => this.buildSubagentRuntime(subagent));
    const subagentTools = subagentRuntimes.map((subagentRuntime) => {
      return tool(
        async ({input}) => {
          const result = await subagentRuntime.agent.invoke({
            messages: [new HumanMessage(input)],
          });

          return this.toApiMessages(result.messages).map((message) => message.content).join('\n');
        },
        {
          name: this.normalizeToolName(`delegate_to_${subagentRuntime.summary.name}`),
          description: `Delegate a task to the subagent "${subagentRuntime.summary.name}"`,
          schema: z.object({
            input: z.string().min(1).describe('Task that should be delegated to the subagent'),
          }),
        }
      );
    });

    const supervisorAgent = createAgent({
      model: this.createChatModel(supervisor.llm_model!),
      tools: subagentTools,
      systemPrompt: this.buildSupervisorPrompt(supervisor, subagentRuntimes.map((runtime) => runtime.summary)),
    });

    const graph = new StateGraph(MessagesAnnotation)
      .addNode('supervisor', async (state) => {
        const result = await supervisorAgent.invoke({
          messages: state.messages,
        });

        return {
          messages: result.messages.slice(state.messages.length),
        };
      })
      .addEdge(START, 'supervisor')
      .addEdge('supervisor', END)
      .compile();

    return {
      summary: {
        id: supervisor.id,
        type: 'supervisor',
        name: supervisor.name,
        llm_model: {
          id: supervisor.llm_model!.id,
          name: supervisor.llm_model!.name,
          model_name: supervisor.llm_model!.model_name,
          provider: supervisor.llm_model!.provider,
        },
        tools: [],
        skills: [],
        subagents: subagentRuntimes.map((runtime) => runtime.summary.name),
      },
      graph,
    };
  }

  private static buildSubagentRuntime(subagent: SubagentModel): SubagentRuntime {
    const enabledTools = (subagent.tools || []).filter((toolModel) => toolModel.enabled !== false);
    const enabledSkills = (subagent.skills || []).filter((skill) => skill.enabled !== false);
    const tools = enabledTools.map((toolModel) => this.buildTool(toolModel));
    const agent = createAgent({
      model: this.createChatModel(subagent.llm_model!),
      tools,
      systemPrompt: this.buildSubagentPrompt(subagent, enabledSkills),
    });

    return {
      summary: {
        id: subagent.id,
        type: 'subagent',
        name: subagent.name,
        llm_model: {
          id: subagent.llm_model!.id,
          name: subagent.llm_model!.name,
          model_name: subagent.llm_model!.model_name,
          provider: subagent.llm_model!.provider,
        },
        tools: enabledTools.map((toolModel) => toolModel.name),
        skills: enabledSkills.map((skill) => skill.name),
        subagents: [],
      },
      agent,
    };
  }

  private static createChatModel(llmEngine: LlmEngineModel): ChatOpenAI {
    if (!['openai', 'openai-compatible'].includes(llmEngine.provider)) {
      throw new Error(`Unsupported LLM provider: ${llmEngine.provider}`);
    }

    const config = llmEngine.config || {};
    const apiKeyEnvName = this.getStringConfig(config, 'api_key_env') || 'OPENAI_API_KEY';
    const apiKey = process.env[apiKeyEnvName];

    if (!apiKey) {
      throw new Error(`Missing API key environment variable: ${apiKeyEnvName}`);
    }

    return new ChatOpenAI({
      model: llmEngine.model_name,
      apiKey,
      temperature: this.getNumberConfig(config, 'temperature'),
      maxTokens: this.getNumberConfig(config, 'max_tokens'),
      configuration: llmEngine.api_base_url ? {
        baseURL: llmEngine.api_base_url,
      } : undefined,
    });
  }

  private static buildTool(toolModel: ToolModel) {
    const config = toolModel.config || {};

    switch (toolModel.type) {
      case 'echo':
        return tool(
          async ({input}) => input,
          {
            name: this.normalizeToolName(toolModel.name),
            description: toolModel.description || 'Echoes the provided input',
            schema: z.object({
              input: z.string().min(1).describe('Text that should be echoed back'),
            }),
          }
        );
      case 'static_response': {
        const response = this.getStringConfig(config, 'response');

        if (!response) {
          throw new Error(`Tool "${toolModel.name}" requires config.response`);
        }

        return tool(
          async () => response,
          {
            name: this.normalizeToolName(toolModel.name),
            description: toolModel.description || 'Returns a preconfigured static response',
            schema: z.object({
              input: z.string().optional().describe('Optional input for audit trail'),
            }),
          }
        );
      }
      case 'template': {
        const template = this.getStringConfig(config, 'template');

        if (!template) {
          throw new Error(`Tool "${toolModel.name}" requires config.template`);
        }

        return tool(
          async ({input}) => template.replace(/\{\{\s*input\s*\}\}/g, input),
          {
            name: this.normalizeToolName(toolModel.name),
            description: toolModel.description || 'Renders a configured template using the input',
            schema: z.object({
              input: z.string().min(1).describe('Input to interpolate into the template'),
            }),
          }
        );
      }
      default:
        throw new Error(`Unsupported tool type: ${toolModel.type}`);
    }
  }

  private static buildSubagentPrompt(subagent: SubagentModel, skills: SkillModel[]): string {
    const sections = [subagent.system_prompt.trim()];

    if (skills.length > 0) {
      sections.push(
        'Skills available for this subagent:',
        ...skills.map((skill) => `- ${skill.name}: ${skill.instructions}`)
      );
    }

    return sections.join('\n\n');
  }

  private static buildSupervisorPrompt(
    supervisor: SupervisorModel,
    subagents: APIAgentRuntimeInitializeResponse[],
  ): string {
    const sections = [supervisor.system_prompt.trim()];

    if (subagents.length > 0) {
      sections.push(
        'Subagents available for delegation:',
        ...subagents.map((subagent) => `- ${subagent.name}: ${subagent.llm_model.name}`)
      );
    }

    return sections.join('\n\n');
  }

  private static toApiMessages(messages: BaseMessage[]): APIAgentRuntimeMessage[] {
    return messages.map((message) => ({
      role: message.getType(),
      content: this.normalizeMessageContent(message.content),
    }));
  }

  private static normalizeMessageContent(content: BaseMessage['content']): string {
    if (typeof content === 'string') {
      return content;
    }

    return content.map((part) => {
      if (typeof part === 'string') {
        return part;
      }

      if ('text' in part && typeof part.text === 'string') {
        return part.text;
      }

      return JSON.stringify(part);
    }).join('\n');
  }

  private static normalizeToolName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private static getStringConfig(config: Record<string, unknown>, key: string): string | undefined {
    const value = config[key];

    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private static getNumberConfig(config: Record<string, unknown>, key: string): number | undefined {
    const value = config[key];

    return typeof value === 'number' ? value : undefined;
  }

  private static toLangChainMessage(role: MessageRole, content: string): BaseMessage {
    switch (role) {
      case MessageRole.USER:
        return new HumanMessage(content);
      case MessageRole.ASSISTANT:
        return new AIMessage(content);
      case MessageRole.SYSTEM:
        return new SystemMessage(content);
    }
  }
}
