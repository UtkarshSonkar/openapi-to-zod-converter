"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const generateZodForBooleanSchema = (schemaId, schema) => {
    return `
  import * as z from 'zod'

  export const ${schemaId}=z.boolean()
  `.trim();
};
const generateZodForNumberSchema = (schemaId, schema) => {
    return `
  import * as z from 'zod'

  export const ${schemaId}=z.number()
  `.trim();
};
const generateZodForStringSchema = (schemaId, schema) => {
    const type = schema.type ?? {};
    return `
  import * as z from 'zod';

  export const ${schemaId}=z.string()
  `.trim();
};
const generateZodForIntegerSchema = (schemaId, schema) => {
    return `
  import * as z from 'zod'

  export const ${schemaId}=z.number()
  `.trim();
};
const generateZodForObjectSchema = (schemaId, schema) => {
    const properties = schema.properties ?? {};
    //FEW generatedprops are also objects and arrays: FIXME
    const generatedProps = [];
    for (const [propertyName, property] of Object.entries(properties)) {
        if ('$ref' in property) {
            // handle later
        }
        else {
            if (property.type === 'integer') {
                property.type = 'number';
            }
            generatedProps.push(`${propertyName}: z.${property.type}(),`);
        }
    }
    return `
import * as z from 'zod';

export const ${schemaId} = z.object({
  ${generatedProps.join('\n')}
});
  `.trim();
};
/*const generateZodForArraySchema=(schemaId:string,schema:OpenAPIV3.ArraySchemaObject):string=>{


  //ArraySchemaObject has ArraySchemaObjectType and items contain ReferenceObject| schemaObject
  //handle it later
  return `
  import * as z from 'zod;

  export const ${schemaId}=z.array()
`.trim()

}*/
const generateZodForSchema = (schemaId, schema) => {
    if ('items' in schema) {
        // Case: ArraySchemaObject
        throw new Error('Missing type');
        //const type:undefined| OpenAPIV3.ArraySchemaObject=schema.type;
        // if(typeof type=== undefined){throw new Error('Missing type');}
        /*else{
     
             return generateZodForArraySchema(schemaId,schema);
         }*/
    }
    else {
        // Case: NonArraySchemaObject
        const type = schema.type;
        if (typeof type === 'undefined') {
            throw new Error(`Missing 'type'`);
        }
        switch (type) {
            case 'boolean': return generateZodForBooleanSchema(schemaId, schema);
            case 'number': return generateZodForNumberSchema(schemaId, schema);
            case 'string': return generateZodForStringSchema(schemaId, schema);
            case 'integer': return generateZodForIntegerSchema(schemaId, schema);
            case 'object': return generateZodForObjectSchema(schemaId, schema);
        }
    }
};
const main = async () => {
    const documentContent = await promises_1.default.readFile(path_1.default.join(__dirname, '../resources/roche_api.json'), 'utf8');
    const document = JSON.parse(documentContent);
    //console.log(document.components.schemas.KeyObject);
    console.info('Converting...');
    const schemas = document.components?.schemas ?? {};
    for (const [schemaId, schema] of Object.entries(schemas)) {
        try {
            if ('$ref' in schema) {
                // Case: OpenAPIV3.ReferenceObject
                //FIXME FIXME FIXME FIXME FIXME FIXME FIXME
                throw new Error(`Not implemented`);
            }
            else {
                // Case: OpenAPIV3.SchemaObject
                const generatedCode = generateZodForSchema(schemaId, schema);
                await promises_1.default.writeFile(path_1.default.join(__dirname, `../generated/${schemaId}.ts`), generatedCode);
            }
        }
        catch (e) {
            // Ignore (for now)
        }
    }
    console.info('Done!');
};
main();
