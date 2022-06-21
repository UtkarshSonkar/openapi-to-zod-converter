
import path from 'path';
import fs from 'fs/promises';

import { OpenAPIV3 } from 'openapi-types';


const generateZodForObjectSchema = (schemaId: string, schema: OpenAPIV3.NonArraySchemaObject): string => {
  const properties = schema.properties ?? {};
  
  const generatedProps: Array<string> = [];
  for (const [propertyName, property] of Object.entries(properties)) {
    generatedProps.push(`${propertyName}: undefined,`);
  }
  
  return `
import * as z from 'zod';

export const ${schemaId} = z.object({
  ${generatedProps.join('\n')}
});
  `.trim();
};

const generateZodForSchema = (schemaId: string, schema: OpenAPIV3.SchemaObject): string => {
  if ('items' in schema) {
    // Case: ArraySchemaObject
    throw new Error('Not supported');
  } else {
    // Case: NonArraySchemaObject
    const type: undefined | OpenAPIV3.NonArraySchemaObjectType = schema.type;
    
    if (typeof type === 'undefined') { throw new Error(`Missing 'type'`); }
    
    switch (type) {
      case 'boolean': throw new Error(`Not yet supported`);
      case 'number': throw new Error(`Not yet supported`);
      case 'string': throw new Error(`Not yet supported`);
      case 'integer': throw new Error(`Not yet supported`);
      case 'object': return generateZodForObjectSchema(schemaId, schema);
    }
  }
};

const main = async () => {
  const documentContent = await fs.readFile(path.join(__dirname, '../resources/roche_api.json'), 'utf8');
  const document: OpenAPIV3.Document = JSON.parse(documentContent);
  //console.log(document.components.schemas.KeyObject);
  
  console.info('Converting...');
  
  const schemas = document.components?.schemas ?? {};
  for (const [schemaId, schema] of Object.entries(schemas)) {
    try {
      if ('$ref' in schema) {
        // Case: OpenAPIV3.ReferenceObject
        throw new Error(`Not implemented`);
      } else {
        // Case: OpenAPIV3.SchemaObject
        const generatedCode = generateZodForSchema(schemaId, schema);
        await fs.writeFile(path.join(__dirname, `../generated/${schemaId}.ts`), generatedCode);
      }
    } catch (e) {
      // Ignore (for now)
    }
  }
  
  console.info('Done!');
};

main();
