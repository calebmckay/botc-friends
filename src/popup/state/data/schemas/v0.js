const listsJsonSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      name: { type: "string" },
      color: {
        type: "object",
        properties: {
          r: { type: "number" },
          g: { type: "number" },
          b: { type: "number" },
          a: { type: "number" }
        },
        required: ["r", "g", "b", "a"]
      },
      users: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" }
          },
          required: ["id", "name"]
        }
      }
    },
    required: ["name", "color", "users"]
  }
}

export default listsJsonSchema;