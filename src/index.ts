import path from "path";
import fs from "fs/promises";
import { OpenAPIV3 } from "openapi-types";
import { array, boolean, object, Schema, string, z } from "zod";
import prettier from "prettier";
import { type } from "os";

interface Result {
  code: string;
  refs: Array<string>;
  comment: string;
}

const generateZodForObjectSchema = (
  schemaId: string,
  schema: OpenAPIV3.NonArraySchemaObject
): Result => {
  const properties = schema.properties ?? {};
  const generatedProps: Array<string> = [];
  let refs: Array<string> = [];
  let required: Array<string> = [];
  let comment: string = "";

  if ("required" in schema && schema.required !== undefined) {
    required = schema.required;
  }

  for (const [propertyName, property] of Object.entries(properties)) {
    let generatedProp: Result | null = null;

    if ("$ref" in property) {
      generatedProp = generateZodForReferenceObject(property);
      if (!refs.includes(generatedProp.code)) {
        refs.push(generatedProp.code);
      }

      refs = refs.concat(generatedProp.refs);
    } else if ("additionalProperties" in property) {
      const additionalProperty = property.additionalProperties ?? {};

      generatedProp = generateZodForAdditionalProp(additionalProperty);
    } else {
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
        generatedProps.push(
          `${propertyName}: ${generatedProp.code} /*${generatedProp.comment}*/,`
        );
        refs = [...new Set([...refs, ...generatedProp.refs])];
      } else {
        const optionalZodcode = `(${generatedProp.code}`.endsWith(",")
          ? `${generatedProp.code}`.slice(0, -1)
          : `${generatedProp.code}`;

        generatedProps.push(
          `${propertyName}: z.optional(${optionalZodcode}) /*${generatedProp.comment}*/, `
        );
        refs = [...new Set([...refs, ...generatedProp.refs])];
      }
    }
  }

  const withCommaCode: string = `z.object({${generatedProps.join(
    "\n"
  )}})`.trim();
  const code: string = withCommaCode.endsWith(",")
    ? withCommaCode.slice(0, -1)
    : withCommaCode;
  comment = schema.description === undefined ? "" : schema.description;

  return { code, refs, comment };
};

