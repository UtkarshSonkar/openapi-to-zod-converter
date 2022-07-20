import path from "path";
import fs from "fs/promises";

import { OpenAPIV3 } from "openapi-types";

/*const generateZodForObjectSchema = (schemaId: string, schema: OpenAPIV3.NonArraySchemaObject): string => {
  const properties = schema.properties ?? {};
  
  const generatedProps: Array<string> = [];
  const refs: Array<string> = [];
  for (const [propertyName, property] of Object.entries(properties)) {
    let generatedProp;
    if ('$ref' in property) {
      // RefObject
      generatedProp = generateZodForReferenceObject(property);
    } else {
      // SchemaObject
      generatedProp = generateZodForSchema(property);
    }
    generatedProps.push(`${propertyName}: ${generatedProp.code},`);
    refs.concat(generatedProp.refs); // Add the refs for this prop
  }
  
  const code: string = `z.object({
  ${generatedProps.join('\n')}
})
  `.trim();
  
  return { code, refs };
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
};*/

const generateZodModule = (
  schemaId: string,
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): string => {
  // Branches...
  // if ('$ref' in schema) { ... } else { ... }

  const code = undefined;
  const refs = [];

  if ("$ref" in schema) {
    console.log(schemaId);
  } else {
  }

  return `
import * as z from 'zod';
${refs.map((ref) => `import ${ref}`)}

export const ${schemaId} = ${code};
  `.trim();
};

const main = async () => {
  const documentContent = await fs.readFile(
    path.join(__dirname, "../resources/roche_api.json"),
    "utf8"
  );
  const document: OpenAPIV3.Document = JSON.parse(documentContent);
  //console.log(document.components.schemas.KeyObject);

  console.info("Converting...");

  const schemas = document.components?.schemas ?? {};
  for (const [schemaId, schema] of Object.entries(schemas)) {
    try {
      const generatedCode = generateZodModule(schemaId, schema);
      await fs.writeFile(
        path.join(__dirname, `../generated/${schemaId}.ts`),
        generatedCode
      );
    } catch (e) {
      // Ignore (for now)
    }
  }

  console.info("Done!");
};

main();
