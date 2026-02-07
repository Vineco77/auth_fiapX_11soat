import { Client } from '@elastic/elasticsearch';
import * as dotenv from 'dotenv';

dotenv.config();

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
const ELASTICSEARCH_INDEX = process.env.ELASTICSEARCH_INDEX || 'auth-service-logs';
const ILM_POLICY_NAME = 'auth-service-ilm-policy';

const client = new Client({
  node: ELASTICSEARCH_URL,
});


async function checkElasticsearchHealth(): Promise<void> {
  console.log('Verificando conexão com Elasticsearch...');
  
  try {
    const health = await client.cluster.health({ timeout: '5s' });
    console.log(`Elasticsearch conectado (status: ${health.status})`);
  } catch (error) {
    console.error('Erro ao conectar com Elasticsearch:');
    console.error(error instanceof Error ? error.message : error);
    throw new Error('Elasticsearch não está acessível');
  }
}

async function createILMPolicy(): Promise<void> {
  console.log(`Criando ILM Policy: ${ILM_POLICY_NAME}...`);
  
  try {
    await client.ilm.putLifecycle({
      name: ILM_POLICY_NAME,
      policy: {
        phases: {
          hot: {
            min_age: '0ms',
            actions: {
              rollover: {
                max_age: '7d',
                max_size: '50gb',
              },
              set_priority: {
                priority: 100,
              },
            },
          },
          delete: {
            min_age: '7d',
            actions: {
              delete: {},
            },
          },
        },
      },
    } as any);
    
    console.log('ILM Policy criada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar ILM Policy:');
    console.error(error instanceof Error ? error.message : error);
    throw error;
  }
}


async function createIndexTemplate(): Promise<void> {
  console.log(`Criando Index Template para: ${ELASTICSEARCH_INDEX}...`);
  
  try {
    await client.indices.putIndexTemplate({
      name: `${ELASTICSEARCH_INDEX}-template`,
      index_patterns: [`${ELASTICSEARCH_INDEX}-*`],
      template: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          'index.lifecycle.name': ILM_POLICY_NAME,
          'index.lifecycle.rollover_alias': ELASTICSEARCH_INDEX,
        },
        mappings: {
          properties: {
            '@timestamp': { type: 'date' },
            level: { type: 'keyword' },
            message: { type: 'text' },
            traceId: { type: 'keyword' },
            context: { type: 'keyword' },
            service: { type: 'keyword' },
            environment: { type: 'keyword' },
            category: { type: 'keyword' },
            action: { type: 'keyword' },
            email: { type: 'keyword' },
            clientId: { type: 'keyword' },
            method: { type: 'keyword' },
            url: { type: 'text' },
            statusCode: { type: 'short' },
            responseTime: { type: 'integer' },
            error: {
              properties: {
                name: { type: 'keyword' },
                message: { type: 'text' },
                stack: { type: 'text' },
              },
            },
          },
        },
      },
    } as any);
    
    console.log('Index Template criado com sucesso!');
  } catch (error) {
    console.error('Erro ao criar Index Template:');
    console.error(error instanceof Error ? error.message : error);
    throw error;
  }
}

async function createInitialIndex(): Promise<void> {
  const initialIndex = `${ELASTICSEARCH_INDEX}-000001`;
  console.log(`Criando índice inicial: ${initialIndex}...`);
  
  try {
    const exists = await client.indices.exists({ index: initialIndex });
    
    if (exists) {
      console.log(`Índice ${initialIndex} já existe. Pulando criação.`);
      return;
    }
    
    await client.indices.create({
      index: initialIndex,
      aliases: {
        [ELASTICSEARCH_INDEX]: {
          is_write_index: true,
        },
      },
    } as any);
    
    console.log('Índice inicial criado com sucesso!');
  } catch (error) {
    console.error('Erro ao criar índice inicial:');
    console.error(error instanceof Error ? error.message : error);
    throw error;
  }
}

async function verifySetup(): Promise<void> {
  console.log('\n Verificando configuração...\n');
  
  try {
    const ilmPolicy = await client.ilm.getLifecycle({ name: ILM_POLICY_NAME });
    console.log(`ILM Policy encontrada: ${ILM_POLICY_NAME}`);
    
    const template = await client.indices.getIndexTemplate({ name: `${ELASTICSEARCH_INDEX}-template` });
    console.log(`Index Template encontrado: ${ELASTICSEARCH_INDEX}-template`);
    
    const indices = await client.cat.indices({ index: `${ELASTICSEARCH_INDEX}*`, format: 'json' });
    console.log(`Índices encontrados: ${(indices as any[]).length}`);
    
    console.log('\n Resumo da Configuração:');
    console.log(`   - ILM Policy: ${ILM_POLICY_NAME}`);
    console.log(`   - Retenção: 7 dias (hot) → delete`);
    console.log(`   - Index Pattern: ${ELASTICSEARCH_INDEX}-*`);
    console.log(`   - Write Alias: ${ELASTICSEARCH_INDEX}`);
    
  } catch (error) {
    console.error('Erro ao verificar configuração:');
    console.error(error instanceof Error ? error.message : error);
    throw error;
  }
}

async function main() {
  console.log('Elasticsearch Setup - ILM Policies\n');
  console.log(`Elasticsearch URL: ${ELASTICSEARCH_URL}`);
  console.log(`Index: ${ELASTICSEARCH_INDEX}\n`);
  
  try {
    await checkElasticsearchHealth();
    await createILMPolicy();
    await createIndexTemplate();
    await createInitialIndex();
    await verifySetup();
    
    console.log('\n Setup concluído com sucesso!');
    console.log('\n Próximos passos:');
    console.log('   1. Inicie a aplicação: npm run start:dev');
    console.log('   2. Acesse Kibana: http://localhost:5601');
    console.log('   3. Vá em Management → Stack Management → Index Lifecycle Policies');
    console.log(`   4. Veja os logs em Discover (index pattern: ${ELASTICSEARCH_INDEX}-*)`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n Setup falhou!');
    console.error(error);
    process.exit(1);
  }
}

main();
