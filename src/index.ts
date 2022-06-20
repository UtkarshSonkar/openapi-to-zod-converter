
import path from 'path';
import fs from 'fs/promises';

import { OpenAPIV3 } from 'openapi-types';
import SwaggerParser from '@apidevtools/swagger-parser';


const generateZodForSchema = (schemaId: string, schema: OpenAPIV3.SchemaObject): string => {
  return `
import * as z from 'zod';

export const ${schemaId} = ...
  `.trim();
};

const main = async () => {
  // const parser = new SwaggerParser();
  // const api = await SwaggerParser.validate(path.join(__dirname, '../resources/roche_api.json'));
  // console.log(api.components.schemas.KeyObject);
  
  const documentContent = await fs.readFile(path.join(__dirname, '../resources/roche_api.json'), 'utf8');
  const document: OpenAPIV3.Document = JSON.parse(documentContent);
  //console.log(document.components.schemas.KeyObject);
  
  console.info('Converting...');
  
  const schemas = document.components?.schemas ?? {};
  for (const [schemaId, schema] of Object.entries(schemas)) {
    if (!('$ref' in schema)) {
      const generatedCode = generateZodForSchema(schemaId, schema);
      //console.log(generatedCode); // Debug
      await fs.writeFile(path.join(__dirname, `../generated/${schemaId}.ts`), generatedCode);
    }
  }
  
  console.info('Done!');
};

main();
