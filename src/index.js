"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const prettier_1 = __importDefault(require("prettier"));
const generateZodForObjectSchema = (schemaId, schema) => {
    const properties = schema.properties ?? {};
    const generatedProps = [];
    let refs = [];
    let required = [];
    if ("required" in schema && schema.required !== undefined) {
        required = schema.required;
    }
    let gcode;
    for (const [propertyName, property] of Object.entries(properties)) {
        let generatedProp = null;
        if ("$ref" in property) {
            const val = property.$ref.split("/");
            generatedProp = generateZodForReferenceObject(propertyName, property);
            if (!refs.includes(val[3])) {
                refs.push(generateRefsForReferenceObject(generatedProp.refs, property));
            }
            refs = refs.concat(generatedProp.refs);
        }
        else if ("additionalProperties" in property) {
            const additionalProperty = property.additionalProperties ?? {};
            generatedProp = generateZodForAdditionalProp(additionalProperty);
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
                    generatedProp = generateZodForArraySchema(propertyName, property);
                    break;
                case "boolean":
                    generatedProp = generateZodForBooleanSchema(propertyName, property);
                    break;
                case "object":
                    generatedProp = generateZodForObjectSchema(propertyName, property);
                    break;
            }
        }
        if (generatedProp !== null) {
            if (required.includes(propertyName)) {
                generatedProps.push(`${propertyName}: ${generatedProp.code},`);
                refs = [...new Set([...refs, ...generatedProp.refs])];
                //refs = refs.concat(generatedProp.refs);
            }
            else {
                const optionalZodcode = `(${generatedProp.code}`.endsWith(",")
                    ? `${generatedProp.code}`.slice(0, -1)
                    : `${generatedProp.code}`;
                generatedProps.push(`${propertyName}: z.optional(${optionalZodcode}), `);
                refs = [...new Set([...refs, ...generatedProp.refs])];
                //refs = refs.concat(generatedProp.refs);
            }
        }
    }
    const code = `z.object({
  ${generatedProps.join("\n")}
})
  `.trim();
    return { code, refs };
};
const generateZodForArraySchema = (schemaId, schema) => {
    const items = schema.items ?? {};
    const generatedProps = [];
    let refs = [];
    let generatedProp = null;
    let code = "";
    if ("$ref" in items) {
        const val = items.$ref.split("/");
        generatedProp = generateZodForReferenceObject(schemaId, items);
        if (!refs.includes(val[3])) {
            refs.push(generateRefsForReferenceObject(refs, items));
        }
        refs = [...new Set([...refs, ...generatedProp.refs])];
        code = `z.array(${generatedProp.code})`;
    }
    else {
        const type = items.type;
        switch (type) {
            //NonArraySchemaType
            case "object":
                generatedProp = generateZodForObjectSchema(schemaId, items);
                code = `z.array(
          ${generatedProp.code}
        )`.trim();
                break;
            case "string":
                generatedProp = generateZodForStringSchema(schemaId, items);
                code = `z.array(
          ${generatedProp.code}
        )`.trim();
                break;
            case "boolean":
                generatedProp = generateZodForBooleanSchema(schemaId, items);
                code = `z.array(
            ${generatedProp.code}
          )`.trim();
                break;
            case "integer":
                generatedProp = generateZodForIntegerSchema(schemaId, items);
                code = `z.array(
              ${generatedProp.code}
            )`.trim();
                break;
            case "array":
                generatedProp = generateZodForArraySchema(schemaId, items);
                code = `z.array(
            ${generatedProp.code}
          )`.trim();
                break;
            default:
                generatedProp = null;
                break;
        }
        if (generatedProp !== null) {
            generatedProps.push(`${schemaId}: ${generatedProp.code}`);
            refs = [...new Set([...refs, ...generatedProp.refs])];
        }
    }
    return { code, refs };
};
const generateZodForStringSchema = (schemaId, schema) => {
    const properties = schema.properties ?? {};
    const generatedProps = [];
    const refs = [];
    let code = "";
    if ("enum" in schema) {
        schema.enum?.forEach((key, index) => {
            generatedProps.push(`'${key}',`);
            code = `z.enum([${generatedProps.join("\n")}])/*${schema.description}*/ `.trim();
        });
        // generatedProps.push(`z.enum('${}'),`)
    }
    else {
        code = `z.string(${generatedProps.join("\n")}) /*${schema.description}*/`.trim();
    }
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
    const code = `z.number(${generatedProps.join("\n")})/*${detailscomment}*/ `;
    return { code, refs };
};
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
    const code = `z.boolean(${generatedProps.join("\n")})/*${detailscomment}*/`;
    return { code, refs };
};
const generateZodForReferenceObject = (schmaID, schema) => {
    const val = schema.$ref.split("/");
    const refs = [];
    const code = `${val[3]}`;
    return { code, refs };
};
const generateRefsForReferenceObject = (refs = [], property) => {
    const val = property.$ref.split("/");
    return `${val[3]}`;
};
const generateZodForAdditionalProp = (property) => {
    const refs = [];
    let code = "";
    if (typeof property === "boolean") {
    }
    else {
        if ("items" in property && "$ref" in property.items) {
            const val = property.items.$ref.split("/");
            refs.push(val[3]);
            code = `z.record(z.array(${val[3]}))`.trim();
        }
        else {
            if ("$ref" in property) {
                const val = property.$ref.split("/");
                refs.push(val[3]);
                code = `z.record(${val[3]})`.trim();
            }
            else {
                if (property.type === "object") {
                    code = `z.record(z.${property.type}({}))`.trim();
                }
                else {
                    code = `z.record(z.${property.type}())`.trim();
                }
            }
        }
    }
    return { code, refs };
};
const generateZodModule = (schemaId, schema) => {
    // Branches...
    let Zodcode2 = "";
    let Zodcode = "";
    let refs = [];
    if ("$ref" in schema) {
        //No schema of this type in roche-openapi
    }
    else {
        if ("items" in schema) {
            // Case: ArraySchemaObject
            const ZodForArraySchematuple = generateZodForArraySchema(schemaId, schema);
            Zodcode = ZodForArraySchematuple.code;
            Zodcode2 = Zodcode.endsWith(",") ? Zodcode.slice(0, -1) : Zodcode;
            refs = ZodForArraySchematuple.refs;
        }
        else {
            // Case: NonArraySchemaObject
            const type = schema.type;
            if (typeof type === "undefined") {
                throw new Error(`Missing 'type'`);
            }
            switch (type) {
                case "string":
                    const ZodForStringSchematuple = generateZodForStringSchema(schemaId, schema);
                    Zodcode = ZodForStringSchematuple.code;
                    Zodcode2 = Zodcode.endsWith(",") ? Zodcode.slice(0, -1) : Zodcode;
                    break;
                case "integer":
                    const ZodForIntegerSchematuple = generateZodForIntegerSchema(schemaId, schema);
                    Zodcode = ZodForIntegerSchematuple.code;
                    Zodcode2 = Zodcode.endsWith(",") ? Zodcode.slice(0, -1) : Zodcode;
                    break;
                case "object":
                    const ZodForObjectSchemaTuple = generateZodForObjectSchema(schemaId, schema);
                    Zodcode = ZodForObjectSchemaTuple.code;
                    Zodcode2 = Zodcode.endsWith(",") ? Zodcode.slice(0, -1) : Zodcode;
                    refs = ZodForObjectSchemaTuple.refs;
                    break;
                default:
                    Zodcode = "default";
                    break;
            }
        }
    }
    return `
   import * as z from 'zod';
   ${refs.map((ref) => `import {${ref}} from './${ref}'${"\n"}`).join("")}

   export const ${schemaId} = ${Zodcode2};
     `.trim();
};
const main = async () => {
    const documentContent = await promises_1.default.readFile(path_1.default.join(__dirname, "../resources/roche_api.json"), "utf8");
    const document = JSON.parse(documentContent);
    console.info("Converting...");
    const schemas = document.components?.schemas ?? {};
    for (const [schemaId, schema] of Object.entries(schemas)) {
        console.log(`generate schema for ${schemaId}`);
        try {
            // Case: OpenAPIV3.SchemaObject
            const generatedCode = generateZodModule(schemaId, schema);
            await promises_1.default.writeFile(path_1.default.join(__dirname, `../generated/${schemaId}.ts`), prettier_1.default.format(generatedCode, { parser: "babel" }));
        }
        catch (e) {
            console.error(e);
        }
    }
    console.info("Done!");
};
main();
