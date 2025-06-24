#!/usr/bin/env node

/**
 * ⚙️ MODULE AGENT - LOGIQUE MÉTIER
 * 
 * Spécialisation: APIs, Business Logic, Intégrations
 * Responsabilités: Endpoints, services, logique métier, intégrations AI
 */

import { BaseAgent } from '../lib/base-agent.js';
import chalk from 'chalk';

class ModuleAgent extends BaseAgent {
  constructor() {
    super({
      id: 'module-agent',
      name: 'Module Agent',
      specialization: 'Logique métier',
      color: 'yellow',
      capabilities: [
        'typescript',
        'api-endpoints',
        'business-logic',
        'ai-integration',
        'external-apis',
        'caching',
        'validation',
        'authentication',
        'rate-limiting',
        'error-handling'
      ],
      dependencies: ['db-agent'], // Besoin des types DB
      outputPaths: {
        api: 'apps/web/app/api/',
        services: 'apps/web/lib/services/',
        types: 'apps/web/lib/types/',
        utils: 'apps/web/lib/utils/',
        middleware: 'apps/web/lib/middleware/',
        validations: 'apps/web/lib/validations/'
      }
    });

    this.aiProviders = {
      openai: { status: 'available', models: ['gpt-4', 'gpt-3.5-turbo'] },
      anthropic: { status: 'available', models: ['claude-3-sonnet', 'claude-3-haiku'] },
      ollama: { status: 'available', models: ['llama3.2', 'mistral'] }
    };

    this.apiEndpoints = new Map();
    this.businessRules = new Map();
    this.integrations = new Map();
  }

  /**
   * 🎯 TRAITEMENT DES TÂCHES MODULE
   */
  async processTask(task) {
    this.log(`⚙️ Traitement tâche Module: ${task.description}`);

    try {
      switch (task.type) {
        case 'api-endpoint':
          return await this.createAPIEndpoint(task);
        case 'business-logic':
          return await this.createBusinessLogic(task);
        case 'ai-integration':
          return await this.createAIIntegration(task);
        case 'external-api':
          return await this.createExternalAPI(task);
        case 'validation':
          return await this.createValidation(task);
        case 'middleware':
          return await this.createMiddleware(task);
        case 'service':
          return await this.createService(task);
        case 'utility':
          return await this.createUtility(task);
        default:
          throw new Error(`Type de tâche Module non supporté: ${task.type}`);
      }
    } catch (error) {
      this.logError(`Erreur traitement tâche ${task.id}:`, error);
      throw error;
    }
  }

  /**
   * 🛠️ CRÉATION D'ENDPOINT API
   */
  async createAPIEndpoint(task) {
    const { endpointName, method, path, schema, authentication, rateLimit } = task.spec;
    
    this.log(`🛠️ Création endpoint: ${method} ${path}`);

    // Générer le code de l'endpoint
    const endpointCode = this.generateEndpointCode(endpointName, method, path, schema, authentication);
    
    // Générer les types TypeScript
    const typesCode = this.generateEndpointTypes(endpointName, schema);
    
    // Générer les validations
    const validationCode = this.generateValidationSchema(endpointName, schema);
    
    // Générer la documentation API
    const docsCode = this.generateAPIDocumentation(endpointName, method, path, schema);

    const files = [
      {
        path: `${this.config.outputPaths.api}${path}/route.ts`,
        content: endpointCode
      },
      {
        path: `${this.config.outputPaths.types}${endpointName}.ts`,
        content: typesCode
      },
      {
        path: `${this.config.outputPaths.validations}${endpointName}.ts`,
        content: validationCode
      },
      {
        path: `docs/api/${endpointName}.md`,
        content: docsCode
      }
    ];

    // Enregistrer l'endpoint
    this.apiEndpoints.set(endpointName, {
      method,
      path,
      schema,
      authentication,
      rateLimit,
      createdAt: new Date()
    });

    return {
      success: true,
      files,
      endpoint: endpointName,
      method,
      path,
      documentation: `Endpoint ${method} ${path} créé avec validation et documentation`
    };
  }

