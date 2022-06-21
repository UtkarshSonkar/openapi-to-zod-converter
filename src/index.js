"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const generateZodForObjectSchema = (schemaId, schema) => {
    const properties = schema.properties ?? {};
    const generatedProps = [];
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
const generateZodForSchema = (schemaId, schema) => {
    if ('items' in schema) {
        // Case: ArraySchemaObject
        throw new Error('Not supported');
    }
    else {
        // Case: NonArraySchemaObject
        const type = schema.type;
        if (typeof type === 'undefined') {
            throw new Error(`Missing 'type'`);
        }
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
    const documentContent = await promises_1.default.readFile(path_1.default.join(__dirname, '../resources/roche_api.json'), 'utf8');
    const document = JSON.parse(documentContent);
    //console.log(document.components.schemas.KeyObject);
    console.info('Converting...');
    const schemas = document.components?.schemas ?? {};
    for (const [schemaId, schema] of Object.entries(schemas)) {
        try {
            if ('$ref' in schema) {
                // Case: OpenAPIV3.ReferenceObject
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
