import { writeFileSync } from 'fs';
import { join } from 'path';

import { ApiModule } from '@/api/api.module';
import { Environment } from '@/constants/app.constant';

import { ApolloDriverConfig } from '@nestjs/apollo';
import { FastifyReply, FastifyRequest } from 'fastify';
import { printSchema } from 'graphql';

/**
 * Configuration factory for Apollo Server (GraphQL)
 * Note: CORS is handled at the Fastify/NestJS level in main.ts
 */
export function useGraphqlFactory(): ApolloDriverConfig {
  const isDevelopment = [Environment.Development, Environment.Local].includes(
    process.env.NODE_ENV as Environment,
  );

  const config: ApolloDriverConfig = {
    // Schema generation and storage
    autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    sortSchema: true,
    // Development settings
    debug: isDevelopment,
    introspection: true, // Required for Apollo Sandbox
    playground: false, // Disable default playground in favor of Apollo Sandbox
    // Schema generation options
    definitions: {
      path: join(process.cwd(), 'src/generated/graphql.ts'),
      outputAs: 'class',
    },
    buildSchemaOptions: {
      numberScalarMode: 'integer',
    },
    // Schema transformation for development
    transformSchema: (schema) => {
      if (isDevelopment) {
        // Generate schema file for codegen and development reference
        writeFileSync(
          join(__dirname, '../../src/generated/schema.generated.gql'),
          printSchema(schema),
        );
      }
      return schema;
    },
    // Error formatting
    formatError: (error) => {
      // In production, remove stack traces from errors
      if (!isDevelopment && 'stacktrace' in error.extensions) {
        delete error.extensions.stacktrace;
      }
      return error;
    },
    // Module inclusion
    include: [ApiModule],
    // Context setup
    context: ({ req, res }: { req: FastifyRequest; res: FastifyReply }) => ({
      req,
      res,
    }),
  };

  return config;
}

export default useGraphqlFactory;