  /**
   * 🧠 CRÉATION DE LOGIQUE MÉTIER
   */
  async createBusinessLogic(task) {
    const { serviceName, domain, operations, rules } = task.spec;
    
    this.log(`🧠 Création logique métier: ${serviceName}`);

    const serviceCode = this.generateServiceCode(serviceName, domain, operations, rules);
    const typesCode = this.generateServiceTypes(serviceName, operations);
    const testCode = this.generateServiceTests(serviceName, operations);

    const files = [
      {
        path: `${this.config.outputPaths.services}${serviceName}Service.ts`,
        content: serviceCode
      },
      {
        path: `${this.config.outputPaths.types}${serviceName}.ts`,
        content: typesCode
      },
      {
        path: `tests/services/${serviceName}Service.test.ts`,
        content: testCode
      }
    ];

    // Enregistrer les règles métier
    this.businessRules.set(serviceName, {
      domain,
      operations,
      rules,
      createdAt: new Date()
    });

    return {
      success: true,
      files,
      service: serviceName,
      operations: operations.map(op => op.name),
      documentation: `Service ${serviceName} créé avec ${operations.length} opérations`
    };
  }

  /**
   * 🤖 INTÉGRATION AI
   */
  async createAIIntegration(task) {
    const { integrationName, provider, model, prompt, context } = task.spec;
    
    this.log(`🤖 Création intégration AI: ${integrationName} (${provider})`);

    const integrationCode = this.generateAIIntegrationCode(integrationName, provider, model, prompt, context);
    const typesCode = this.generateAITypes(integrationName, provider);
    const configCode = this.generateAIConfig(integrationName, provider, model);

    const files = [
      {
        path: `${this.config.outputPaths.services}ai/${integrationName}AI.ts`,
        content: integrationCode
      },
      {
        path: `${this.config.outputPaths.types}ai/${integrationName}.ts`,
        content: typesCode
      },
      {
        path: `${this.config.outputPaths.utils}ai-config.ts`,
        content: configCode,
        append: true
      }
    ];

    // Enregistrer l'intégration
    this.integrations.set(integrationName, {
      provider,
      model,
      prompt,
      context,
      createdAt: new Date()
    });

    return {
      success: true,
      files,
      integration: integrationName,
      provider,
      model,
      documentation: `Intégration AI ${integrationName} créée avec ${provider}/${model}`
    };
  }

  /**
   * 🌐 API EXTERNE
   */
  async createExternalAPI(task) {
    const { serviceName, baseUrl, endpoints, authentication, retryConfig } = task.spec;
    
    this.log(`🌐 Création client API externe: ${serviceName}`);

    const clientCode = this.generateExternalAPIClient(serviceName, baseUrl, endpoints, authentication, retryConfig);
    const typesCode = this.generateExternalAPITypes(serviceName, endpoints);
    const testCode = this.generateExternalAPITests(serviceName, endpoints);

    const files = [
      {
        path: `${this.config.outputPaths.services}external/${serviceName}Client.ts`,
        content: clientCode
      },
      {
        path: `${this.config.outputPaths.types}external/${serviceName}.ts`,
        content: typesCode
      },
      {
        path: `tests/services/external/${serviceName}Client.test.ts`,
        content: testCode
      }
    ];

    return {
      success: true,
      files,
      client: serviceName,
      endpoints: endpoints.length,
      documentation: `Client API externe ${serviceName} créé avec ${endpoints.length} endpoints`
    };
  }

  /**
   * ✅ VALIDATION
   */
  async createValidation(task) {
    const { validationName, schema, customRules } = task.spec;
    
    this.log(`✅ Création validation: ${validationName}`);

    const validationCode = this.generateValidationCode(validationName, schema, customRules);
    const typesCode = this.generateValidationTypes(validationName, schema);

    const files = [
      {
        path: `${this.config.outputPaths.validations}${validationName}.ts`,
        content: validationCode
      },
      {
        path: `${this.config.outputPaths.types}validations/${validationName}.ts`,
        content: typesCode
      }
    ];

    return {
      success: true,
      files,
      validation: validationName,
      documentation: `Validation ${validationName} créée avec Zod`
    };
  }

