const dataJsonSchema = {
  type: "object",
  properties: {
    _meta: {
      type: "object",
      properties: {
        version: { type: "number" }
      },
      required: ["version"]
    },
    timestamp: { type: "number" },
    preferences: {
      type: "object",
      properties: {}
    },
    token: { type: "string" },
    lists: {
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
  }
}

export default dataJsonSchema;