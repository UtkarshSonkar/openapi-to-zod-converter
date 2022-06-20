"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const generateZodForSchema = (schemaId, schema) => {
    return `
import * as z from 'zod';

export const ${schemaId} = ...
  `.trim();
};
const main = async () => {
    // const parser = new SwaggerParser();
    // const api = await SwaggerParser.validate(path.join(__dirname, '../resources/roche_api.json'));
    // console.log(api.components.schemas.KeyObject);
    const documentContent = await promises_1.default.readFile(path_1.default.join(__dirname, '../resources/roche_api.json'), 'utf8');
    const document = JSON.parse(documentContent);
    //console.log(document.components.schemas.KeyObject);
    console.info('Converting...');
    const schemas = document.components?.schemas ?? {};
    for (const [schemaId, schema] of Object.entries(schemas)) {
        if (!('$ref' in schema)) {
            const generatedCode = generateZodForSchema(schemaId, schema);
            //console.log(generatedCode); // Debug
            await promises_1.default.writeFile(path_1.default.join(__dirname, `../generated/${schemaId}.ts`), generatedCode);
        }
    }
    console.info('Done!');
};
main();
