
import path from 'path';
import fs from 'fs/promises';

import { OpenAPIV3 } from 'openapi-types';




const generateZodForBooleanSchema= (schemaId:string,schema:OpenAPIV3.NonArraySchemaObject):string=>{

  return`
  import * as z from 'zod'

  export const ${schemaId}=z.boolean()
  `.trim();
}


const generateZodForNumberSchema= (schemaId:string,schema:OpenAPIV3.NonArraySchemaObject):string=>{

  return`
  import * as z from 'zod'

  export const ${schemaId}=z.number()
  `.trim();
}


const generateZodForStringSchema= (schemaId:string,schema:OpenAPIV3.NonArraySchemaObject):string=>{

  const type =schema.type ?? {};

  return `
  import * as z from 'zod';

  export const ${schemaId}=z.string()
  `.trim();
}


const generateZodForIntegerSchema= (schemaId:string,schema:OpenAPIV3.NonArraySchemaObject):string=>{

  return`
  import * as z from 'zod'

  export const ${schemaId}=z.number()
  `.trim();
}


const generateZodForObjectSchema = (schemaId: string, schema: OpenAPIV3.NonArraySchemaObject): string => {
  const properties = schema.properties ?? {};
  
  //FEW generatedprops are also objects and arrays: FIXME
  const generatedProps: Array<string> = [];
  for (const [propertyName, property] of Object.entries(properties)) {

               if('$ref'in property){
                // handle later
               }
               else{
                if(property.type==='integer'){property.type='number'}
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



const generateZodForSchema = (schemaId: string, schema: OpenAPIV3.SchemaObject): string => {
  if ('items' in schema) {
    // Case: ArraySchemaObject
    throw new Error('Missing type');
    //const type:undefined| OpenAPIV3.ArraySchemaObject=schema.type;
   // if(typeof type=== undefined){throw new Error('Missing type');}

   /*else{

        return generateZodForArraySchema(schemaId,schema);
    }*/
    
  } else {
    // Case: NonArraySchemaObject
    const type: undefined | OpenAPIV3.NonArraySchemaObjectType = schema.type;
    
    if (typeof type === 'undefined') { throw new Error(`Missing 'type'`); }
    
    switch (type) {
      case 'boolean': return generateZodForBooleanSchema(schemaId,schema);
      case 'number':  return generateZodForNumberSchema(schemaId,schema);
      case 'string':return generateZodForStringSchema(schemaId,schema);
      case 'integer': return generateZodForIntegerSchema(schemaId,schema);
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
        //FIXME FIXME FIXME FIXME FIXME FIXME FIXME
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
