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
    let comment = "";
    if ("required" in schema && schema.required !== undefined) {
        required = schema.required;
    }
    for (const [propertyName, property] of Object.entries(properties)) {
        let generatedProp = null;
        if ("$ref" in property) {
            generatedProp = generateZodForReferenceObject(property);
            if (!refs.includes(generatedProp.code)) {
                refs.push(generatedProp.code);
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
                generatedProps.push(`${propertyName}: ${generatedProp.code} /*${generatedProp.comment}*/,`);
                refs = [...new Set([...refs, ...generatedProp.refs])];
            }
            else {
                const optionalZodcode = `(${generatedProp.code}`.endsWith(",")
                    ? `${generatedProp.code}`.slice(0, -1)
                    : `${generatedProp.code}`;
                generatedProps.push(`${propertyName}: z.optional(${optionalZodcode}) /*${generatedProp.comment}*/, `);
                refs = [...new Set([...refs, ...generatedProp.refs])];
            }
        }
    }
    const withCommaCode = `z.object({${generatedProps.join("\n")}})`.trim();
    const code = withCommaCode.endsWith(",")
        ? withCommaCode.slice(0, -1)
        : withCommaCode;
    comment = schema.description === undefined ? "" : schema.description;
    return { code, refs, comment };
};
const generateZodForArraySchema = (schemaId, schema) => {
    const items = schema.items ?? {};
    const generatedProps = [];
    let refs = [];
    let generatedProp = null;
    let code = "";
    let comment = "";
    if ("$ref" in items) {
        generatedProp = generateZodForReferenceObject(items);
        if (!refs.includes(generatedProp.code)) {
            refs.push(generatedProp.code);
        }
        refs = [...new Set([...refs, ...generatedProp.refs])];
        code = `z.array(${generatedProp.code})`;
    }
    else {
        const type = items.type;
        switch (type) {
            case "object":
                generatedProp = generateZodForObjectSchema(schemaId, items);
                code = `z.array(
          ${generatedProp.code}
        )`.endsWith(",")
                    ? `z.array(
          ${generatedProp.code}
        )`
                        .slice(0, -1)
                        .trim()
                    : `z.array(
          ${generatedProp.code}
        )`.trim();
                break;
            case "string":
                generatedProp = generateZodForStringSchema(schemaId, items);
                code = `z.array(
          ${generatedProp.code}
        )`.endsWith(",")
                    ? `z.array(
          ${generatedProp.code}
        )`
                        .slice(0, -1)
                        .trim()
                    : `z.array(
          ${generatedProp.code}
        )`.trim();
                break;
            case "boolean":
                generatedProp = generateZodForBooleanSchema(schemaId, items);
                code = `z.array(
          ${generatedProp.code}
        )`.endsWith(",")
                    ? `z.array(
          ${generatedProp.code}
        )`
                        .slice(0, -1)
                        .trim()
                    : `z.array(
          ${generatedProp.code}
        )`.trim();
                break;
            case "integer":
                generatedProp = generateZodForIntegerSchema(schemaId, items);
                code = `z.array(
          ${generatedProp.code}
        )`.endsWith(",")
                    ? `z.array(
          ${generatedProp.code}
        )`
                        .slice(0, -1)
                        .trim()
                    : `z.array(
          ${generatedProp.code}
        )`.trim();
                break;
            case "array":
                generatedProp = generateZodForArraySchema(schemaId, items);
                code = `z.array(
          ${generatedProp.code}
        )`.endsWith(",")
                    ? `z.array(
          ${generatedProp.code}
        )`
                        .slice(0, -1)
                        .trim()
                    : `z.array(
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
    comment = schema.description === undefined ? "" : schema.description;
    return { code, refs, comment };
};
const generateZodForStringSchema = (schemaId, schema) => {
    const properties = schema.properties ?? {};
    const generatedProps = [];
    const refs = [];
    let code = "";
    let comment = "";
    if ("enum" in schema) {
        schema.enum?.forEach((key, index) => {
            generatedProps.push(`'${key}',`);
            code = `z.enum([${generatedProps.join("\n")}])`.trim();
            comment = schema.description === undefined ? "" : schema.description;
        });
    }
    else {
        code = `z.string(${generatedProps.join("\n")})`.trim();
        comment = schema.description === undefined ? "" : schema.description;
    }
    return { code, refs, comment };
};
const generateZodForIntegerSchema = (schemaId, schema) => {
    const properties = schema.properties ?? {};
    const generatedProps = [];
    const refs = [];
    let comment = "";
    if ("format" in schema && "description" in schema) {
        comment = `${schema.description}'  format is: ${schema.format};`;
    }
    else if ("description" in schema) {
        comment = `${schema.description}`;
    }
    else {
        comment = "";
    }
    const code = `z.number(${generatedProps.join("\n")}) `;
    return { code, refs, comment };
};
const generateZodForBooleanSchema = (schemaId, schema) => {
    const properties = schema.properties ?? {};
    const generatedProps = [];
    const refs = [];
    let comment = "";
    if ("description" in schema) {
        comment = `${schema.description}`;
    }
    else {
        comment = "";
    }
    const code = `z.boolean(${generatedProps.join("\n")})`;
    return { code, refs, comment };
};
const generateZodForReferenceObject = (schema) => {
    const refs = [];
    let comment = "";
    const pattern = /^#\/components\/schemas\/([a-z0-9_$]+)/i;
    const matches = schema.$ref.match(pattern);
    if (!matches) {
        throw new Error(`Reference format not supported: ${schema.$ref}`);
    }
    const code = `${matches[1]}`;
    return { code, refs, comment };
};
const generateZodForAdditionalProp = (property) => {
    const refs = [];
    let code = "";
    let comment = "";
    if (typeof property === "boolean") {
        throw new Error("boolean type not found");
    }
    else {
        if ("items" in property && "$ref" in property.items) {
            const val = generateZodForReferenceObject(property.items).code;
            refs.push(val);
            code = `z.record(z.array(${val}))`.trim();
        }
        else {
            if ("$ref" in property) {
                const val = generateZodForReferenceObject(property).code;
                refs.push(val);
                code = `z.record(${val})`.trim();
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
    return { code, refs, comment };
};
const generateZodModule = (schemaId, schema) => {
    let code = "";
    let refs = [];
    if ("$ref" in schema) {
        throw new Error("ReferenceObject schema currently not supported");
    }
    else {
        if ("items" in schema) {
            const zodForArraySchemaTuple = generateZodForArraySchema(schemaId, schema);
            code = zodForArraySchemaTuple.code;
            refs = zodForArraySchemaTuple.refs;
        }
        else {
            const type = schema.type;
            if (typeof type === "undefined") {
                throw new Error(`Missing 'type'`);
            }
            switch (type) {
                case "string":
                    const zodForStringSchemaTuple = generateZodForStringSchema(schemaId, schema);
                    code = zodForStringSchemaTuple.code;
                    break;
                case "integer":
                    const zodForIntegerSchemaTuple = generateZodForIntegerSchema(schemaId, schema);
                    code = zodForIntegerSchemaTuple.code;
                    break;
                case "object":
                    const zodForObjectSchemaTuple = generateZodForObjectSchema(schemaId, schema);
                    code = zodForObjectSchemaTuple.code;
                    refs = zodForObjectSchemaTuple.refs;
                    break;
                default:
                    code = "default";
                    break;
            }
        }
    }
    return `
   import * as z from 'zod';
   ${refs.map((ref) => `import {${ref}} from './${ref}'\n`).join("")}

   export const ${schemaId} = ${code};
   export type ${schemaId} = z.infer<typeof ${schemaId}>;
     `.trim();
};
const main = async () => {
    const documentContent = await promises_1.default.readFile(path_1.default.join(__dirname, "../resources/roche_api.json"), "utf8");
    const document = JSON.parse(documentContent);
    console.info("Converting...");
    const schemas = document.components?.schemas ?? {};
    for (const [schemaId, schema] of Object.entries(schemas)) {
        console.info(`generate schema for ${schemaId}`);
        try {
            // Case: OpenAPIV3.SchemaObject
            const generatedCode = generateZodModule(schemaId, schema);
            await promises_1.default.writeFile(path_1.default.join(__dirname, `../generated/${schemaId}.ts`), prettier_1.default.format(generatedCode, { parser: "babel", singleQuote: true }));
        }
        catch (e) {
            console.error(e);
        }
    }
    console.info("Done!");
};
main();
