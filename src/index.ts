
const path = require('path');
const fs = require('fs/promises');

//const SwaggerParser = require('@apidevtools/swagger-parser');


const generateZodForSchema = (schemaId: string, schema: any): string => {
  return `
import * as z from 'zod';

export const ${schemaId} = ...
  `.trim();
};

const main = async () => {
  // const parser = new SwaggerParser();
  // const api = await SwaggerParser.validate(path.join(__dirname, '../resources/roche_api.json'));
  // console.log(api.components.schemas.KeyObject);
  
  const document = JSON.parse(await fs.readFile(path.join(__dirname, '../resources/roche_api.json'), 'utf8'));
  //console.log(document.components.schemas.KeyObject);
  
  console.info('Converting...');
  
  for (const [schemaId, schema] of Object.entries(document.components.schemas)) {
    const generatedCode = generateZodForSchema(schemaId, schema);
    //console.log(generatedCode); // Debug
    await fs.writeFile(path.join(__dirname, `../generated/${schemaId}.ts`), generatedCode);
  }
  
  console.info('Done!');
};

main();
