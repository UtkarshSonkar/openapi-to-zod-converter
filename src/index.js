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
    const refs = [];
    let gcode;
    for (const [propertyName, property] of Object.entries(properties)) {
        let generatedProp = null;
        if ("$ref" in property) {
            const val = property.$ref.split("/");
            if (!refs.includes(val[3])) {
                refs.push(generateRefsForReferenceObject(refs, property));
            }
        }
        else {
            const type = property.type;
            switch (type) {
                case "string":
                    generatedProp = generateZodForStringSchema(propertyName, property);
                    break;
                case "integer":
                    generatedProp = generateZodForIntegerSchema(propertyName, property);
                    break;
                case "array":
                    throw new Error("type not found");
                // define this function
                case "boolean":
                    generatedProp = generateZodForBooleanSchema(propertyName, property);
                    break;
                case "object":
                    generatedProp = generateZodForObjectSchema(propertyName, property);
                    break;
            }
        }
        if (generatedProp !== null) {
            generatedProps.push(`${propertyName}: ${generatedProp.code}`);
            refs.concat(generatedProp.refs);
        }
    }
    const code = `z.object({
  ${generatedProps.join("\n")}
}),
  `.trim();
    // console.log(code)
    return { code, refs };
};
const generateZodForStringSchema = (schemaId, schema) => {
    const properties = schema.properties ?? {};
    const generatedProps = [];
    const refs = [];
    if ("enum" in schema) {
        schema.enum?.forEach((key, index) => {
            generatedProps.push(`'${key}',`);
        });
        // generatedProps.push(`z.enum('${}'),`)
    }
    const code = `z.string(${generatedProps.join("\n")}), //${schema.description}`.trim();
    return { code, refs };
};
const generateZodForIntegerSchema = (schemaId, schema) => {
    const properties = schema.properties ?? {};
    const generatedProps = [];
    const refs = [];
    if ("format" in schema && "description" in schema) {
        var detailscomment = `${schema.description}'  format is: ${schema.format};`;
    }
    else if ("description" in schema) {
        var detailscomment = `${schema.description}`;
    }
    else {
        var detailscomment = "";
    }
    const code = `z.number(${generatedProps.join("\n")}), //${detailscomment}`;
    return { code, refs };
};
// NO Schema or Property with NUMBER TYPE
const generateZodForBooleanSchema = (schemaId, schema) => {
    const properties = schema.properties ?? {};
    const generatedProps = [];
    const refs = [];
    if ("description" in schema) {
        var detailscomment = `${schema.description}`;
    }
    else {
        var detailscomment = "";
    }
    const code = `z.boolean(${generatedProps.join("\n")}),//${detailscomment}`;
    return { code, refs };
};
//const generateZodForEnumSchema=()
/*const ZodobjectProp=(property:OpenAPIV3.SchemaObject):Result{
      
  if(property.type==='object'){
    const output:string=()
  }



}*/
/*const generateZodForSchema=(property:OpenAPIV3.SchemaObject):Result=>{
       
  
  const types=property.type;
  const code:string;
  const refs:Array<string>=[];

  if(types=== 'string'){
    return{code,refs}
  }

  
  

 if(types==='string'&& property.description===undefined && property.enum===undefined && property.format===undefined){
 return  code=`z.string()`
 }
  else if(types==='string'&& property.description!== undefined && property.enum===undefined && property.format===undefined){
    return code=`z.string({
      description:${property.description}
    })`;
  }
  else if(types==='string'&& property.description!==undefined && property.enum!==undefined && property.format===undefined){
   return code=`z.string({
      description:${property.description}
      enum:${property.enum})`
  }
  else if(types==='string'&& property.description!==undefined && property.enum==undefined && property.format!==undefined){
   return code=`z.string({
      description:${property.description}
      format:${property.format}
    })`
  }
  break;

 // case 'array':
    if('$ref'in property.items){
        const ref=property.items.$ref.split('/');
        refs.push(ref[3]);

       return  code=`z.array(${ref[3]})`
    }
    else if(property.items!==undefined && property.items.type==='string'){
         return code=`z.array({
            type:z.string();
            description:${property.items.description};
          })`
    }
    break;


    return '';
 }*/
const generateRefsForReferenceObject = (refs = [], property) => {
    const val = property.$ref.split("/");
    // if(!refs.includes(val[3])){
    //   refs.push(val[3]);
    // }
    return `${val[3]}`;
};
const generateZodModule = (schemaId, schema) => {
    // Branches...
    let Zodcode = "";
    let refs = [];
    if ("$ref" in schema) {
        //No schema of this type in roche-openapi
    }
    else {
        // schemaobject are of 2 types
        // console.log(schemaId+'  ='+schema.type)
        if ("items" in schema) {
            // Case: ArraySchemaObject
            throw new Error("Not supported");
        }
        else {
            // Case: NonArraySchemaObject
            const type = schema.type;
            if (typeof type === "undefined") {
                throw new Error(`Missing 'type'`);
            }
            switch (type) {
                case "string":
                    //throw new Error(`Not yet supported`);
                    const ZodForStringSchematuple = generateZodForStringSchema(schemaId, schema);
                    //console.log(ZodForStringSchematuple.code);
                    Zodcode = ZodForStringSchematuple.code;
                    break;
                case "integer":
                    //  throw new Error(`Not yet supported`);
                    const ZodForIntegerSchematuple = generateZodForIntegerSchema(schemaId, schema);
                    // console.log(ZodForIntegerSchematuple.code);
                    Zodcode = ZodForIntegerSchematuple.code;
                    break;
                case "object":
                    // throw new Error("Not yet supported");
                    const ZodForObjectSchemaTuple = generateZodForObjectSchema(schemaId, schema);
                    Zodcode = ZodForObjectSchemaTuple.code;
                    refs = ZodForObjectSchemaTuple.refs;
                    break;
                default:
                    Zodcode = "default";
                    break;
            }
        }
    }
    // console.log(Zodcode)
    //return'';
    return `
 import * as z from 'zod';
 ${refs.map((ref) => `import {${ref}} from './${ref}'${"\n"}`).join("")}

 export const ${schemaId} = ${Zodcode}
   `.trim();
};
const main = async () => {
    const documentContent = await promises_1.default.readFile(path_1.default.join(__dirname, "../resources/roche_api.json"), "utf8");
    const document = JSON.parse(documentContent);
    console.info("Converting...");
    const schemas = document.components?.schemas ?? {};
    for (const [schemaId, schema] of Object.entries(schemas)) {
        try {
            // Case: OpenAPIV3.SchemaObject
            const generatedCode = generateZodModule(schemaId, schema);
            await promises_1.default.writeFile(path_1.default.join(__dirname, `../generated/${schemaId}.ts`), generatedCode);
        }
        catch (e) {
            // Ignore (for now)
        }
    }
    console.info("Done!");
};
main();