  /**
   * 🔒 MIDDLEWARE
   */
  async createMiddleware(task) {
    const { middlewareName, type, options } = task.spec;
    
    this.log(`🔒 Création middleware: ${middlewareName}`);

    const middlewareCode = this.generateMiddlewareCode(middlewareName, type, options);
    const testCode = this.generateMiddlewareTests(middlewareName, type);

    const files = [
      {
        path: `${this.config.outputPaths.middleware}${middlewareName}.ts`,
        content: middlewareCode
      },
      {
        path: `tests/middleware/${middlewareName}.test.ts`,
        content: testCode
      }
    ];

    return {
      success: true,
      files,
      middleware: middlewareName,
      type,
      documentation: `Middleware ${middlewareName} créé pour ${type}`
    };
  }

  /**
   * 🏗️ GÉNÉRATEURS DE CODE
   */
  generateEndpointCode(name, method, path, schema, authentication) {
    return `import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ${name}Schema } from '@/lib/validations/${name}';
${authentication ? "import { authenticateRequest } from '@/lib/middleware/auth';" : ''}

${method.toUpperCase() === 'GET' ? 'export async function GET' : `export async function ${method.toUpperCase()}`}(
  request: NextRequest
) {
  try {
    ${authentication ? `
    // Vérification d'authentification
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    ` : ''}

    ${method.toUpperCase() === 'GET' ? `
    // Validation des paramètres de requête
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    // Validation avec Zod
    const validatedParams = ${name}Schema.parse(params);
    ` : `
    // Validation du body
    const body = await request.json();
    const validatedData = ${name}Schema.parse(body);
    `}

    // Logique métier
    const result = await process${name}(${method.toUpperCase() === 'GET' ? 'validatedParams' : 'validatedData'});

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erreur ${name}:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function process${name}(data: z.infer<typeof ${name}Schema>) {
  // TODO: Implémenter la logique métier
  return { success: true, data };
}
`;
  }