const generateZodForArraySchema = (
  schemaId: string,
  schema: OpenAPIV3.ArraySchemaObject
): Result => {
  const items = schema.items ?? {};
  const generatedProps: Array<string> = [];
  let refs: Array<string> = [];
  let generatedProp: Result | null = null;
  let code: string = "";
  let comment: string = "";

  if ("$ref" in items) {
    generatedProp = generateZodForReferenceObject(items);
    if (!refs.includes(generatedProp.code)) {
      refs.push(generatedProp.code);
    }
    refs = [...new Set([...refs, ...generatedProp.refs])];
    code = `z.array(${generatedProp.code})`;
  } else {
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

const generateZodForStringSchema = (
  schemaId: string,
  schema: OpenAPIV3.NonArraySchemaObject
): Result => {
  const properties = schema.properties ?? {};

  const generatedProps: Array<string> = [];
  const refs: Array<string> = [];
  let code: string = "";
  let comment: string = "";
  if ("enum" in schema) {
    schema.enum?.forEach((key, index) => {
      generatedProps.push(`'${key}',`);
      code = `z.enum([${generatedProps.join("\n")}])`.trim();
      comment = schema.description === undefined ? "" : schema.description;
    });
  } else {
    code = `z.string(${generatedProps.join("\n")})`.trim();
    comment = schema.description === undefined ? "" : schema.description;
  }
  return { code, refs, comment };
};

const generateZodForIntegerSchema = (
  schemaId: string,
  schema: OpenAPIV3.NonArraySchemaObject
): Result => {
  const properties = schema.properties ?? {};

  const generatedProps: Array<string> = [];
  const refs: Array<string> = [];
  let comment = "";

  if ("format" in schema && "description" in schema) {
    comment = `${schema.description}'  format is: ${schema.format};`;
  } else if ("description" in schema) {
    comment = `${schema.description}`;
  } else {
    comment = "";
  }

  const code: string = `z.number(${generatedProps.join("\n")}) `;
  return { code, refs, comment };
};

const generateZodForBooleanSchema = (
  schemaId: string,
  schema: OpenAPIV3.NonArraySchemaObject
): Result => {
  const properties = schema.properties ?? {};

  const generatedProps: Array<string> = [];
  const refs: Array<string> = [];

  let comment = "";
  if ("description" in schema) {
    comment = `${schema.description}`;
  } else {
    comment = "";
  }
  const code: string = `z.boolean(${generatedProps.join("\n")})`;
  return { code, refs, comment };
};

const generateZodForReferenceObject = (
  schema: OpenAPIV3.ReferenceObject
): Result => {
  const refs: Array<string> = [];
  let comment: string = "";

  const pattern = /^#\/components\/schemas\/([a-z0-9_$]+)/i;
  const matches = schema.$ref.match(pattern);
  if (!matches) {
    throw new Error(`Reference format not supported: ${schema.$ref}`);
  }
  const code = `${matches[1]}`;

  return { code, refs, comment };
};

const generateZodForAdditionalProp = (
  property: boolean | OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): Result => {
  const refs: Array<string> = [];
  let code: string = "";
  let comment: string = "";

  if (typeof property === "boolean") {
    throw new Error("boolean type not found");
  } else {
    if ("items" in property && "$ref" in property.items) {
      const val = generateZodForReferenceObject(property.items).code;

      refs.push(val);
      code = `z.record(z.array(${val}))`.trim();
    } else {
      if ("$ref" in property) {
        const val = generateZodForReferenceObject(property).code;

        refs.push(val);
        code = `z.record(${val})`.trim();
      } else {
        if (property.type === "object") {
          code = `z.record(z.${property.type}({}))`.trim();
        } else {
          code = `z.record(z.${property.type}())`.trim();
        }
      }
    }
  }

  return { code, refs, comment };
};

const generateZodModule = (
  schemaId: string,
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): string => {
  let code: string = "";
  let refs: Array<string> = [];
  if ("$ref" in schema) {
    throw new Error("ReferenceObject schema currently not supported");
  } else {
    if ("items" in schema) {
      const zodForArraySchemaTuple: Result = generateZodForArraySchema(
        schemaId,
        schema
      );
      code = zodForArraySchemaTuple.code;
      refs = zodForArraySchemaTuple.refs;
    } else {
      const type: undefined | OpenAPIV3.NonArraySchemaObjectType = schema.type;

      if (typeof type === "undefined") {
        throw new Error(`Missing 'type'`);
      }

      switch (type) {
        case "string":
          const zodForStringSchemaTuple: Result = generateZodForStringSchema(
            schemaId,
            schema
          );

          code = zodForStringSchemaTuple.code;
          break;
        case "integer":
          const zodForIntegerSchemaTuple: Result = generateZodForIntegerSchema(
            schemaId,
            schema
          );

          code = zodForIntegerSchemaTuple.code;
          break;
        case "object":
          const zodForObjectSchemaTuple: Result = generateZodForObjectSchema(
            schemaId,
            schema
          );
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
  const documentContent = await fs.readFile(
    path.join(__dirname, "../resources/roche_api.json"),
    "utf8"
  );
  const document: OpenAPIV3.Document = JSON.parse(documentContent);

  console.info("Converting...");

  const schemas = document.components?.schemas ?? {};
  for (const [schemaId, schema] of Object.entries(schemas)) {
    console.info(`generate schema for ${schemaId}`);
    try {
      // Case: OpenAPIV3.SchemaObject
      const generatedCode = generateZodModule(schemaId, schema);
      await fs.writeFile(
        path.join(__dirname, `../generated/${schemaId}.ts`),
        prettier.format(generatedCode, { parser: "babel", singleQuote: true })
      );
    } catch (e) {
      console.error(e);
    }
  }

  console.info("Done!");
};

main();