  generateServiceCode(name, domain, operations, rules) {
    return `/**
 * Service ${name} - Logique métier pour ${domain}
 */

import { z } from 'zod';
import { ${name}Types } from '@/lib/types/${name}';

export class ${name}Service {
  constructor() {
    // Initialisation du service
  }

  ${operations.map(op => `
  /**
   * ${op.description}
   */
  async ${op.name}(${op.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}) {
    // Validation des règles métier
    ${rules.map(rule => `
    if (${rule.condition}) {
      throw new Error('${rule.message}');
    }`).join('')}

    // Logique métier
    try {
      // TODO: Implémenter ${op.name}
      return { success: true };
    } catch (error) {
      throw new Error(\`Erreur dans ${op.name}: \${error.message}\`);
    }
  }`).join('\n')}
}

export const ${name.toLowerCase()}Service = new ${name}Service();
`;
  }

  generateAIIntegrationCode(name, provider, model, prompt, context) {
    return `/**
 * Intégration AI ${name} avec ${provider}
 */

import { ${provider === 'openai' ? 'OpenAI' : provider === 'anthropic' ? 'Anthropic' : 'Ollama'} } from '@/lib/ai-providers';
import { ${name}AITypes } from '@/lib/types/ai/${name}';

export class ${name}AI {
  private client: ${provider === 'openai' ? 'OpenAI' : provider === 'anthropic' ? 'Anthropic' : 'Ollama'};

  constructor() {
    this.client = new ${provider === 'openai' ? 'OpenAI' : provider === 'anthropic' ? 'Anthropic' : 'Ollama'}({
      apiKey: process.env.${provider.toUpperCase()}_API_KEY,
      ${provider === 'ollama' ? 'baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434"' : ''}
    });
  }

  async generate${name}(input: ${name}AITypes.Input): Promise<${name}AITypes.Output> {
    try {
      const systemPrompt = \`${prompt.system}\`;
      const userPrompt = \`${prompt.user}\`;

      const response = await this.client.${provider === 'openai' ? 'chat.completions.create' : 'messages.create'}({
        model: '${model}',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        ${provider === 'openai' ? 'max_tokens: 1000' : 'max_tokens: 1000'}
      });

      return {
        success: true,
        result: response.${provider === 'openai' ? 'choices[0].message.content' : 'content[0].text'},
        usage: response.usage,
        model: '${model}'
      };

    } catch (error) {
      console.error('Erreur AI ${name}:', error);
      throw new Error(\`Erreur génération AI: \${error.message}\`);
    }
  }

  async generateBatch(inputs: ${name}AITypes.Input[]): Promise<${name}AITypes.Output[]> {
    const results = await Promise.allSettled(
      inputs.map(input => this.generate${name}(input))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: result.reason.message,
          input: inputs[index]
        };
      }
    });
  }
}

export const ${name.toLowerCase()}AI = new ${name}AI();
`;
  }

  generateValidationCode(name, schema, customRules) {
    return `import { z } from 'zod';

export const ${name}Schema = z.object({
  ${schema.fields.map(field => `
  ${field.name}: z.${field.type}()${field.optional ? '.optional()' : ''}${field.validation ? `.${field.validation}` : ''}${field.message ? `.describe('${field.message}')` : ''}`).join(',\n  ')}
});

export type ${name}Data = z.infer<typeof ${name}Schema>;

${customRules ? `
// Règles de validation personnalisées
export const validate${name} = (data: ${name}Data) => {
  ${customRules.map(rule => `
  if (${rule.condition}) {
    throw new Error('${rule.message}');
  }`).join('')}
  
  return true;
};
` : ''}
`;
  }

  generateExternalAPIClient(name, baseUrl, endpoints, authentication, retryConfig) {
    return `/**
 * Client API externe pour ${name}
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ${name}Types } from '@/lib/types/external/${name}';

export class ${name}Client {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '${baseUrl}',
      timeout: 10000,
      ${authentication ? `
      headers: {
        'Authorization': \`Bearer \${process.env.${name.toUpperCase()}_API_KEY}\`,
        'Content-Type': 'application/json'
      }` : ''}
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Retry logic
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status >= 500) {
          // Retry pour les erreurs serveur
          return this.retryRequest(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  private async retryRequest(config: AxiosRequestConfig, attempt = 1): Promise<any> {
    const maxRetries = ${retryConfig?.maxRetries || 3};
    
    if (attempt > maxRetries) {
      throw new Error(\`Max retries exceeded for \${config.url}\`);
    }

    await new Promise(resolve => setTimeout(resolve, ${retryConfig?.delay || 1000} * attempt));
    
    try {
      return await this.client(config);
    } catch (error) {
      return this.retryRequest(config, attempt + 1);
    }
  }

  ${endpoints.map(endpoint => `
  /**
   * ${endpoint.description}
   */
  async ${endpoint.name}(${endpoint.parameters ? endpoint.parameters.map(p => `${p.name}: ${p.type}`).join(', ') : ''}): Promise<${name}Types.${endpoint.responseType}> {
    try {
      const response = await this.client.${endpoint.method.toLowerCase()}(
        '${endpoint.path}'${endpoint.method !== 'GET' ? ', data' : ''}
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur ${endpoint.name}:', error);
      throw new Error(\`Erreur API ${name}: \${error.message}\`);
    }
  }`).join('\n')}
}

export const ${name.toLowerCase()}Client = new ${name}Client();
`;
  }

  generateMiddlewareCode(name, type, options) {
    return `import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware ${name} - ${type}
 */
export async function ${name}(request: NextRequest) {
  try {
    ${type === 'auth' ? `
    // Vérification d'authentification
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 401 });
    }

    // Validation du token
    const isValid = await validateToken(token);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    ` : type === 'rate-limit' ? `
    // Rate limiting
    const ip = request.ip || 'unknown';
    const isAllowed = await checkRateLimit(ip, ${options?.requestsPerMinute || 60});
    
    if (!isAllowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    ` : type === 'cors' ? `
    // CORS headers
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '${options?.origin || '*'}');
    response.headers.set('Access-Control-Allow-Methods', '${options?.methods || 'GET,POST,PUT,DELETE'}');
    response.headers.set('Access-Control-Allow-Headers', '${options?.headers || 'Content-Type,Authorization'}');
    
    return response;
    ` : `
    // Middleware personnalisé
    console.log('Middleware ${name} activé');
    `}

    return NextResponse.next();

  } catch (error) {
    console.error('Erreur middleware ${name}:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

${type === 'auth' ? `
async function validateToken(token: string): Promise<boolean> {
  // TODO: Implémenter la validation du token
  return true;
}
` : type === 'rate-limit' ? `
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

async function checkRateLimit(ip: string, limit: number): Promise<boolean> {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}
` : ''}
`;
  }

  // Générateurs de types et tests (méthodes simplifiées)
  generateEndpointTypes(name, schema) {
    return `export interface ${name}Request {
  // Types générés automatiquement
}

export interface ${name}Response {
  success: boolean;
  data?: any;
  error?: string;
}`;
  }

  generateServiceTypes(name, operations) {
    return `export namespace ${name}Types {
  ${operations.map(op => `
  export interface ${op.name}Input {
    ${op.parameters.map(p => `${p.name}: ${p.type};`).join('\n    ')}
  }
  
  export interface ${op.name}Output {
    success: boolean;
    data?: any;
    error?: string;
  }`).join('\n')}
}`;
  }

  generateServiceTests(name, operations) {
    return `import { ${name}Service } from '../${name}Service';

describe('${name}Service', () => {
  let service: ${name}Service;

  beforeEach(() => {
    service = new ${name}Service();
  });

  ${operations.map(op => `
  describe('${op.name}', () => {
    it('should execute successfully', async () => {
      // TODO: Implémenter le test
      expect(true).toBe(true);
    });
  });`).join('\n')}
});`;
  }

  generateAITypes(name, provider) {
    return `export namespace ${name}AITypes {
  export interface Input {
    context: string;
    parameters?: Record<string, any>;
  }

  export interface Output {
    success: boolean;
    result?: string;
    error?: string;
    usage?: any;
    model?: string;
  }
}`;
  }

  generateValidationTypes(name, schema) {
    return `import { z } from 'zod';
import { ${name}Schema } from '@/lib/validations/${name}';

export type ${name}Data = z.infer<typeof ${name}Schema>;
export type ${name}Errors = z.ZodError<${name}Data>;`;
  }

  generateExternalAPITypes(name, endpoints) {
    return `export namespace ${name}Types {
  ${endpoints.map(endpoint => `
  export interface ${endpoint.responseType} {
    // TODO: Définir les types de réponse
  }`).join('\n')}
}`;
  }

  generateExternalAPITests(name, endpoints) {
    return `import { ${name}Client } from '../${name}Client';

describe('${name}Client', () => {
  let client: ${name}Client;

  beforeEach(() => {
    client = new ${name}Client();
  });

  ${endpoints.map(endpoint => `
  describe('${endpoint.name}', () => {
    it('should call API successfully', async () => {
      // TODO: Implémenter le test
      expect(true).toBe(true);
    });
  });`).join('\n')}
});`;
  }

  generateMiddlewareTests(name, type) {
    return `import { NextRequest } from 'next/server';
import { ${name} } from '../${name}';

describe('${name} middleware', () => {
  it('should process request correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/test');
    const response = await ${name}(request);
    
    expect(response).toBeDefined();
  });
});`;
  }

  generateAPIDocumentation(name, method, path, schema) {
    return `# ${name} API

## Endpoint
\`${method.toUpperCase()} ${path}\`

## Description
${schema.description || 'Endpoint généré automatiquement'}

## Paramètres
${schema.fields.map(field => `- **${field.name}** (${field.type}): ${field.description || 'Paramètre généré'}`).join('\n')}

## Réponse
\`\`\`json
{
  "success": true,
  "data": {}
}
\`\`\`

## Erreurs
- \`400\`: Erreur de validation
- \`401\`: Non autorisé
- \`500\`: Erreur serveur
`;
  }
}

export { ModuleAgent };

// Usage CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new ModuleAgent();
  
  const exampleTask = {
    id: 'api-recipes-endpoint',
    type: 'api-endpoint',
    description: 'Créer l\'endpoint API pour les recettes',
    spec: {
      endpointName: 'recipes',
      method: 'GET',
      path: '/recipes',
      schema: {
        fields: [
          { name: 'search', type: 'string', optional: true },
          { name: 'category', type: 'string', optional: true },
          { name: 'limit', type: 'number', optional: true }
        ]
      },
      authentication: true,
      rateLimit: { requestsPerMinute: 100 }
    }
  };

  agent.processTask(exampleTask)
    .then(result => {
      console.log('✅ Endpoint créé:', result);
    })
    .catch(error => {
      console.error('❌ Erreur:', error);
    });
}